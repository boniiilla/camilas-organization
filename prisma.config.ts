import { defineConfig } from 'prisma/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL!;

export default defineConfig({
  earlyAccess: true,
  schema: './prisma/schema.prisma',
  datasource: {
    url: connectionString,
  },
  migrate: {
    async adapter() {
      const pool = new Pool({ connectionString });
      return new PrismaPg(pool);
    },
  },
});
