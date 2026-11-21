// Server Component (mặc định) — KHÔNG có "use client"
export default async function Page() {
  const data = await db.query(); // chạy trên server
  return <ClientWidget data={data} />;
}

// Client Component — bắt buộc directive ở đầu file
'use client';
export function ClientWidget({ data }: { data: Item[] }) {
  // dùng được state / effect / event
}
