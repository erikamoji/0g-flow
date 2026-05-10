import type { NextConfig } from "next";
import webpack from "webpack";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Strip node: protocol prefix so fallback can handle the bare names
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource: { request: string }) => {
          resource.request = resource.request.replace(/^node:/, "");
        })
      );
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        "fs/promises": false,
        net: false,
        tls: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
      };
    }
    return config;
  },
};

export default nextConfig;
