# Next.js 14 への移行計画書

## 目的

Next.js 12.1.5 から Next.js 14.2.5 へのバージョンアップグレードを実施し、最新機能の活用とパフォーマンス向上、セキュリティアップデートの適用を図る。

## 範囲

- Next.js フレームワークのバージョンアップグレード (12.1.5 → 14.2.5)
- React のバージョンアップグレード (18.0.0 → ^18)  
- Pages Router から App Router への移行
- 依存関係の最新化とセキュリティ更新
- 設定ファイルの更新 (next.config.mjs, tsconfig.json, ESLint設定等)
- ビルドシステムとCIの対応

## 前提条件

- Node.js >= 18.x (Next.js 14の要件)
- TypeScript 化が完了していること
- Git 管理下にあること
- opencascade.js ライブラリの互換性確認

## 現状分析

### 現在の設定
- **Next.js**: 12.1.5
- **React**: 18.0.0
- **アーキテクチャ**: Pages Router
- **主要ライブラリ**: 
  - opencascade.js: 2.0.0-beta.c301f5e
  - @google/model-viewer: ^1.11.1
- **スタイリング**: Tailwind CSS, DaisyUI
- **TypeScript**: 完了済み

### テンプレート構成 (Next.js 14)
- **Next.js**: 14.2.5  
- **React**: ^18
- **アーキテクチャ**: App Router
- **認証**: NextAuth v5
- **追加ライブラリ**: zod, jwt-decode

## 移行ステップ

### 0. 事前準備
- ブランチ作成: `git checkout -b feat/next14-migration`
- 現在のコードのバックアップとテスト実行確認
- opencascade.js の Next.js 14 互換性調査

### 1. 依存関係の更新

#### パッケージアップデート
```bash
npm install next@14.2.5 react@^18 react-dom@^18
npm install --save-dev @types/react@^18 @types/react-dom@^18 eslint-config-next@14.2.5
```

#### 追加パッケージ（テンプレートベース）
```bash
npm install zod@^3.23.8 jwt-decode@^4.0.0
npm install --save-dev @types/node@^20 typescript@^5
```

### 2. 設定ファイルの更新

#### 2.1 next.config.mjs の更新
現在の設定（WASM対応）を維持しつつ、Next.js 14向けに最適化:
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

#### 2.2 tsconfig.json の更新
テンプレートベースの設定に更新し、App Router対応:
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

### 3. Pages Router から App Router への移行

#### 3.1 ディレクトリ構造の変更

**移行マッピング:**
| 現在 (Pages Router) | 移行後 (App Router) |
|---------------------|---------------------|
| `pages/index.tsx` | `app/page.tsx` |
| `pages/_app.tsx` | `app/layout.tsx` |
| `pages/api/*` | `app/api/*/route.ts` |
| `app/globals.css` | `app/globals.css` (更新) |

#### 3.2 ファイル移行詳細

**`pages/index.tsx` → `app/page.tsx`:**
- デフォルトエクスポートの React コンポーネントとして移行
- メタデータは `metadata` エクスポートまたは `generateMetadata` で定義

**`pages/_app.tsx` → `app/layout.tsx`:**
- ルートレイアウトとして移行
- `<html>`, `<body>` タグを含む構造に変更
- グローバルスタイルのインポート

**API Routes:**
- `pages/api/*` → `app/api/*/route.ts`
- Named exports (GET, POST等) の形式に変更

#### 3.3 新しいapp構造
```
app/
├── page.tsx           # ホームページ (旧 pages/index.tsx)
├── layout.tsx         # ルートレイアウト (旧 pages/_app.tsx)
├── globals.css        # グローバルスタイル
├── favicon.ico        # ファビコン
└── api/               # API Routes
    └── */
        └── route.ts   # API エンドポイント
```

### 4. コンポーネントとライブラリの対応

#### 4.1 opencascade.js の対応
- Next.js 14での動作確認
- 必要に応じてdynamic import の調整
- WASM ローディングの最適化

#### 4.2 @google/model-viewer の対応  
- App Router環境での動作確認
- クライアントコンポーネント（'use client'）の適用検討

### 5. 認証システムの検討（オプション）

テンプレートにはNextAuth v5が含まれているため、認証機能が必要な場合:
- NextAuth v5 の導入
- `auth.ts` と `middleware.ts` の設定
- 認証フローの実装

### 6. スタイリングの確認

#### 6.1 Tailwind CSS 設定
- `tailwind.config.ts` をテンプレート版で更新
- DaisyUI の互換性確認

#### 6.2 CSS の移行
- `app/globals.css` の更新
- 既存スタイルの App Router 対応

### 7. ビルド・テスト・CI対応

