import { config } from 'dotenv';
import type { Config } from 'drizzle-kit';

config({ path: ['.env.local', '.env'] });

export default {
  schema: './src/lib/db/schema-sqlite.ts',
  out: './migrations-sqlite',
  dialect: 'sqlite',
  introspect: {
    casing: 'camel'
  },
  strict: true,
  dbCredentials: {
    // eslint-disable-next-line no-process-env
    url: process.env.DATABASE_URL!
  }
} satisfies Config;
