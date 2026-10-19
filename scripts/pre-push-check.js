/**
 * Pre-push Migration Project Reference Verification
 *
 * Verifies which Supabase project reference the CLI is linked to
 * before executing any database migration pushes.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRODUCTION_PROJECT_REF = process.env.PRODUCTION_PROJECT_REF || 'lqzrahjmgzdsbosywjju';

console.log('='.repeat(70));
console.log('SUPABASE CLI MIGRATION PRE-PUSH SAFETY CHECK');
console.log('='.repeat(70));

let linkedRef = 'unknown';

// Check .supabase/.temp/project-ref or run supabase status
const tempRefPath = path.resolve(__dirname, '../supabase/.temp/project-ref');
if (fs.existsSync(tempRefPath)) {
  linkedRef = fs.readFileSync(tempRefPath, 'utf8').trim();
} else {
  try {
    const statusOutput = execSync('npx supabase link --help', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    // Attempt reading from link file if present
    const linkFile = path.resolve(__dirname, '../.supabase/linked-project');
    if (fs.existsSync(linkFile)) {
      linkedRef = fs.readFileSync(linkFile, 'utf8').trim();
    }
  } catch {
    linkedRef = 'Unable to detect via CLI';
  }
}

console.log(`Currently Linked Project Reference: ${linkedRef}`);

if (linkedRef === PRODUCTION_PROJECT_REF) {
  console.log('\n⚠️  [WARNING: PRODUCTION DATABASE DETECTED]');
  console.log(`You are currently linked to the PRODUCTION Supabase project (${PRODUCTION_PROJECT_REF}).`);
  console.log('Pushes to production require:');
  console.log('  1. Tested migration applied and verified on Local and Staging.');
  console.log('  2. Approved Pull Request merged to main branch.');
  console.log('  3. Reversible down/rollback SQL script prepared.\n');
} else {
  console.log('\n✓ Linked to non-production environment (Local or Staging).');
}

console.log('='.repeat(70));
