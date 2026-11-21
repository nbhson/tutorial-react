// admin guard trong example.tsx:
loader: () => {
  if (!localStorage.getItem("token")) throw new Response("Unauthorized", { status: 401 });
  return null; // có token mới cho render AdminPage
},
errorElement: <p>Không có quyền — bấm "Login giả" để có token rồi vào lại.</p>,
