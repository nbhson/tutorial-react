// ❌ SAI: lazy không bọc — React ném "A component suspended... Add a <Suspense> boundary"
const Heavy = lazy(() => import("./Heavy"));
return <Heavy />;
