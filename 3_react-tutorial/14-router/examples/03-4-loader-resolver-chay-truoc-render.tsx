// users/:id loader trong example.tsx: fetch trước, 404 thì throw (không render UserPage)
loader: async ({ params }) => {
  const res = await fetch(`https://jsonplaceholder.typicode.com/users/${params.id}`);
  if (!res.ok) throw new Response("Không tìm thấy user", { status: 404 });
  return res.json(); // UserPage: const user = useLoaderData() as User;
},
errorElement: <p>Không tìm thấy user (loader throw 404).</p>,
