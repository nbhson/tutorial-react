// ❌ SAI: chờ thật 300ms mỗi test — suite chậm, CI flaky
await new Promise((r) => setTimeout(r, 350)); expect(...).toBe(...);
