import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  migrate: {
    async adapter() {
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set');
      }
      
      const { PrismaPg } = await import('@prisma/adapter-pg');
      const pg = await import('pg');
      
      const pool = new pg.default.Pool({ connectionString });
      return new PrismaPg(pool);
    },
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
