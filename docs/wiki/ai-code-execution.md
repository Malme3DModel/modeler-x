# AIコード実行機能

## 概要

Modeler-XのAIコード実行機能は、ChatGPTとの対話を通じて生成されたOpenCascade.jsコードを、MonacoEditorで直接実行できる革新的な機能です。この機能により、ユーザーは自然言語でCADモデリングを依頼し、生成されたコードをワンクリックで実行できます。

## アーキテクチャ

### システム構成図

```
[ユーザー] → [ChatPanel] → [OpenAI API] → [コード生成]
                ↓
[コード抽出] → [CodeExecutionService] → [MonacoEditor] → [CADワーカー] → [3Dビュー]
```

### 主要コンポーネント

1. **ChatPanel** (`src/components/ChatPanel.tsx`)
   - ユーザーとAIの対話インターフェース
   - コード抽出と実行ボタンの表示

2. **OpenAI API** (`src/app/api/chat/route.ts`)
   - 強化されたSystem Promptでコード生成を指示
   - OpenCascade.js関数の詳細な説明を含む

3. **CodeExecutionService** (`src/services/codeExecutionService.ts`)
   - ChatPanelとMonacoEditorの橋渡し
   - コードの設定と実行を管理

4. **MonacoEditor** (`src/components/MonacoEditor.tsx`)
   - TypeScriptコードエディター
   - CodeExecutionServiceとの連携

## 機能の流れ

### 1. ユーザーの質問

ユーザーがChatPanelで自然言語による質問を入力：

```
「箱と球体を組み合わせた形状を作って」
```

### 2. System Promptによる指示

OpenAI APIに送信される強化されたSystem Prompt：

```typescript
const SYSTEM_PROMPT = `あなたはCADモデリングとOpenCascade.jsの専門家です。

利用可能な主要関数：
【基本形状】
- Box(width, height, depth) - 直方体
- Sphere(radius) - 球体  
- Cylinder(radius, height, centered?) - 円柱
...

【重要なルール】
1. 必ず実行可能なTypeScriptコードで回答してください
2. コードは三重バッククォートtypescriptで囲んでください
3. 作成した形状は sceneShapes.push() で追加してください
...`;
```

### 3. AIによるコード生成

ChatGPTが実行可能なTypeScriptコードを生成：

```typescript
// 基本的な箱を作成
let box = Box(50, 30, 20);
sceneShapes.push(box);

// 球体を作成して移動
let sphere = Sphere(25);
let movedSphere = Translate([0, 0, 40], sphere);
sceneShapes.push(movedSphere);

// 箱と球体を結合
let combined = Union([box, movedSphere]);
sceneShapes.push(combined);
```

### 4. コード抽出

ChatPanelの`extractCodeFromMessage`関数がコードブロックを抽出：

```typescript
const extractCodeFromMessage = (content: string): string | null => {
  const codeBlockRegex = /```(?:typescript|ts)\n([\s\S]*?)```/g;
  const matches = content.match(codeBlockRegex);
  
  if (matches && matches.length > 0) {
    return matches[0].replace(/```(?:typescript|ts)\n/, '').replace(/```$/, '').trim();
  }
  
  return null;
};
```

### 5. UI表示

抽出されたコードが専用UIで表示：

```tsx
{message.type === 'assistant' && message.extractedCode && (
  <div className="mt-2 p-2 bg-gray-50 rounded border">
    <div className="flex items-center justify-between mb-1">
      <span className="text-xs text-gray-600 flex items-center">
        <Code size={10} className="mr-1" />
        実行可能なコード
      </span>
      <div className="flex space-x-1">
        <button onClick={() => copyToClipboard(message.extractedCode!)}>
          <Copy size={10} />
        </button>
        <button onClick={() => executeCode(message.extractedCode!)}>
          <Play size={10} className="mr-1" />
          実行
        </button>
      </div>
    </div>
    <pre className="text-xs text-gray-700 bg-white p-1 rounded border">
      <code>{message.extractedCode}</code>
    </pre>
  </div>
)}
```

### 6. コード実行

ユーザーが「実行」ボタンをクリックすると：

1. **ChatPanel**の`executeCode`関数が呼び出される
2. **CodeExecutionService**を通じてMonacoEditorにコードを設定
3. MonacoEditorの`evaluateCode`関数で実行
4. CADワーカーで3Dモデルを生成
5. 3Dビューに結果を表示

## 技術的な詳細

### コード実行の仕組み

```typescript
// ChatPanel.tsx
const executeCode = async (code: string) => {
  if (onExecuteCode) {
    onExecuteCode(code);
  } else {
    const result = await CodeExecutionService.executeCode(code);
    if (result.success) {
      console.log('コード実行成功:', result.message);
    } else {
      alert(`コード実行エラー: ${result.error}`);
    }
  }
};
```

```typescript
// CodeExecutionService.ts
static async executeCode(code: string): Promise<CodeExecutionResult> {
  const editor = this.monacoEditorRef.current;
  const currentCode = editor.getValue();
  const newCode = currentCode ? `${currentCode}\n\n// AI生成コード\n${code}` : code;
  
  editor.setValue(newCode);
  
  if (typeof editor.evaluateCode === 'function') {
    await editor.evaluateCode();
    return { success: true, message: 'コードが正常に実行されました' };
  }
}
```

### MonacoEditorとの連携

```typescript
// MonacoEditor.tsx
const handleEditorDidMount = useCallback(async (editor: any, monaco: any) => {
  // ... 初期化処理 ...
  
  // CodeExecutionServiceにエディターの参照を設定
  CodeExecutionService.setMonacoEditorRef(editorRef);
  
  // ... その他の設定 ...
}, [evaluateCode, setupEditorShortcuts, value]);
```

### メインページでの統合

```typescript
// page.tsx
const chatPanel = (
  <ChatPanel 
    onExecuteCode={(code) => {
      // AIが生成したコードをMonacoEditorに設定して実行
      handleCodeChange(code);
      // 少し遅延してから実行（エディターの更新を待つ）
      setTimeout(() => {
        handleEvaluate();
      }, 100);
    }}
  />
);
```

## 利用可能なOpenCascade.js関数

### 基本形状
- `Box(width, height, depth)` - 直方体
- `Sphere(radius)` - 球体
- `Cylinder(radius, height, centered?)` - 円柱
- `Cone(radius1, radius2, height)` - 円錐
- `Text3D(text, size, thickness, font?)` - 3Dテキスト

### 変形操作
- `Translate(offset[], shape)` - 移動
- `Rotate(axis[], degrees, shape)` - 回転
- `Scale(scale, shape)` - 拡大縮小
- `Mirror(vector[], shape)` - ミラー

### ブール演算
- `Union(shapes[])` - 結合
- `Difference(base, tools[])` - 差分
- `Intersection(shapes[])` - 交差

### 高度な操作
- `Extrude(profile, height)` - 押し出し
- `Revolve(shape, degrees?, axis?)` - 回転体
- `Loft(profiles[])` - ロフト
- `Pipe(shape, path)` - パイプ
- `FilletEdges(shape, radius, edges[])` - フィレット
- `ChamferEdges(shape, distance, edges[])` - 面取り

### GUI要素
- `Slider(name, default, min, max)` - スライダー
- `Checkbox(name, default)` - チェックボックス
- `TextInput(name, default)` - テキスト入力
- `Dropdown(name, default, options)` - ドロップダウン

## 使用例

### 基本的な使用方法

1. **質問の入力**
   ```
   「半径30の球体を作成して、その上に高さ50の円柱を配置してください」
   ```

2. **生成されるコード**
   ```typescript
   // 球体を作成
   let sphere = Sphere(30);
   sceneShapes.push(sphere);
   
   // 円柱を作成して上に移動
   let cylinder = Cylinder(15, 50);
   let movedCylinder = Translate([0, 0, 30], cylinder);
   sceneShapes.push(movedCylinder);
   ```

3. **実行**
   - 「実行」ボタンをクリック
   - 3Dビューに球体と円柱が表示される

### 複雑な形状の例

```
「歯車のような形状を作成してください。中心に穴があり、外周に8つの歯がある形状です」
```

生成されるコード：
```typescript
// 基本の円盤を作成
let baseDisk = Cylinder(40, 10, true);

