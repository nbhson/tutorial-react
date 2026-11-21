// example.tsx Counter: test hỏi "user thấy gì" sau "user làm gì":
render(<App />);
await user.click(screen.getByRole("button", { name: "+1" })); // tìm nút như user (role + tên đọc được)
expect(screen.getByText("Count: 1")).toBeInTheDocument(); // assert text user thấy
// Đổi class/style/component nội bộ mà role/text giữ -> test vẫn xanh. Đổi ".btn" query là đỏ oan.
