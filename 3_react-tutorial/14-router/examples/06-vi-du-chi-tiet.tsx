// Route có form: action xử lý POST, xong Router tự chạy lại loader route đó
{
  path: "users/:id/edit",
  action: async ({ request, params }) => {
    const form = await request.formData(); // đọc form POST
    const res = await fetch(`/api/users/${params.id}`, { method: "PUT", body: JSON.stringify(Object.fromEntries(form)) });
    if (!res.ok) throw new Response("Lưu thất bại", { status: 400 });
    return res.json(); // xong -> loader users/:id chạy lại, UI mới — ít code hơn
  },
  errorElement: <p>Lưu thất bại.</p>,
  element: <EditPage />,
}
