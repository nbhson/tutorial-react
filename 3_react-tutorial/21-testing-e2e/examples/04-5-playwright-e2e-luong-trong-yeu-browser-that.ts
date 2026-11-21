// e2e/login.spec.ts — npm init playwright@latest
import { test, expect } from "@playwright/test";
test("login thành công", async ({ page }) => {
  await page.goto("/"); // baseURL config, không hardcode localhost:5173 mỗi test
  await page.getByPlaceholder("Email").fill("a@b.com"); // auto-wait tới khi fill được
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByText("Welcome")).toBeVisible(); // poll tới khi hiện (không sleep)
});
