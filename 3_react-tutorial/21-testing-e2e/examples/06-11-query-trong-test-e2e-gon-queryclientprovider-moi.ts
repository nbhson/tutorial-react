// Minh họa E2E login một lần, tái dùng cho nhiều spec (Playwright storageState)
// // setup/login.setup.ts: login thật 1 lần, lưu vào file
// await page.getByPlaceholder("Email").fill("a@b.com");
// await page.getByRole("button", { name: "Login" }).click();
// await page.context().storageState({ path: "e2e/.auth.json" });
// // spec khác: nạp file là đã login, không fill lại
// // test.use({ storageState: "e2e/.auth.json" });
