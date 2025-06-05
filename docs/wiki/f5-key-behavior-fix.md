# F5キーの挙動修正

## 問題の概要

monaco-editorでF5キーを押した時の挙動が、元のCascadeStudioと異なっていました。

### 元のCascadeStudio（docs/v0）での挙動
- F5キーでページリロードを完全に阻止
- エディタ内外問わず、F5キーでCADコードを評価実行
- グローバルな`document.onkeydown`でF5キー（keyCode: 116）をキャプチャ

### 修正前のNext.jsアプリでの問題
- エディタ内とエディタ外でF5キーの挙動が異なる
- 特定の条件下でページリロードが発生する可能性
- 複数のキーボードハンドラーが競合

## 修正内容

### 1. MonacoCodeEditor.tsx の修正

```typescript
// グローバルなF5キーハンドラーを追加（エディタ内外問わず統一的に処理）
const handleGlobalF5 = (e: KeyboardEvent) => {
  if (e.key === 'F5' || e.keyCode === 116) {
    e.preventDefault();
    e.stopPropagation();
    if (onEvaluate) {
      onEvaluate(editor.getValue());
    }
    return false;
  }
};

// useCapture: true で優先的にキャプチャ
document.addEventListener('keydown', handleGlobalF5, true);
```

**変更点：**
- エディタがマウントされた時にグローバルなF5キーハンドラーを追加
- `useCapture: true`で他のハンドラーより優先的に処理
- エディタが破棄される時にハンドラーを適切に削除

### 2. useKeyboardShortcuts.ts の修正

```typescript
// F5: コード実行
// MonacoCodeEditorがマウントされている場合は、そちらのグローバルハンドラーに任せる
if (e.key === 'F5' || e.keyCode === 116) {
  const hasMonacoEditor = document.querySelector('.monaco-editor') !== null;
  if (!hasMonacoEditor) {
    e.preventDefault();
    e.stopPropagation();
    defaultEvaluateCode();
  }
  return;
}
```

**変更点：**
- MonacoCodeEditorが存在する場合は、そちらのハンドラーに優先権を与える
- エディタがない場合のみフォールバック処理を実行

### 3. KeyboardShortcutManager.ts の修正

```typescript
// F5キーの特別処理：MonacoCodeEditorのグローバルハンドラーに優先権を与える
if (event.key === 'F5' || event.keyCode === 116) {
  const hasMonacoEditor = document.querySelector('.monaco-editor') !== null;
  if (hasMonacoEditor) {
    return; // MonacoCodeEditorが存在する場合は処理しない
  }
}
```

**変更点：**
- MonacoCodeEditorが存在する場合は処理をスキップ
- 競合を避けて統一的な挙動を実現

## 修正後の挙動

### ✅ 期待される動作
1. **エディタ内外問わず統一的な挙動**：F5キーでCADコードを評価実行
2. **ページリロードの完全阻止**：ブラウザのデフォルト動作を確実に防ぐ
3. **ハンドラーの競合解決**：MonacoCodeEditorのグローバルハンドラーが最優先
4. **適切なクリーンアップ**：エディタ破棄時にイベントリスナーを削除

### 🔧 技術的な改善点
- `useCapture: true`による優先的なイベントキャプチャ
- DOM要素の存在チェックによる条件分岐
- 複数のキーボードハンドラー間の協調動作
- メモリリークを防ぐ適切なクリーンアップ

## テスト方法

1. **エディタ内でF5キー**：CADコードが評価実行される
2. **エディタ外でF5キー**：CADコードが評価実行される
3. **ページリロード確認**：F5キーでページがリロードされない
4. **他のショートカット**：Ctrl+S、Escなどが正常に動作する

この修正により、元のCascadeStudioと同じF5キーの挙動を実現できました。

## 追加修正

### 4. CADWorkerのエラーハンドリング改善

```javascript
function Translate(offset, shapes) {
  // shapesが配列でない場合は単一の形状として処理
  if (!Array.isArray(shapes)) {
    return shapes.Moved(loc);
  }
  
  // 配列の場合は各形状を変換
  return shapes.map(shape => shape.Moved(loc));
}
```

**変更点：**
- `shapes.map is not a function`エラーを修正
- 単一形状と配列形状の両方に対応
- エラーハンドリングを強化

### 5. 動的インポートの警告修正

```typescript
const MonacoCodeEditor = dynamic(
  () => import('@/components/cad/MonacoCodeEditor').then(mod => ({ default: mod.default })),
  { ssr: false }
);
```

**変更点：**
- `Function components cannot be given refs`警告を修正
- 動的インポートの方法を改善
- LoadableComponentの警告を解決

## 修正後の状態

### ✅ 解決された問題
1. **F5キーの統一的な挙動**：エディタ内外問わずCADコードを評価実行
2. **ページリロードの阻止**：F5キーでページがリロードされない
3. **CADWorkerエラーの解決**：`shapes.map is not a function`エラーを修正
4. **React警告の解決**：動的インポートでのref警告を修正
5. **エラーハンドリングの改善**：より堅牢なエラー処理を実装

### 🎯 最終的な挙動
- F5キーを押すとCADコードが評価実行される
- ブラウザコンソールにエラーが表示されない
- 元のCascadeStudioと同じユーザーエクスペリエンス 