import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  poweredByHeader: false,
  // Tailwind CSS is small: inline it in <head> so first paint doesn't wait on a stylesheet request.
  experimental: {
    inlineCss: true,
  },
  // Browsers request /favicon.ico automatically; serve the icon generated from logo.svg.
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon" }];
  },
  turbopack: {
    root: import.meta.dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
