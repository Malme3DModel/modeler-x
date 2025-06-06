import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ESLintを一時的に無効化（開発用）
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // TypeScript型チェックを一時的に無効化（開発用）
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Turbopack の設定
  turbopack: {
    rules: {
      '*.worker.js': {
        loaders: ['worker-loader'],
      },
    },
  },

  webpack: (config, { isServer }) => {
    // WebWorkerのサポート
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
      
      // 動的インポートの問題を解決
      config.module.parser = {
        ...config.module.parser,
        javascript: {
          ...config.module.parser?.javascript,
          dynamicImportMode: 'eager'
        }
      };
    }

    return config;
  },
  
  // 静的ファイルの配信設定
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
