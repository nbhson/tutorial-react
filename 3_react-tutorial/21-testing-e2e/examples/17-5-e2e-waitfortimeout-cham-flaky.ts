// ❌ SAI: nhanh thì chờ thừa, chậm thì vẫn fail
await page.waitForTimeout(1000); await expect(page.getByText("Welcome")).toBeVisible();
