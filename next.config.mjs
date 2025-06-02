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
      },
      // Three.js のために必要な設定
      {
        test: /\.(glsl|vs|fs|vert|frag)$/,
        use: ['raw-loader', 'glslify-loader']
      }
    );

    return config;
  },
  transpilePackages: ['three'],
  experimental: {
    optimizePackageImports: ['three', '@react-three/fiber', '@react-three/drei']
  }
};

export default nextConfig;
