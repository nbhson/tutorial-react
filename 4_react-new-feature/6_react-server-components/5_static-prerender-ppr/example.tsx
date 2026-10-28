// Demo prerender (react-dom/static) + Partial Prerendering (PPR) — cấu trúc theo Next 16.
// prerender(): chờ tree settle → HTML đầy đủ (build-time / SSG, KHÔNG stream sớm).
// PPR: shell tĩnh prerender lúc build; hole động (cookies/headers) stream runtime.

import { Suspense, useEffect, useState, type CSSProperties } from "react";

type Product = { slug: string; name: string; description: string };

// ── Giả lập data layer (Next 16 thật: fetch(url, { next: { revalidate: 3600 } })) ──
async function getProduct(slug: string): Promise<Product> {
  await new Promise((r) => setTimeout(r, 100)); // gần tĩnh — vào shell lúc build
  return {
    slug,
    name: "Áo thun unisex",
    description: "Cotton 100%, form regular, sản xuất tại Việt Nam.",
  };
}

// ── Mô phỏng cookies() của Next (trên server thật: (await cookies()).get("cart")) ──
const fakeCookies = () => ({ get: (_name: string) => ({ value: "2" }) });

// ── Phần TĨNH của page (PPR shell) ──
function ProductDetail({ product }: { product: Product }) {
  return (
    <article>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      {/* Trong App Router thật đây là async Server Component await trực tiếp.
          Ở đây dùng effect để demo chạy được trên client. */}
    </article>
  );
}

function StaticPart({ slug }: { slug: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  useEffect(() => {
    getProduct(slug).then(setProduct);
  }, [slug]);
  return product ? <ProductDetail product={product} /> : <p style={muted}>Loading shell...</p>;
}

// ── Phần ĐỘNG (dynamic hole): đọc cookies → không prerender được → stream runtime ──
async function fetchCartPreview(): Promise<number> {
  await new Promise((r) => setTimeout(r, 300)); // mô phỏng render hole lúc request
  return Number(fakeCookies().get("cart")?.value ?? 0);
}

function CartPreview() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    fetchCartPreview().then(setCount);
  }, []);
  return <p>Giỏ của bạn đang có {count ?? "…"} sản phẩm.</p>;
}

function CartSkeleton() {
  return <p style={muted}>Đang tải giỏ hàng... (dynamic hole — stream runtime)</p>;
}

// ── Page: ranh giới tĩnh/động do <Suspense> quyết định ──
export default function ProductPage() {
  return (
    <section>
      {/* TĨNH: ngoài Suspense, không đụng API động → prerender vào static shell (CDN) */}
      <StaticPart slug="ao-thun" />
      {/* ĐỘNG: cookies() bên trong Suspense riêng → chỉ hole này stream runtime,
          phần còn lại vẫn được phục vụ từ shell tĩnh */}
      <Suspense fallback={<CartSkeleton />}>
        <CartPreview />
      </Suspense>
    </section>
  );
}

// ── Build script thuần với react-dom/static (ngoài Next) ──
// scripts/prerender.mjs:
//   import { prerender } from "react-dom/static";
//   import fs from "node:fs";
//
//   const { prelude } = await prerender(<ProductPage />, {
//     bootstrapScripts: ["/main.js"],
//   });
//   // prerender KHÔNG phát shell sớm như renderToPipeableStream —
//   // nó chờ toàn tree (kể cả mọi Suspense) settle rồi mới trả stream đầy đủ.
//   let html = "";
//   for await (const chunk of prelude) html += String(chunk);
//   fs.writeFileSync("dist/pricing.html", html);
//
// → dist/pricing.html là static shell hoàn chỉnh: deploy CDN, mọi request phục vụ tức thì.

// ── Ghi chú PPR trong Next 16 ──
// next.config.ts:
//   const nextConfig: NextConfig = { experimental: { ppr: "incremental" } };
// app/pricing/page.tsx (đầu file):
//   export const experimental_ppr = true;
//
// Flow khi request tới /pricing:
//   1. CDN trả static shell (bảng giá prerender lúc build) — tức thì.
//   2. Server render hole "plan hiện tại" (đọc cookies) bằng streaming.
//   3. Hole xong → stream xuống thay fallback, không reload trang.
// Kết quả: TTFB như static, dữ liệu vẫn cá nhân hóa theo user.

const muted: CSSProperties = { color: "#888" };
