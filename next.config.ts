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
      // One address per screen, so an ad or a post can send people straight
      // to the countdown or the blog: /2006/blog, /2006/countdown. The page
      // reads the last segment on load and opens that screen. The list is
      // explicit so /2006/icons/... and the other asset folders keep serving
      // files rather than the page.
      {
        source: '/2006/:screen(show|2006ers|countdown|videos|vibes|confessions|blog|playlists|play|graveyard|reminisce)',
        destination: '/2006/index.html',
      },
    ];
  },
};

export default nextConfig;
