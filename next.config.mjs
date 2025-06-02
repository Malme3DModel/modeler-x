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
  webpack: (config, { isServer }) => {
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

    // Three.js の重複インスタンス問題を解決
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'three': 'three',
      };
      
      // Three.js の重複を避けるため、確実に単一のインスタンスを使用
      config.resolve.fallback = {
        ...config.resolve.fallback,
      };
    }

    return config;
  },
  transpilePackages: ['three'],
  experimental: {
    optimizePackageImports: ['three', '@react-three/fiber', '@react-three/drei']
  },
  // SynologyDrive環境での開発用設定
  devIndicators: {
    buildActivity: false,
  },
  generateBuildId: () => 'build'
};

export default nextConfig;
