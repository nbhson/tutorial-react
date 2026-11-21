import { useParams } from "react-router";

function UserPage() {
  const { id: raw } = useParams(); // params luôn là string | undefined
  const id = Number(raw); // ép sang số để gọi API
  // Validate sớm: id bậy thì throw 404 để errorElement hiện, không fetch bừa
  if (!Number.isInteger(id)) throw new Response("Not Found", { status: 404 });
  return <p>Trang user #{id}</p>;
}
