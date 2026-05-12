import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
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
        "@react-native-async-storage/async-storage": false,
      };
    }
    return config;
  },
};

export default nextConfig;
