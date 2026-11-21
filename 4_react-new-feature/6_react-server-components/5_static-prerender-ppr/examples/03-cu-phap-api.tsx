// app/product/[slug]/page.tsx
import { Suspense } from "react";
import { cookies } from "next/headers";

// PHẦN TĨNH — không đụng API động: prerender lúc build, CDN phục vụ tức thì
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug); // fetch có cache (revalidate) — vào shell
  return (
    <article>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <Suspense fallback={<CartSkeleton />}>
        <CartInfo /> {/* dùng cookies() => DYNAMIC: hole stream lúc request */}
      </Suspense>
    </article>
  );
}
