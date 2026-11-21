// app/product/[slug]/page.tsx — SERVER COMPONENT (Next 16, PPR bật)
import { Suspense } from "react";
import { cookies } from "next/headers";

async function getProduct(slug: string) {
  // fetch có cache/revalidate — chạy lúc BUILD, nằm trong static shell
  const res = await fetch(`${process.env.API}/products/${slug}`, {
    next: { revalidate: 3600 },
  });
  return res.json();
}

// Phần TĨNH trong shell: mọi ai xem cũng giống nhau
export default async function ProductPage({ params }: { params: Promise<{ slug }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  return (
    <article>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      {/* hole ĐỘNG: đọc cookies → không thể prerender → stream runtime */}
      <Suspense fallback={<Skeleton line />}>
        <PersonalizedSection />
      </Suspense>
    </article>
  );
}

// Phần ĐỘNG: phụ thuộc user — hole của PPR
async function PersonalizedSection() {
  const cart = (await cookies()).get("cart"); // API động => bóc phần này ra khỏi shell
  return <CartPreview count={cart ? 3 : 0} />;
}