#### 7.1 ビルドプロセス確認
```bash
npm run build        # プロダクションビルド
npm run dev          # 開発サーバー
npm run type-check   # TypeScript チェック
```

#### 7.2 CI/CD 更新
- GitHub Actions の Node.js バージョン更新 (18.x)
- Next.js 14 対応のビルドステップ確認

### 8. 互換性とパフォーマンス確認

#### 8.1 機能テスト
- 3Dモデルビューアーの動作確認
- WASM ローディングの確認
- レスポンシブデザインの確認

#### 8.2 パフォーマンス測定
- Core Web Vitals の測定
- ビルドサイズの比較
- ロード時間の測定

## マイルストーン

| マイルストーン | 完了基準 | 予定時期 |
|---------------|----------|----------|
| 事前準備 | ブランチ作成、互換性調査完了 | 要見積もり |
| 依存関係更新 | package.json 更新、install 完了 | 要見積もり |
| 設定ファイル更新 | next.config.mjs、tsconfig.json 更新完了 | 要見積もり |
| App Router 移行 | pages/ → app/ 移行完了 | 要見積もり |
| ライブラリ対応 | opencascade.js、model-viewer 動作確認 | 要見積もり |
| スタイリング確認 | Tailwind、DaisyUI 動作確認 | 要見積もり |
| ビルド・テスト | 全ビルドプロセス通過確認 | 要見積もり |
| パフォーマンステスト | 機能・性能テスト完了 | 要見積もり |

## リスクと対策

### 高リスク
- **opencascade.js 互換性**: WASM ライブラリの Next.js 14 対応
  - 対策: 段階的テスト、必要に応じてdynamic import 調整
- **Pages Router → App Router 移行**: アーキテクチャの大幅変更
  - 対策: 段階的移行、並行テスト実施

### 中リスク  
- **@google/model-viewer 対応**: クライアントサイドライブラリの対応
  - 対策: 'use client' ディレクティブ適用
- **スタイリング崩れ**: CSS の App Router 対応
  - 対策: 移行前後のビジュアル比較テスト

### 低リスク
- **TypeScript 型エラー**: 依存関係更新による型エラー
  - 対策: 段階的な型修正

## 完成後のディレクトリ構成

```
.
├── app/
│   ├── page.tsx              # メインページ
│   ├── layout.tsx            # ルートレイアウト
│   ├── globals.css           # グローバルスタイル
│   ├── favicon.ico           # ファビコン
│   └── api/                  # API Routes (App Router 形式)
│       └── */
│           └── route.ts
├── components/               # 再利用可能コンポーネント
├── lib/                      # ビジネスロジック・ライブラリ
├── utils/                    # ユーティリティ関数
├── types/                    # TypeScript 型定義
├── public/                   # 静的アセット
├── middleware.ts             # ミドルウェア (オプション)
├── next.config.mjs           # Next.js 設定 (WASM対応維持)
├── tsconfig.json             # TypeScript 設定 (App Router対応)
├── tailwind.config.ts        # Tailwind CSS 設定
├── postcss.config.mjs        # PostCSS 設定
├── package.json              # 依存関係 (Next.js 14)
└── README.md                 # プロジェクトドキュメント
```

## 特記事項

### opencascade.js への特別対応
本プロジェクトは3D CADライブラリ `opencascade.js` を使用しているため、以下の点に特に注意が必要です:

1. **WASM ローディング**: App Router でのWebAssembly ファイル読み込み確認
2. **クライアントサイド実行**: 'use client' ディレクティブの適切な配置
3. **dynamic import**: 必要に応じてコンポーネントの動的インポート

### model-viewer への対応
Google の model-viewer カスタムエレメントの App Router での動作確認が必要です:

1. **カスタムエレメント登録**: App Router での Web Components 対応
2. **型定義**: TypeScript でのカスタムエレメント型定義
3. **SSR 対応**: サーバーサイドレンダリングでのカスタムエレメント処理

## 実装依頼

次のAI（または実装者）に対して、以下の内容で作業を実施してください:

1. **移行ステップ（0〜8）を計画書に従って順次実行**
2. **opencascade.js と @google/model-viewer の互換性を重点的に確認**
3. **WASM ファイルの適切な処理を維持**
4. **マイルストーン表の完了基準をすべて満たすこと**
5. **完了後のチェックリスト実行:**
   - `npm run build` 成功
   - `npm run dev` 正常起動
   - 3Dビューアー機能動作確認
   - TypeScript 型チェック通過
   - CI/CD パイプライン通過
6. **移行で使用したスクリプトを `docs/4_convert_next14/tools/` に配置**
7. **本ドキュメントに実装結果を追記してPRに添付**

---

## 実装結果

<!-- 実装完了後にここに結果を記載 --> 