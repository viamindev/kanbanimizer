import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

dotenv.config({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
  override: true
})

export default defineConfig({
  schema: './src/db/schema/*',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
