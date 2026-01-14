import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone for better Netlify compatibility
  output: 'standalone',
  
  // Disable image optimization for Netlify (or use Netlify Image CDN)
  images: {
    unoptimized: true,
  },
  
  // Environment variables are handled by Netlify's env system
  // No need for manual .env.local loading
};

export default nextConfig;
