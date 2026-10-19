import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createPng(width, height, getPixelRgba) {
  const bytesPerPixel = 4;
  const scanlineLength = width * bytesPerPixel + 1; // 1 byte for filter type 0
  const rawData = Buffer.alloc(scanlineLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter type 0: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixelRgba(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * bytesPerPixel;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const typeAndData = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(typeAndData), 0);
    return Buffer.concat([len, typeAndData, crc]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Ensure public dir exists
const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Favicon SVG
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#431B21" />
      <stop offset="100%" stop-color="#2D1619" />
    </radialGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F5E5B8" />
      <stop offset="50%" stop-color="#D4AF37" />
      <stop offset="100%" stop-color="#AA820A" />
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="16" fill="url(#bg)" />
  <rect x="3" y="3" width="58" height="58" rx="13" fill="none" stroke="url(#gold)" stroke-width="1.5" stroke-opacity="0.6" />
  <!-- Brand Monogram 'N' with traditional loom warp/weft feel -->
  <path d="M18 46 L18 18 L25 18 L39 38 L39 18 L46 18 L46 46 L39 46 L25 26 L25 46 Z" fill="url(#gold)" />
</svg>`;
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg.trim(), 'utf8');
console.log('Created favicon.svg');

// 2. Square Brand Icons (180x180, 192x192, 512x512)
function renderBrandSquare(size) {
  return createPng(size, size, (x, y, w, h) => {
    // Border distance
    const distFromBorder = Math.min(x, y, w - 1 - x, h - 1 - y);
    const borderThickness = Math.max(2, Math.floor(size * 0.03));
    const pad = Math.floor(size * 0.05);

    // Deep burgundy background
    let r = 45;
    let g = 22;
    let b = 25;
    let a = 255;

    // Corner softening
    const cornerR = size * 0.18;
    const inCorner =
      (x < cornerR && y < cornerR && Math.hypot(x - cornerR, y - cornerR) > cornerR) ||
      (x > w - cornerR && y < cornerR && Math.hypot(x - (w - cornerR), y - cornerR) > cornerR) ||
      (x < cornerR && y > h - cornerR && Math.hypot(x - cornerR, y - (h - cornerR)) > cornerR) ||
      (x > w - cornerR && y > h - cornerR && Math.hypot(x - (w - cornerR), y - (h - cornerR)) > cornerR);

    if (inCorner) {
      return [0, 0, 0, 0];
    }

    // Outer subtle gold hairline border
    if (distFromBorder >= pad && distFromBorder <= pad + borderThickness) {
      return [212, 175, 55, 220]; // Gold
    }

    // Center "N" glyph geometry normalized
    const nx = x / w;
    const ny = y / h;

    // Standard monogram bounds: 0.28 to 0.72 horizontal, 0.28 to 0.72 vertical
    if (ny >= 0.28 && ny <= 0.72) {
      const stemW = 0.085;
      // Left vertical stem
      if (nx >= 0.28 && nx <= 0.28 + stemW) {
        return [212, 175, 55, 255];
      }
      // Right vertical stem
      if (nx >= 0.72 - stemW && nx <= 0.72) {
        return [212, 175, 55, 255];
      }
      // Diagonal stem: line from (0.28, 0.28) to (0.72, 0.72)
      // Ideal diagonal x for current y:
      const diagX = 0.28 + ((ny - 0.28) / (0.72 - 0.28)) * (0.72 - stemW - 0.28);
      if (nx >= diagX && nx <= diagX + stemW * 1.25) {
        return [225, 190, 75, 255];
      }
    }

    // Subtle radial gradient in background
    const dx = nx - 0.5;
    const dy = ny - 0.5;
    const radial = Math.sqrt(dx * dx + dy * dy);
    r = Math.min(65, Math.floor(45 + (1 - radial) * 15));
    g = Math.min(30, Math.floor(22 + (1 - radial) * 8));
    b = Math.min(35, Math.floor(25 + (1 - radial) * 10));

    return [r, g, b, 255];
  });
}

const icon180 = renderBrandSquare(180);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), icon180);
console.log('Created apple-touch-icon.png (180x180)');

const icon192 = renderBrandSquare(192);
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), icon192);
console.log('Created icon-192.png (192x192)');

const icon512 = renderBrandSquare(512);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), icon512);
console.log('Created icon-512.png (512x512)');

// Favicon ICO fallback (using 32x32 or 48x48 PNG embedded)
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), renderBrandSquare(48));
console.log('Created favicon.ico');

// 3. Fallback OG Image (1200 x 630)
console.log('Generating og-image.png (1200x630)...');
const ogImage = createPng(1200, 630, (x, y, w, h) => {
  const nx = x / w;
  const ny = y / h;

  // Background gradient: Deep royal burgundy with subtle warm lighting
  const radDist = Math.hypot(nx - 0.5, ny - 0.45);
  let r = Math.floor(45 + (1 - Math.min(1, radDist)) * 25);
  let g = Math.floor(22 + (1 - Math.min(1, radDist)) * 12);
  let b = Math.floor(25 + (1 - Math.min(1, radDist)) * 14);

  // Elegant decorative gold border
  const borderWidth = 18;
  const pad = 36;
  const inOuterBorder =
    (x >= pad && x <= pad + 3 && y >= pad && y <= h - pad) ||
    (x >= w - pad - 3 && x <= w - pad && y >= pad && y <= h - pad) ||
    (y >= pad && y <= pad + 3 && x >= pad && x <= w - pad) ||
    (y >= h - pad - 3 && y >= h - pad && x >= pad && x <= w - pad);

  if (inOuterBorder) {
    return [212, 175, 55, 230]; // Gold accent line
  }

  // Inner inset border
  const innerPad = pad + 12;
  const inInnerBorder =
    (x === innerPad || x === w - innerPad) && y >= innerPad && y <= h - innerPad ||
    (y === innerPad || y === h - innerPad) && x >= innerPad && x <= w - innerPad;
  if (inInnerBorder) {
    return [170, 130, 20, 160];
  }

  // Center crest / Brand Emblem (box around center)
  const emblemSize = 140;
  const emblemX = w / 2;
  const emblemY = h * 0.4;
  const ex = x - emblemX;
  const ey = y - emblemY;

  // Emblem circular gold rim
  const distFromEmblemCenter = Math.hypot(ex, ey);
  if (distFromEmblemCenter <= 70 && distFromEmblemCenter >= 66) {
    return [212, 175, 55, 255];
  }
  if (distFromEmblemCenter < 66 && distFromEmblemCenter > 63) {
    return [245, 229, 184, 255];
  }

  // Monogram N inside circular emblem
  if (Math.abs(ex) <= 32 && Math.abs(ey) <= 38) {
    const localNx = (ex + 32) / 64;
    const localNy = (ey + 38) / 76;
    const stemW = 0.16;

    if (localNx >= 0.15 && localNx <= 0.15 + stemW) return [245, 229, 184, 255];
    if (localNx >= 0.85 - stemW && localNx <= 0.85) return [245, 229, 184, 255];
    const diagX = 0.15 + localNy * (0.85 - stemW - 0.15);
    if (localNx >= diagX && localNx <= diagX + stemW * 1.3) return [212, 175, 55, 255];
  }

  // Gold accent separator bar below emblem
  if (y >= 360 && y <= 362 && x >= 420 && x <= 780) {
    return [212, 175, 55, 220];
  }
  // Small center diamond on separator
  if (y >= 357 && y <= 365 && Math.abs(x - 600) + Math.abs(y - 361) <= 6) {
    return [245, 229, 184, 255];
  }

  return [r, g, b, 255];
});

fs.writeFileSync(path.join(publicDir, 'og-image.png'), ogImage);
console.log('Created og-image.png (1200x630)');

// 4. Manifest JSON
const manifest = {
  name: "Nirai Handlooms | Where Tradition Feels Complete",
  short_name: "Nirai",
  description: "Authentic handcrafted Kanchipuram, Banarasi, Soft Silk & Pure Cotton handloom sarees direct from master weavers.",
  start_url: "/",
  display: "standalone",
  orientation: "portrait",
  background_color: "#FAF9F5",
  theme_color: "#2D1619",
  icons: [
    {
      src: "/icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any maskable"
    },
    {
      src: "/icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any maskable"
    },
    {
      src: "/apple-touch-icon.png",
      sizes: "180x180",
      type: "image/png"
    }
  ]
};
fs.writeFileSync(path.join(publicDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
console.log('Created manifest.json');
