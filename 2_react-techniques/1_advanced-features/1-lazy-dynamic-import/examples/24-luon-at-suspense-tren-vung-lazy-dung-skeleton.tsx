// ✅ ĐÚNG: một Suspense chung cho route + Suspense nhỏ cho widget
<Suspense fallback={<TrangSkeleton />}>
  <Outlet />
</Suspense>
