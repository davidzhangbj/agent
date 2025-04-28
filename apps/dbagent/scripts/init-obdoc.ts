import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const ENV_FILE = join(CURRENT_DIR, '..', '.env.local');

if (!readFileSync(ENV_FILE).length) {
  throw new Error('请先配置.env.local文件');
}

config({ path: ENV_FILE });

async function initObdoc() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20
  });

  let client;
  try {
    client = await pool.connect();

    // Read SQL file
    const sqlPath = join(CURRENT_DIR, 'oba_obdoc.sql');
    const sqlContent = readFileSync(sqlPath, 'utf-8');

    // Execute SQL
    await client.query(sqlContent);
    console.log('Successfully imported oba_obdoc.sql');
  } catch (error) {
    console.error('Error importing oba_obdoc.sql:', error);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

initObdoc().catch(console.error);
