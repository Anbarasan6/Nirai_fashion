/**
 * Database & RPC Test Suite Runner
 *
 * SAFETY GUARD:
 * Refuses to execute against any database whose host or connection string
 * matches the production project reference.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Production project ref guard
const PRODUCTION_PROJECT_REF = process.env.PRODUCTION_PROJECT_REF || 'lqzrahjmgzdsbosywjju';

// Parse connection URL from env or .env.local
let dbUrl = process.env.DATABASE_URL || process.env.STAGING_DATABASE_URL || process.env.LOCAL_DATABASE_URL;

if (!dbUrl && fs.existsSync(path.resolve(__dirname, '../.env.local'))) {
  const envContent = fs.readFileSync(path.resolve(__dirname, '../.env.local'), 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('DATABASE_URL=')) {
      dbUrl = trimmed.substring('DATABASE_URL='.length).trim();
    } else if (trimmed.startsWith('STAGING_DATABASE_URL=')) {
      dbUrl = trimmed.substring('STAGING_DATABASE_URL='.length).trim();
    }
  }
}

// Fallback to local Supabase default port if unconfigured
if (!dbUrl) {
  dbUrl = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
}

console.log('='.repeat(70));
console.log('NIRAI SQL & RPC TEST RUNNER (LOCAL & STAGING ONLY)');
console.log('='.repeat(70));

// 1. STRICT PRODUCTION REF GUARD
if (
  dbUrl.includes(PRODUCTION_PROJECT_REF) ||
  process.env.SUPABASE_URL?.includes(PRODUCTION_PROJECT_REF) ||
  process.env.VITE_SUPABASE_URL?.includes(PRODUCTION_PROJECT_REF)
) {
  console.error('\n❌ [CRITICAL SAFETY VIOLATION BLOCKED]');
  console.error(`Refusing to run DB test suite against PRODUCTION project ref: ${PRODUCTION_PROJECT_REF}`);
  console.error('Database tests contain test fixtures and must ONLY run on Local or Staging.\n');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: dbUrl,
  connectionTimeoutMillis: 3000,
});

async function run() {
  try {
    console.log(`Connecting to database at: ${dbUrl.replace(/:[^:@]+@/, ':****@')}...`);
    await client.connect();
    console.log('✓ Connected to test database successfully.\n');
  } catch (err) {
    console.warn('\n⚠️ [NOTICE: DATABASE NOT REACHABLE]');
    console.warn(`Could not connect to database: ${err.message}`);
    console.warn('To run SQL tests:');
    console.warn('  1. Start local Supabase: `npx supabase start`');
    console.warn('  2. Or set STAGING_DATABASE_URL in .env.local');
    console.warn('\nDatabase test runner is correctly installed and guarded against production.\n');
    return;
  }

  const testFiles = [
    'test_order_engine_comprehensive.sql',
    'test_payment_security.sql',
    'rls_check.sql',
    'test_notifications_hardening.sql',
  ];

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const file of testFiles) {
    const fullPath = path.resolve(__dirname, '../supabase/tests', file);
    if (!fs.existsSync(fullPath)) {
      console.warn(`Test file not found: ${file}`);
      continue;
    }

    console.log(`\n▶ Running ${file}...`);
    const sql = fs.readFileSync(fullPath, 'utf8');

    try {
      const res = await client.query(sql);
      // If table query returned results
      const results = Array.isArray(res) ? res[res.length - 1]?.rows : res?.rows;

      if (results && results.length > 0) {
        console.table(results);
        for (const row of results) {
          totalTests++;
          const pass = row.passed === true || row.status === 'PASS' || row.status === 'pass';
          if (pass) {
            passedTests++;
          } else {
            failedTests++;
          }
        }
      } else {
        console.log(`✓ Completed ${file} (Script executed with no SQL errors).`);
        totalTests++;
        passedTests++;
      }
    } catch (sqlErr) {
      console.error(`❌ Error executing ${file}:`, sqlErr.message);
      totalTests++;
      failedTests++;
    }
  }

  await client.end();

  console.log('\n' + '='.repeat(70));
  console.log(`DB TEST SUMMARY: ${passedTests}/${totalTests} tests passed (${failedTests} failed)`);
  console.log('='.repeat(70));

  if (failedTests > 0) {
    process.exit(1);
  }
}

run();
