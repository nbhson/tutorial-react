// "Skeleton có kích thước CHẮC CHẮN (khó CLS 0)"
function SkeletonCard() {
  return <div className="card skeleton" />; // width/height cố định (không "nhảy" khi data về)
}
// "data về → thay skeleton bằng card thật" (Suspense fallback = SkeletonCard)
