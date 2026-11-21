// Next.js 16 — bật PPR theo từng route
// next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    ppr: "incremental", // opt-in từng route, không bật toàn app một lúc
  },
};
