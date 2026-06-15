import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Данные читаются из файловой системы vault на каждый запрос,
  // поэтому страницы рендерятся динамически (см. export const dynamic в page.tsx).
  async redirects() {
    return [
      {
        source: "/search",
        destination: "/kanban",
        permanent: true, // 308
      },
    ];
  },
};

export default nextConfig;
