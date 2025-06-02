# Tailwind CSS へのスタイル移行計画書

## 目的
既存の`styles`フォルダ内CSS（`globals.css`, `Home.module.css`）を、`docs/template`で採用しているTailwind CSS形式に統一し、保守性・拡張性・デザイン一貫性を向上させる。

---

## 現状把握
### 1. 既存CSSの利用状況
- `styles/globals.css`: 全体のリセット・共通スタイル
- `styles/Home.module.css`: Home画面のレイアウト・装飾

### 2. `docs/template`のスタイル方式
- Tailwind CSS（`@tailwind base; @tailwind components; @tailwind utilities;`）
- DaisyUIによるテーマ拡張
- PostCSS, tailwind.config.ts, package.jsonでの設定済み

---

## 移行方針
1. **Tailwindの導入**
   - 既に`docs/template`で導入済みのため、同様のセットアップを他ディレクトリにも適用。
2. **既存CSSのTailwind化**
   - `globals.css`のリセット・共通スタイルをTailwindユーティリティで再現。
   - `Home.module.css`の各クラスを、Tailwindのユーティリティクラスへ変換。
   - メディアクエリやホバー等もTailwindの記法で置換。
3. **CSSファイルの整理**
   - 変換後、不要なCSSファイルは削除。
   - 必要に応じて`app/globals.css`等にTailwind用のカスタムスタイルを追加。
4. **コンポーネントの修正**
   - JSX/TSX内の`className`をTailwind形式に書き換え。
   - モジュールCSSのimportを削除。
5. **動作確認・デザインレビュー**
   - 画面ごとにデザイン崩れがないか確認。
   - 必要に応じてカスタムユーティリティやテーマ拡張を検討。

---

## マイルストーン
1. 現状CSSのTailwind変換リストアップ
2. Tailwindユーティリティへの置換作業
3. コンポーネント修正・テスト
4. 不要CSS削除・最終レビュー

---

## 備考
- DaisyUIテーマの活用も推奨。
- Tailwindのカスタム設定は`docs/template/tailwind.config.ts`を参照。
- 既存デザインの再現性を重視しつつ、Tailwindのベストプラクティスを適用。 