// 中心の穴を作成
let centerHole = Cylinder(10, 15, true);

// 歯を作成
let teeth = [];
for (let i = 0; i < 8; i++) {
  let angle = (i * 360) / 8;
  let tooth = Box(8, 15, 10, true);
  let rotatedTooth = Rotate([0, 0, 1], angle, tooth);
  let movedTooth = Translate([45, 0, 0], rotatedTooth);
  teeth.push(movedTooth);
}

// 全ての歯を結合
let allTeeth = Union(teeth);

// 基本円盤と歯を結合
let gearWithTeeth = Union([baseDisk, allTeeth]);

// 中心の穴を開ける
let gear = Difference(gearWithTeeth, [centerHole]);

sceneShapes.push(gear);
```

## エラーハンドリング

### 一般的なエラーと対処法

1. **MonacoEditorが初期化されていない**
   ```
   エラー: MonacoEditorが初期化されていません
   対処法: ページの読み込み完了を待ってから実行
   ```

2. **コードの構文エラー**
   ```
   エラー: TypeScript構文エラー
   対処法: 生成されたコードを手動で修正
   ```

3. **OpenCascade.js関数の誤用**
   ```
   エラー: 関数の引数が不正
   対処法: 関数の仕様を確認して修正
   ```

### デバッグ方法

1. **コンソールログの確認**
   ```typescript
   console.log('実行するコード:', code);
   console.log('コード実行成功:', result.message);
   ```

2. **ステップバイステップ実行**
   - コードを部分的に実行
   - 各ステップの結果を確認

3. **手動実行**
   - コードをコピーしてMonacoEditorに貼り付け
   - 手動で実行して問題を特定

## 今後の拡張予定

### 予定されている機能

1. **コード履歴管理**
   - 実行したコードの履歴を保存
   - 過去のコードの再実行

2. **コードの最適化**
   - 生成されたコードの自動最適化
   - 冗長な処理の削除

3. **エラー自動修正**
   - 一般的なエラーの自動修正
   - AIによるコード改善提案

4. **プリセット機能**
   - よく使用される形状のプリセット
   - カスタムプリセットの作成

### 技術的な改善

1. **パフォーマンス向上**
   - コード実行の高速化
   - メモリ使用量の最適化

2. **UI/UX改善**
   - より直感的なインターフェース
   - リアルタイムプレビュー

3. **多言語対応**
   - 英語での質問対応
   - 多言語コメント生成

## まとめ

AIコード実行機能は、自然言語とプログラミングの橋渡しを行う革新的な機能です。ユーザーは複雑なCADプログラミングの知識がなくても、直感的な質問でCADモデリングを行うことができます。

この機能により、CADモデリングの敷居が大幅に下がり、より多くのユーザーが3Dモデリングを楽しむことができるようになります。 