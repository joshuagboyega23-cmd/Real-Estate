import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const isGenerate = process.argv.some((arg) => arg.includes("generate"));
const datasourceUrl = isGenerate
  ? process.env.DIRECT_URL || process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy"
  : env("DIRECT_URL");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: datasourceUrl,
  },
});
