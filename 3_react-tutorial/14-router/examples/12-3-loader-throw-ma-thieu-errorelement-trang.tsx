// ✅ ĐÚNG: mỗi route data có errorElement riêng + root có chung (như example)
{ path: "users/:id", loader: fetchUser, errorElement: <p>Không tìm thấy user.</p>, element: <UserPage /> }
