// ✅ ĐÚNG: luôn await; async element thì findBy
await user.click(screen.getByRole("button", { name: "+1" }));
expect(screen.getByText("Count: 1")).toBeInTheDocument();
// Fetch: await screen.findByText("Son") (chờ, không getBy ngay)
