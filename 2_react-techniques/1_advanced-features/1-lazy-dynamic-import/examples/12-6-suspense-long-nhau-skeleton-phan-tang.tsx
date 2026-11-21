// ✅ ĐÚNG: skeleton phân tầng — trang hiện ngay, widget nào chậm thì chờ riêng
<Suspense fallback={<TrangSkeleton />}>
  <DashboardLayout />
  <Suspense fallback={<BieuDoSkeleton />}>
    <HeavyChart />
  </Suspense>
</Suspense>
