/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
    ],
  },
  webpack: (config) => {
    config.module.rules.push(
      {
        test: /\.wasm$/,
        type: "asset/resource",
        generator: {
          filename: "static/chunks/[name].[hash][ext]"
        },
      }
    );

    return config;
  },
};

export default nextConfig;
