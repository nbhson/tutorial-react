// "Route lazy (Q23, critical<200KB)"
const AdminPage = React.lazy(() => import("./AdminPage"));
<Suspense fallback={<SkeletonAdmin />}>
  <AdminPage />
</Suspense>
// "Widget không cần ngay (suggestion, chart)"
const Suggestion = React.lazy(() => import("./Suggestion"));
<Suspense fallback={<SkeletonList />}>
  <Suggestion />
</Suspense>
