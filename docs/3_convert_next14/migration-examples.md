# Next.js 14 移行実装例

## 概要

実際のコード移行例と、Pages Router から App Router への具体的な変更方法を示します。

## 1. pages/index.tsx から app/page.tsx への移行

### 移行前 (pages/index.tsx)
```tsx
import Head from "next/head";
import dynamic from "next/dynamic";
import type { NextPage } from "next";

// We cannot use SSR for our OpenCascade.js viewport,
// therefore we have to load it dynamically without SSR
// https://nextjs.org/docs/advanced-features/dynamic-import#with-no-ssr
const OCJSViewport = dynamic(
  () => import("../components/OCJSViewport"),
  { ssr: false }
);

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>OpenCascade.js Demo</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <OCJSViewport />
      </main>
    </div>
  );
}

export default Home;
```

### 移行後 (app/page.tsx)
```tsx
import { Metadata } from 'next';
import dynamic from "next/dynamic";

// We cannot use SSR for our OpenCascade.js viewport,
// therefore we have to load it dynamically without SSR
const OCJSViewport = dynamic(
  () => import("../components/OCJSViewport"),
  { ssr: false }
);

export const metadata: Metadata = {
  title: "OpenCascade.js Demo",
  description: "3D CAD modeling with OpenCascade.js and Next.js 14",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function HomePage() {
  return (
    <main>
      <OCJSViewport />
    </main>
  );
}
```

## 2. pages/_app.tsx から app/layout.tsx への移行

### 移行前 (pages/_app.tsx)
```tsx
import '../app/globals.css'
import type { AppProps } from 'next/app'

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}

export default MyApp
```

### 移行後 (app/layout.tsx)
```tsx
import './globals.css'
import { Inter } from 'next/font/google'
import { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'OpenCascade.js Demo',
    template: '%s | OpenCascade.js Demo'
  },
  description: '3D CAD modeling with OpenCascade.js and Next.js 14',
  keywords: ['3D', 'CAD', 'OpenCascade', 'WebAssembly', 'Next.js'],
  authors: [{ name: 'Your Name' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className={inter.className}>
      <body className="bg-base-100">
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
```

## 3. components/OCJSViewport.tsx の App Router 対応

### 移行前 (components/OCJSViewport.tsx)
```tsx
import { useState, useEffect } from "react";
import shapeToUrl from "../lib/shapeToUrl";
import initOpenCascade from "opencascade.js";
import "@google/model-viewer";

// Declare model-viewer as a JSX intrinsic element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': {
        class?: string;
        src?: string;
        'camera-controls'?: boolean;
      };
    }
  }
}

export default function OCJSViewport() {
  // ... 既存のロジック
}
```

### 移行後 (components/OCJSViewport.tsx)
```tsx
'use client';

import { useState, useEffect } from "react";
import shapeToUrl from "../lib/shapeToUrl";
import initOpenCascade from "opencascade.js";
import "@google/model-viewer";

// Declare model-viewer as a JSX intrinsic element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': {
        class?: string;
        src?: string;
        'camera-controls'?: boolean;
        style?: React.CSSProperties;
      };
    }
  }
}

export default function OCJSViewport() {
  const [modelUrl, setModelUrl] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOpenCascade = async () => {
      try {
        setIsLoading(true);
        const oc = await initOpenCascade();
        
        const sphere = new oc.BRepPrimAPI_MakeSphere_1(1);

        // Take shape and subtract a translated and scaled sphere from it
        const makeCut = (shape: any, translation: number[], scale: number) => {
          const tf = new oc.gp_Trsf_1();
          tf.SetTranslation_1(new oc.gp_Vec_4(translation[0], translation[1], translation[2]));
          tf.SetScaleFactor(scale);
          const loc = new oc.TopLoc_Location_2(tf);

          const cut = new oc.BRepAlgoAPI_Cut_3(shape, sphere.Shape().Moved(loc, false), new oc.Message_ProgressRange_1());
          cut.Build(new oc.Message_ProgressRange_1());

          return cut.Shape();
        };

        // Let's make some cuts
        const cut1 = makeCut(sphere.Shape(), [0, 0, 0.7], 1);
        const cut2 = makeCut(cut1, [0, 1, -0.7], 1);
        const cut3 = makeCut(cut2, [0, 0.25, 1.75], 1.825);
        const cut4 = makeCut(cut3, [4.8, 0, 0], 5);

        // Rotate around the Z axis
        const makeRotation = (rotation: number) => {
          const tf = new oc.gp_Trsf_1();
          tf.SetRotation_1(new oc.gp_Ax1_2(new oc.gp_Pnt_1(), new oc.gp_Dir_4(0, 0, 1)), rotation);
          const loc = new oc.TopLoc_Location_2(tf);
          return loc;
        };

        // Combine the result
        const fuse = new oc.BRepAlgoAPI_Fuse_3(cut4, cut4.Moved(makeRotation(Math.PI), false), new oc.Message_ProgressRange_1());
        fuse.Build(new oc.Message_ProgressRange_1());
        const result = fuse.Shape().Moved(makeRotation(-30 * Math.PI / 180), false);

        const url = shapeToUrl(oc, result);
        setModelUrl(url);
        setError(null);
      } catch (err) {
        console.error('OpenCascade initialization failed:', err);
        setError('3Dモデルの読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    loadOpenCascade();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
        <span className="ml-4 text-lg">3Dモデルを読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return modelUrl ? (
    <div className="w-full h-screen">
      <model-viewer 
        class="w-full h-full" 
        src={modelUrl} 
        camera-controls 
        style={{ width: '100%', height: '100vh' }}
      />
    </div>
  ) : null;
}
```

