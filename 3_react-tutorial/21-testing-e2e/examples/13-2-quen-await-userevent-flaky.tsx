// ❌ SAI: assert trước khi update xong (lúc xanh lúc đỏ)
user.click(screen.getByRole("button", { name: "+1" }));
expect(screen.getByText("Count: 1")).toBeInTheDocument(); // còn "Count: 0"
