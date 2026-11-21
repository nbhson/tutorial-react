// ✅ ĐÚNG: loader chặn trước render — không flash
import { redirect } from 'react-router-dom';
export async function adminLoader() {
  const me = await fetch('/api/me').then((r) => r.json()); // lấy user ở cổng
  if (!me?.roles?.includes('admin')) throw redirect('/403'); // thiếu quyền → chuyển hướng, không render
  return me; // đủ quyền → route con đọc qua useRouteLoaderData
}
