import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/beta',
        destination: '/collective',
        permanent: false, // 307 — keeps the old link working even if we move things again
      },
    ];
  },
};

export default nextConfig;
