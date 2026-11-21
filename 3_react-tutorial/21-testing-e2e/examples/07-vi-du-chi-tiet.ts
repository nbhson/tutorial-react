// e2e/login.spec.ts — Playwright (npm init playwright@latest)
import { test, expect } from "@playwright/test";
test("login thành công", async ({ page }) => {
  await page.goto("/"); // baseURL trong playwright.config.ts
  await page.getByPlaceholder("Email").fill("a@b.com"); // auto-wait
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByText("Welcome")).toBeVisible(); // retry poll, không sleep
});
