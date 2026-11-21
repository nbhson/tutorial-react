// app/dashboard/loading.tsx — fallback CẤP ROUTE (Next tự bọc Suspense)
export default function Loading() {
  return <DashboardSkeleton />; // hiện ngay khi segment /dashboard đang render
}
