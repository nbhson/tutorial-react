// React 19.2+: export component ra để DevTools Performance track render theo boundary
export function ProfileCard() {
  return (
    // Suspense boundary xuất hiện như một track riêng trên timeline
    <Suspense fallback={<p>Đang tải…</p>}>
      <Profile />
    </Suspense>
  );
}
