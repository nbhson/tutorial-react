const user = userEvent.setup(); // v14 setup 1 lần mỗi test
await user.click(screen.getByRole("button", { name: "+1" })); // nhớ await — quên là assert chạy trước update (flaky)
await user.keyboard("Son"); // gõ như người (từng phím + onChange từng cái)
