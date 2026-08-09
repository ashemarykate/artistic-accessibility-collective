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

  async rewrites() {
    return [
      // The 2006 microsite is a self contained static page in public/2006, not
      // a React route: it has its own fonts, its own window chrome, and none of
      // the Collective design system. A rewrite (not a redirect) means the URL
      // stays artisticaccessibility.com/2006 with no trailing filename.
      //
      // Its assets live at /2006/bg.jpg and /2006/art.png and are served
      // straight from public, so the browser caches them between visits.
      {
        source: '/2006',
        destination: '/2006/index.html',
      },
    ];
  },
};

export default nextConfig;
