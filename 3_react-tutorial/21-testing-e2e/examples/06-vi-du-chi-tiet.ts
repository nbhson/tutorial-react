// vite.config.ts — test jsdom + setup jest-dom (đã ở Khái niệm, nhắc lại để copy)
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { environment: "jsdom", setupFiles: ["./src/test-setup.ts"], globals: true },
});
// src/test-setup.ts: import "@testing-library/jest-dom";
