// app/dashboard/loading.tsx — Next tự bọc segment này trong <Suspense>
export default function Loading() {
  return <DashboardSkeleton />; // hiện khi segment này (và con nó) đang stream
}
