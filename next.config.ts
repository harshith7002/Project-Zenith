import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ['three', 'react-globe.gl'],
  turbopack: {
    root: path.resolve(__dirname),
  },
} as any;

export default nextConfig;
