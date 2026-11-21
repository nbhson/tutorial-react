// ✅ ĐÚNG: hover là tải trước — bấm là có ngay
<a
  href="/dashboard"
  onMouseEnter={() => import('./pages/Dashboard')} // prefetch thủ công
  onFocus={() => import('./pages/Dashboard')}
>
  Dashboard
</a>
