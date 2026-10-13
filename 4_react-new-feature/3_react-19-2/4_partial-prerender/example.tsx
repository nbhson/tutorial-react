import { Suspense } from 'react';

// Shell tĩnh — pre-render 1 lần, cache ở CDN.
function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header>
        <h2>Shop — Partial Pre-rendering (React 19.2)</h2>
        <nav>Home | Sản phẩm | Liên hệ</nav>
      </header>
      <main>{children}</main>
    </div>
  );
}

// Hole động 1: feed cá nhân — stream sau.
async function PersonalFeed() {
  await new Promise((r) => setTimeout(r, 1200)); // giả lập query chậm
  return <p>Gợi ý cho bạn: Giày chạy bộ, Tai nghe BT</p>;
}

// Hole động 2: giỏ hàng theo session — stream sau.
async function CartBadge() {
  await new Promise((r) => setTimeout(r, 600));
  return <p>Giỏ hàng: 3 món</p>;
}

function FeedSkeleton() {
  return <p>Đang tải gợi ý...</p>;
}

// Trong Next.js PPR: export const experimental_ppr = true
// Framework tự gọi unstable_prerender(<ShopPage />),
// shell trả ngay, 2 Suspense holes stream dần.
export default function ShopPage() {
  return (
    <ShopLayout>
      <Suspense fallback={<FeedSkeleton />}>
        <PersonalFeed />
      </Suspense>
      <Suspense fallback={<p>Đang tải giỏ hàng...</p>}>
        <CartBadge />
      </Suspense>
    </ShopLayout>
  );
}
