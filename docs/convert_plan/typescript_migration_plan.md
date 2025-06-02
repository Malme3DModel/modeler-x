# TypeScript への移行計画書

## 目的

JavaScriptベースの Next.js プロジェクトを TypeScript 化し、型安全性の向上と開発体験の改善を図る。

## 範囲

- `pages/` ディレクトリ内のファイル (App Router移行後は廃止。旧ルートはリダイレクトまたは削除を検討)
- `src/` ディレクトリ内のコンポーネントやユーティリティ
- ESLint/Prettier 設定
- CI/CD パイプライン

## 前提条件

- Node.js >= 14.x
- Next.js 12.1.5
- Git 管理下にあること

## 移行ステップ

0. ブランチ作成
   - `git checkout -b feat/typescript-migration`
   - 既存コードがビルド／テスト通過していることを確認
1. 環境セットアップ
   - TypeScript と型定義パッケージのインストール
     ```bash
     npm install --save-dev typescript @types/node @types/react @types/react-dom
     ```
   - `docs/template/tsconfig.json` をベースに `tsconfig.json` を配置・調整
   - ESLint/Prettier の TypeScript 対応プラグイン追加

2. ファイルリネーム
   - `.js` → `.ts`、`.jsx` → `.tsx` の一括リネーム
   - 例: `find . -name '*.js' -exec bash -c 'git mv "$0" "${0%.js}.ts"' {} \;` など一括リネームスクリプトを利用
   - スクリプト化や VSCode のリファクタリング機能利用

3. 型注釈の導入
   - Props や戻り値、State に型を追加
   - 外部ライブラリの型定義 (@types/xxx) を確認・インストール
   - 必要に応じて独自型定義ファイルの追加

4. ビルド・テスト実行
   - Next.js のビルド確認 (`npm run build`)
   - ESLint/型チェックエラーの解消
   - ローカル動作テスト
   - `tsc --noEmit` による型チェック実行 (npm script `type-check` を追加)

