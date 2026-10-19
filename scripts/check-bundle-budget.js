import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

if (!fs.existsSync(distDir)) {
  console.error('dist directory not found. Please run `npm run build` first.');
  process.exit(1);
}

const html = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

// Find all script src and modulepreload links in index.html
const scripts = [];
const scriptMatches = html.matchAll(/<script[^>]+src="([^">]+)"/g);
for (const match of scriptMatches) {
  scripts.push(match[1]);
}
const preloadMatches = html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^">]+)"/g);
for (const match of preloadMatches) {
  scripts.push(match[1]);
}

// Deduplicate
const uniqueScripts = Array.from(new Set(scripts));

let totalRawBytes = 0;
let totalGzipBytes = 0;
const chunks = [];

for (const scriptPath of uniqueScripts) {
  // Normalize path removing leading slash
  const cleanPath = scriptPath.replace(/^\//, '');
  const filePath = path.join(distDir, cleanPath);

  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath);
    const rawSize = content.length;
    const gzipSize = zlib.gzipSync(content).length;

    totalRawBytes += rawSize;
    totalGzipBytes += gzipSize;
    chunks.push({
      name: path.basename(filePath),
      rawKb: (rawSize / 1024).toFixed(2),
      gzipKb: (gzipSize / 1024).toFixed(2),
    });
  }
}

const baselinePath = path.resolve(__dirname, '../bundle-baseline.json');
let baseline = null;
if (fs.existsSync(baselinePath)) {
  baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
}

console.log('='.repeat(65));
console.log('INITIAL FIRST-LOAD JAVASCRIPT BUDGET REPORT (/)');
console.log('='.repeat(65));
console.table(chunks);

const totalRawKb = (totalRawBytes / 1024).toFixed(2);
const totalGzipKb = (totalGzipBytes / 1024).toFixed(2);

console.log(`Total Initial JS: ${totalRawKb} kB (Raw) | ${totalGzipKb} kB (Gzip)`);

if (baseline) {
  const allowedMaxGzipKb = baseline.initialJsGzipKb * 1.10; // Max 10% growth
  console.log(`Baseline Gzip:    ${baseline.initialJsGzipKb.toFixed(2)} kB`);
  console.log(`10% Growth Limit: ${allowedMaxGzipKb.toFixed(2)} kB`);

  const growthPct = (((totalGzipBytes / 1024) - baseline.initialJsGzipKb) / baseline.initialJsGzipKb) * 100;
  console.log(`Growth vs Base:   ${growthPct >= 0 ? '+' : ''}${growthPct.toFixed(2)}%`);

  if ((totalGzipBytes / 1024) > allowedMaxGzipKb) {
    console.error(`\n❌ [BUDGET EXCEEDED] First-load JS gzip (${totalGzipKb} kB) grew more than 10% over baseline (${baseline.initialJsGzipKb} kB)!`);
    process.exit(1);
  } else {
    console.log('\n✓ Bundle budget check passed within 10% threshold.');
  }
} else {
  console.log('\nWriting initial bundle-baseline.json...');
  const newBaseline = {
    initialJsRawKb: parseFloat(totalRawKb),
    initialJsGzipKb: parseFloat(totalGzipKb),
    timestamp: new Date().toISOString(),
    chunks: chunks.map(c => c.name),
  };
  fs.writeFileSync(baselinePath, JSON.stringify(newBaseline, null, 2), 'utf8');
  console.log('Created bundle-baseline.json with current baseline numbers.');
}
