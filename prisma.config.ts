import "dotenv/config";

import { defineConfig } from "prisma/config";

// `prisma generate` does not connect. Prefer the direct URL for migrations,
// and fall back so a Vercel build can generate the client from DATABASE_URL.
const url =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@127.0.0.1:5432/postgres";

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },

  datasource: {
    url,
  },
});
