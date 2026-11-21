// ✅ ĐÚNG: prefetch có điều kiện — chỉ route trọng yếu, lúc gần click
<a href="/analytics" onMouseEnter={() => import('./AnalyticsPage')}>Báo cáo</a>
// Hoặc Router làm sẵn: <Link to="/analytics" prefetch="viewport"> (vào viewport là tải)
