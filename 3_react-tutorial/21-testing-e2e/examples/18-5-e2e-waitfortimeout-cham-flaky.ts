// ✅ ĐÚNG: auto-wait + retry poll (như example login)
await expect(page.getByText("Welcome")).toBeVisible(); // poll tới khi hiện/timeout config
