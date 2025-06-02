# TypeScript移行計画書

## 1. 目的
JavaScript版Next.jsプロジェクトをTypeScript化し、型安全性と開発効率を向上させる。  

## 2. 前提条件
- Node.jsおよびnpmがインストール済み  
- 現行プロジェクトが正常にビルド・動作している状態  

## 3. ステップ一覧
1. ブランチ作成と準備  
2. TypeScript関連パッケージの追加  
3. tsconfig.jsonの生成と設定  
4. ESLint設定の更新  
5. ファイル拡張子の変更  
6. 型定義と型注釈の導入  
7. コンポーネント・ユーティリティのリファクタリング  
8. ビルド・テスト・CIの確認  
9. ドキュメント更新  

---

## 4. 詳細手順

### 4.1 ブランチ作成と準備
```bash
git checkout -b feature/convert-to-typescript
```  
- 現行のmainブランチを最新化してから作業を開始する。  

### 4.2 TypeScript関連パッケージの追加
```bash
npm install --save-dev typescript @types/react @types/node
```  

### 4.3 tsconfig.jsonの生成と設定
```bash
npx tsc --init
```  
次の設定を有効化:  
```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "strict": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```  

### 4.4 ESLint設定の更新
- `.eslintrc.json`に以下を追加／調整:  
  - `parser`: `@typescript-eslint/parser`  
  - `plugins`: [`@typescript-eslint`]  
  - ルール: `@typescript-eslint/no-unused-vars`など  

### 4.5 ファイル拡張子の変更
- `pages/`配下の`.js` → `.tsx`  
- `src/`配下のユーティリティ・APIルートの`.js` → `.ts`  

### 4.6 型定義と型注釈の導入
- Props / State にインターフェースを定義  
- 外部APIレスポンス型を定義  
- 初期段階では`any`を許容し、段階的に厳格制約を強化する  

### 4.7 コンポーネント・ユーティリティのリファクタリング
- 型エラーを解消しつつ、コードをリファクタリング  
- 型ガードやユーティリティ型を活用  

### 4.8 ビルド・テスト・CIの確認
```bash
npm run lint
npm run build
npm run type-check  # 追加の型チェックスクリプト
```  
- GitHub ActionsやCircleCI等のCI設定ファイルに型チェックを組み込む  

### 4.9 ドキュメント更新
- README.mdにTypeScript化手順を追記  
- `docs/overview.md`に追記があれば反映  

---

## 5. スケジュール例
- Day1: 環境準備、パッケージ追加、tsconfig設定  
- Day2: 拡張子変更、基本的な型注釈  
- Day3: リファクタリング、ビルド・テスト・CI更新  

---

*完了後、必ずmainブランチへのマージ前に全テスト・型チェックが通過することを確認してください。* 