5. プロジェクト構成更新
   - `docs/template/app` → `./app`、`docs/template/components` → `./components` などテンプレートからコピー
   - テンプレートと配置先のマッピング例:

     | テンプレート                       | 配置先            |
     |------------------------------------|-------------------|
     | docs/template/app/                | ./app/            |
     | docs/template/components/         | ./components/     |
     | docs/template/lib/                | ./lib/            |
     | docs/template/utils/              | ./utils/          |
     | docs/template/types/              | ./types/          |
     | docs/template/public/             | ./public/         |
     | docs/template/tsconfig.json       | ./tsconfig.json   |
     | docs/template/next.config.mjs     | ./next.config.mjs |
     | docs/template/tailwind.config.ts  | ./tailwind.config.ts |
     | docs/template/postcss.config.mjs  | ./postcss.config.mjs |
     | docs/template/.eslintrc.json      | ./.eslintrc.json  |
     | docs/template/.gitignore          | ./.gitignore      |
     | docs/template/package.json        | ./package.json    |
     | docs/template/README.md           | ./README.md       |
   - 主要ディレクトリ: `app/`, `components/`, `lib/`, `utils/`, `types/` をルートに配置
   - 設定ファイル (`tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `.eslintrc.json`) をテンプレート版に置き換え
   - 既存コンテンツを新構成に移行

6. CI/CD 設定更新
   - GitHub Actions（`.github/workflows/ci.yml`）に `tsc --noEmit` ステップを追加
   - その他テスト・ビルドステップの修正
   - テスト・ビルドステップの修正

7. ドキュメント更新
   - README.md の「開発環境構築」「型チェック手順」「ディレクトリ構成」セクションを追記・更新
   - 開発者向けドキュメントへの反映

8. ポストチェック
   - `npm run build` が成功することを確認
   - `npm run dev` でアプリが正常に起動することを確認
   - CI がグリーンになることを確認
   - 不要ファイルが残っていないことを確認
   - プルリクエストを作成し、レビューを依頼

## マイルストーン

| マイルストーン       | 完了基準（成果物／チェック）                            | 予定時期    |
|----------------------|---------------------------------------------------------|------------|
| ブランチ作成         | `feat/typescript-migration` ブランチ作成完了             | 要見積もり |
| 環境セットアップ     | `tsconfig.json` 設置・ESLint/Prettier 設定完了            | 要見積もり |
| ファイルリネーム     | 全 `.js`→`.ts`、`.jsx`→`.tsx` のリネームスクリプト実行    | 要見積もり |
| 型注釈・ビルド修正   | `tsc --noEmit` エラーゼロ、Next.js ビルド通過            | 要見積もり |
| プロジェクト構成更新 | テンプレートから全フォルダ配置＋動作確認完了            | 要見積もり |
| CI/CD 更新           | GitHub Actions に型チェックステップ追加完了             | 要見積もり |
| ドキュメント更新     | README.md 等記述反映・PR 作成                           | 要見積もり |
| ポストチェック       | ビルド／dev 起動／CI グリーン／不要ファイル削除完了      | 要見積もり |

## リスクと対策

- 型エラーの膨大発生 → フェーズ分けして段階的に対応
- 型定義のないライブラリ → 独自定義 or `any` で暫定対応

## 完成後のディレクトリ構成

プロジェクト移行完了後の最終的なディレクトリ構成は以下の通りです:

```
.
├── app/
│   ├── page.tsx
│   └── layout.tsx
├── components/
│   └── ...
├── lib/
│   └── ...
├── utils/
│   └── ...
├── types/
│   └── ...
├── public/
│   └── ...
├── middleware.ts
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── .eslintrc.json
├── .gitignore
├── package.json
└── README.md
```

- 旧 `pages/` は廃止（必要に応じてリダイレクト設定または削除）

## フォルダの目的

- app/: Next.js App Router のページとレイアウトを配置
- components/: 再利用可能な React コンポーネントを格納
- lib/: ビジネスロジックや API クライアントなどのライブラリを配置
- utils/: 汎用的なユーティリティ関数を配置
- types/: TypeScript の型定義を管理
- public/: 画像やフォントなどの静的アセットを配置
- middleware.ts: リクエストライフサイクルのミドルウェア処理を実装
- tsconfig.json: TypeScript コンパイラの設定定義
- next.config.mjs: Next.js の設定定義
- tailwind.config.ts: Tailwind CSS の設定定義
- postcss.config.mjs: PostCSS の設定定義
- .eslintrc.json: ESLint の設定定義
- .gitignore: Git 無視ファイル定義
- package.json: 依存関係と npm スクリプトの定義
- README.md: プロジェクト概要と開発手順を記載
- pages/: App Router 移行後は廃止（旧ルートはリダイレクト設定検討）

## 実装依頼

次のAI（または実装者）に対して、以下の内容で作業を実施してください。

1. 移行ステップ（0〜8）の各フェーズを計画書どおりに順次実装すること。
2. テンプレートからのマッピング例に従い、`docs/template` 内のファイル・フォルダをプロジェクトルートに正しくコピー・配置すること。
3. ファイルリネーム、型注釈導入、ビルド・テスト、CI/CD 更新、ドキュメント更新を漏れなく実施すること。
4. マイルストーン表の「完了基準」をすべて満たすことを各フェーズの完了条件とすること。
5. 完了後は、以下のチェックリストをもとに動作確認を行い、問題なければプルリクエストを作成すること。
   - `npm run type-check` がエラーなしで通過
   - `npm run build` が成功
   - `npm run dev` でアプリが正常に起動
   - CI がグリーンであること
   - 不要ファイルが残っていないこと
6. 本ドキュメント（`docs/convert_plan/typescript_migration_plan.md`）に実装内容・差分を反映し、PR に添付すること。
7. 質問や不明点が発生した場合は、計画書の該当セクション番号を参照して問い合わせること。
8. 移行作業で使用したスクリプト（ファイルリネームスクリプト、チェック用スクリプトなど）は `docs/convert_plan/tools` フォルダに作成・配置し、PRに含めること。

--- 