## 4. API Routes の移行 (pages/api → app/api)

### 移行前 (pages/api/example.ts)
```typescript
import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  message: string
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  res.status(200).json({ message: 'Hello from API' })
}
```

### 移行後 (app/api/example/route.ts)
```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Hello from API' })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // POST処理
    return NextResponse.json({ success: true, data: body })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' }, 
      { status: 400 }
    )
  }
}
```

## 5. globals.css の App Router 対応

### 移行前 (app/globals.css)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html,
body {
  padding: 0;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
}
```

### 移行後 (app/globals.css)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

html {
  height: 100%;
}

body {
  height: 100%;
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}

/* OpenCascade.js 3Dビューアー用のスタイル */
.viewport {
  width: 100%;
  height: 100vh;
}

/* model-viewer カスタムエレメント用のスタイル */
model-viewer {
  --poster-color: transparent;
  --progress-bar-color: #1976d2;
}

/* ローディング状態のスタイル */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  flex-direction: column;
  gap: 1rem;
}
```

## 6. tsconfig.json の App Router 対応

### 移行前
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### 移行後
```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## 7. next.config.mjs の最適化

### 移行前
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "raw.githubusercontent.com",
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
```

### 移行後 (Next.js 14最適化版)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@google/model-viewer'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // WASM ファイルの処理
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
      generator: {
        filename: "static/chunks/[name].[hash][ext]"
      },
    });

    // opencascade.js のための設定
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }

    return config;
  },
};

export default nextConfig;
```

## 8. package.json の更新

### 移行前
```json
{
  "name": "ocjs-create-next-app-12",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "clean": "rm -r .next"
  },
  "dependencies": {
    "@google/model-viewer": "^1.11.1",
    "next": "12.1.5",
    "opencascade.js": "2.0.0-beta.c301f5e",
    "react": "18.0.0",
    "react-dom": "18.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.15.29",
    "@types/react": "^19.1.6",
    "@types/react-dom": "^19.1.5",
    "eslint": "8.13.0",
    "eslint-config-next": "12.1.5",
    "typescript": "^5.8.3",
    "tailwindcss": "^3.4.1",
    "postcss": "^8",
    "autoprefixer": "^10",
    "daisyui": "^4.12.10"
  }
}
```

### 移行後
```json
{
  "name": "ocjs-create-next-app-14",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf .next"
  },
  "dependencies": {
    "@google/model-viewer": "^3.0.0",
    "next": "14.2.5",
    "opencascade.js": "2.0.0-beta.c301f5e",
    "react": "^18",
    "react-dom": "^18",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "eslint": "^8",
    "eslint-config-next": "14.2.5",
    "typescript": "^5",
    "tailwindcss": "^3.4.1",
    "postcss": "^8",
    "autoprefixer": "^10",
    "daisyui": "^4.12.10"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

## 9. 型定義ファイルの追加 (types/global.d.ts)

```typescript
// グローバル型定義
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': {
        class?: string;
        src?: string;
        'camera-controls'?: boolean;
        'auto-rotate'?: boolean;
        'environment-image'?: string;
        'skybox-image'?: string;
        poster?: string;
        style?: React.CSSProperties;
        onLoad?: () => void;
        onError?: (error: any) => void;
      };
    }
  }
}

// OpenCascade.js の型定義
declare module 'opencascade.js' {
  function initOpenCascade(): Promise<any>;
  export default initOpenCascade;
}

export {};
```

## 10. エラーハンドリングとログ改善

### lib/logger.ts
```typescript
// ログユーティリティ
export const logger = {
  info: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`ℹ️ ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`⚠️ ${message}`, ...args);
  },
  error: (message: string, error?: any) => {
    console.error(`❌ ${message}`, error);
    // 本番環境では外部ログサービスに送信することも可能
  },
};
```

これらの例を参考に、段階的に移行を進めてください。特に `'use client'` ディレクティブの適切な使用と、OpenCascade.js の WASM ファイル処理に注意してください。 