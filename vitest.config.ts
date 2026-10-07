import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { include: ["tests/**/*.test.ts"], env: { SESSION_SECRET: "x".repeat(40), HIDDEN_CODE_KEY: "y".repeat(40), DATABASE_URL: "postgresql://unused" } },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
