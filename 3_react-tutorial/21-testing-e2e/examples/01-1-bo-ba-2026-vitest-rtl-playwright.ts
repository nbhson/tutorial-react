// vite.config.ts — Vitest dùng chung config Vite (alias, plugin) nên không config 2 nơi:
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    environment: "jsdom", // DOM giả (nhanh, không browser) cho unit/integration
    setupFiles: ["./src/test-setup.ts"], // 1 dòng: import "@testing-library/jest-dom" (toBeInTheDocument)
    globals: true, // test/expect/describe toàn cục (khỏi import mỗi file) + auto-cleanup
  },
});
// src/test-setup.ts: import "@testing-library/jest-dom"; // matcher DOM thân thiện
