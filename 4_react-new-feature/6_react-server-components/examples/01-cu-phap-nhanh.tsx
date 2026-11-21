// Server Component (mặc định) — async, truy cập DB/secret
export default async function Page() {
  const items = await db.query();
  return <ClientWidget items={items} />; // props phải serializable
}
