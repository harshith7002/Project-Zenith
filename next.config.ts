import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ['three', 'react-globe.gl'],
  turbopack: {
    root: path.resolve(__dirname),
  },
  webpack: (config: any, { isServer, webpack }: any) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        worker_threads: false,
        module: false,
        fs: false,
        path: false,
      };
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^(node:module|node:worker_threads)$/,
          (resource: any) => {
            resource.request = path.resolve(__dirname, 'src/lib/empty.ts');
          }
        )
      );
    }
    return config;
  },
} as any;

export default nextConfig;
