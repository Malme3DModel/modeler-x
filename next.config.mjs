/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  reactStrictMode: isProd,
  output: 'export',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
    ],
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // WASM ファイルサポート
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

    // OpenCascade.js サポート
    if (!isServer) {
      // Three.js の重複インスタンス問題を解決
      config.resolve.alias = {
        ...config.resolve.alias,
        'three': 'three',
      };
      
      // WebWorker環境でのNode.jsモジュール無効化
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        perf_hooks: false,
        os: false,
        worker_threads: false,
      };
    }

    // OpenCascade.js ファイルを static/chunks に配置
    config.module.rules.push({
      test: /opencascade\.full\.(js|wasm)$/,
      type: "asset/resource",
      generator: {
        filename: "static/chunks/[name][ext]"
      }
    });

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
  generateBuildId: () => 'build',
  // GitHub Pages用の設定
  basePath: process.env.NODE_ENV === 'production' ? '/modeler-x' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/modeler-x' : '',
};

export default nextConfig;
