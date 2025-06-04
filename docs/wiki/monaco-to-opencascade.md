# Monaco Editor から OpenCascade へのスクリプト実行フロー

このドキュメントでは、Monaco Editor で入力したCADスクリプトがどのように OpenCascade に渡され、3D形状として処理・表示されるのか、その仕組みを詳しく解説します。

---

## 全体の流れ

1. **ユーザーが Monaco Editor でスクリプトを入力**
2. **「実行」ボタンやショートカットでスクリプトを実行**
3. **スクリプトが WebWorker（OpenCascadeワーカー）に送信される**
4. **WebWorker 内でスクリプトが OpenCascade API を使って実行される**
5. **生成された形状がメッシュ化され、3Dビューに表示される**

---

## 詳細な処理フロー

### 1. Monaco Editor でのスクリプト入力
- `components/cad/CodeEditor.tsx` で Monaco Editor が表示されます。
- ユーザーは TypeScript 風のCADスクリプト（例: `Box(10, 10, 10, true);`）を入力します。

### 2. スクリプトの実行
- 実行ボタンや `Ctrl+Enter` で `handleExecuteCode` が呼ばれます。
- ここで `executeCADCode(code)` が呼び出されます。

### 3. WebWorker へのスクリプト送信
- `hooks/useCADWorker.ts` の `executeCADCode` 関数で、
  ```ts
  workerRef.current.postMessage({
    type: 'Evaluate',
    payload: { code, GUIState: ... }
  });
  ```
  という形で、スクリプトが WebWorker（`public/workers/cadWorker.js`）に送信されます。

### 4. WebWorker 内でのスクリプト実行
- `public/workers/cadWorker.js` で、
  ```js
  messageHandlers["Evaluate"] = function(payload) {
    const func = new Function(`\n${payload.code}\n`);
    func();
    // ...
  }
  ```
  という形で、受け取ったスクリプト（`payload.code`）を `new Function` で実行します。
- ここで `Box` や `Sphere` などの関数はグローバルに定義されており、スクリプト内から呼び出せます。
- 実行結果の形状は `sceneShapes` に格納され、OpenCascade のAPIで処理されます。

### 5. 形状のメッシュ化と表示
- 生成された形状は自動的にメッシュ化され、Three.js などの3Dビューで表示されます。
- エラーやログはメインスレッドに送信され、エディタ下部などに表示されます。

---

## 図解

```mermaid
graph TD;
    A[Monaco Editor<br>（ユーザー入力）] -->|実行| B[executeCADCode()]
    B -->|postMessage| C[WebWorker<br>（cadWorker.js）]
    C -->|new Functionで実行| D[OpenCascade API]
    D -->|形状生成| E[sceneShapes]
    E -->|メッシュ化| F[3Dビューに表示]
```

---

## 参考：主な関連ファイル

- `components/cad/CodeEditor.tsx` … Monaco Editor のUIと実行ボタン
- `hooks/useCADWorker.ts` … WebWorkerへのスクリプト送信ロジック
- `public/workers/cadWorker.js` … OpenCascadeワーカー本体、スクリプトの実行・形状生成

---

## よくある質問

### Q. どんな関数がスクリプト内で使える？
A. `Box`, `Sphere`, `Cylinder`, `Union`, `Difference` など、OpenCascadeのラッパー関数がグローバルで定義されています。

### Q. セキュリティは大丈夫？
A. `new Function` でスクリプトを実行しているため、悪意のあるコードには注意が必要です。WebWorker内で実行されるため、ある程度の隔離はされていますが、さらなる対策が必要な場合もあります。

---

## まとめ

Monaco Editor で入力したスクリプトは、`CodeEditor.tsx` → `useCADWorker.ts` → `public/workers/cadWorker.js` の順で渡され、最終的にWebWorker内で OpenCascade のAPIを使って3D形状として実行・表示されます。 