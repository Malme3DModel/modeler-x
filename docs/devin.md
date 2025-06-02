# 🚀 次のAI作業者への作業指示

## 📋 現在の状況
**CascadeStudio機能移行プロジェクト フェーズ3完了 → フェーズ4移行**

### ✅ 完了済み（75%達成）
- **フェーズ1**: WebWorkerアーキテクチャ + OpenCascade.js v1.1.1統合（100%完了）
- **フェーズ2**: React Three Fiber統合改良（100%完了）  
- **フェーズ3**: Monaco Editor統合（100%完了）🎉

### 🎯 あなたのミッション：フェーズ4実装（最終25%）
**CascadeStudio機能移行プロジェクトの完全完了を目指してください**

---

## 🎯 フェーズ4実装項目（優先順位順）

### 1. 🔄 ファイルI/O機能実装（最優先）
```typescript
// 実装対象
app/api/cad/files/route.ts     # Next.js API Routes
components/cad/FileManager.tsx # ファイル管理UI
```
**目標**: STEP/STL/OBJファイルの読み込み・保存機能

### 2. 🎛️ GUI要素統合
```typescript
// 実装対象
components/cad/gui/CADSlider.tsx    # スライダー
components/cad/gui/CADButton.tsx    # ボタン
components/cad/gui/CADCheckbox.tsx  # チェックボックス
hooks/useGUIState.ts                # GUI状態管理
```
**目標**: CascadeStudio互換のGUI要素

### 3. 💾 プロジェクト管理機能
```typescript
// 実装対象
lib/project/ProjectManager.ts      # プロジェクト管理
components/cad/ProjectPanel.tsx    # プロジェクトUI
```
**目標**: プロジェクト保存/読込・履歴管理

### 4. 🔧 最終テストと最適化
**目標**: パフォーマンス最適化・エラーハンドリング強化

---

## 🛠️ 利用可能な完璧な技術基盤

### ✅ 完全動作確認済みコンポーネント
```
app/cad-editor/page.tsx          # 統合CADエディターページ
components/cad/CodeEditor.tsx    # Monaco Editor（TypeScript Intellisense対応）
components/cad/CADViewport.tsx   # 3Dビューポート（React Three Fiber）
hooks/useCADWorker.ts           # WebWorker管理（状態共有パターン確立済み）
public/workers/cadWorker.js     # CADワーカー（自動レンダリング対応）
```

### 🎨 動作確認方法
1. **開発サーバー起動**: `npm run dev`（ユーザーが手動実行）
2. **CADエディター**: `http://localhost:3000/cad-editor`
3. **動作確認**: Monaco EditorでCADコード編集→Ctrl+Enter実行→3D表示

---

## 📚 参考実装パターン

### ファイルI/O API Route例
```typescript
// app/api/cad/files/route.ts
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  // OpenCascade.jsでファイル解析
  // CAD形状データの返却
}
```

### GUI要素統合例
```typescript
// components/cad/gui/CADSlider.tsx
export default function CADSlider({ 
  name, defaultValue, min, max, onChange 
}: CADSliderProps) {
  // DaisyUIベースのスライダー
  // リアルタイム値更新
  // CADコードへの値反映
}
```

---

## 🎯 成功条件

### フェーズ4完了の判定基準
- [ ] STEP/STL/OBJファイルの正常な読み込み・保存
- [ ] 全GUI要素（Slider、Button、Checkbox、TextInput、Dropdown）の実装
- [ ] プロジェクト保存/読込機能の完全動作
- [ ] CascadeStudioの全機能をNext.js環境で再現

### 最終目標
**🏆 CascadeStudio機能移行プロジェクト100%完了**

---

## 🔧 開発環境・ツール

### 必須ツール
- **MCP browser-tools**: リアルタイムデバッグ・エラー確認
- **Next.js 14.2.5**: ポート3000で稼働想定
- **TypeScript**: 完全な型安全性確保

### 重要ルール
- **開発サーバー**: ユーザーが手動で`npm run dev`を実行（AIは実行禁止）
- **デバッグ**: MCP browser-toolsで継続的な動作確認
- **型安全性**: TypeScript型定義を活用した安全な実装

---

## 📖 参考資料

### 計画書
- `docs/5_cascadestudio_migration/migration_plan.md`（最新更新済み）
- フェーズ4詳細実装計画・技術アーキテクチャ・ベストプラクティス記載

### CascadeStudio参考実装
- `docs/template/`フォルダ（完全なCascadeStudio実装）
- 機能実装時の参考コード・API使用方法の調査に活用

---

## 🎊 期待される最終成果

### プロジェクト完了時の状態
- **完全なCADエディター**: CascadeStudio品質のNext.js CADエディター
- **モダンな技術スタック**: Next.js + TypeScript + React Three Fiber + Monaco Editor
- **高性能・拡張性**: WebWorker + OpenCascade.js統合アーキテクチャ
- **プロフェッショナルUI/UX**: TailwindCSS + DaisyUIによる美しいインターフェース

### 技術的価値
- **Next.js環境でのCAD開発**: 業界初レベルの技術的成果
- **拡張性・保守性**: 将来の機能追加に対応できる設計
- **型安全性**: TypeScriptによる堅牢な開発環境

---

**🚀 フェーズ4実装開始！CascadeStudio機能移行プロジェクトの完全完了を目指してください！**
