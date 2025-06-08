# Three.js r177 + OpenCascade.js v1.1.1 アップグレード指示書

## 現在のステータス

**✅ 完了済み**:
- Phase 1: Three.js r177アップグレード（2025年1月7日完了）
- Phase 2a: ESM基盤実装（2025年1月7日完了）  
- Phase 2b: 重大バグ修正とv1.1.1準備（2025年1月7日完了）

**🎯 現在の作業**: Phase 2 - OpenCascade.js v1.1.1完全移行

## Phase 2: OpenCascade.js v1.1.1完全移行

**ステータス**: 実装開始 🔄  
**参考資料**: [OpenCascade.js公式ドキュメント](https://ocjs.org/)

### 🚀 重要な発見: シンプルな初期化方法

[公式Hello Worldガイド](https://ocjs.org/docs/getting-started/hello-world)により、v1.1.1の初期化は非常にシンプル：

```javascript
// 公式推奨の初期化方法（シンプル）
import initOpenCascade from "opencascade.js";

async function initializeOpenCascade() {
  try {
    const oc = await initOpenCascade();
    console.log('OpenCascade.js v1.1.1 initialized successfully');
    return oc;
  } catch (error) {
    console.error('Failed to initialize OpenCascade.js v1.1.1:', error);
    throw error;
  }
}
```

### 2c.1 シンプルな初期化方法の実装

```javascript
// public/js/CascadeStudioMainWorker.v111.mjs
// v1.1.1専用ワーカーファイル（新規作成）

import initOpenCascade from "opencascade.js";

// シンプルなWASM互換性テスト関数
async function testWASMCompatibility() {
  try {
    // 公式推奨のシンプルな初期化
    const oc = await initOpenCascade();
    
    // 基本的なCAD操作テスト
    const testBox = new oc.BRepPrimAPI_MakeBox(10, 10, 10);
    const shape = testBox.Shape();
    
    if (shape && !shape.IsNull()) {
      console.log("WASM compatibility test passed (simple method)");
      return { success: true, oc };
    } else {
      throw new Error("Shape creation failed");
    }
  } catch (error) {
    console.error("WASM compatibility test failed:", error);
    return { success: false, error };
  }
}

// メイン初期化処理（シンプル版）
async function main() {
  try {
    console.log("=== OpenCascade.js v1.1.1 Worker Starting (Simple Method) ===");
    
    // シンプルなWASM互換性テスト
    const compatibilityResult = await testWASMCompatibility();
    
    if (!compatibilityResult.success) {
      throw new Error(`WASM compatibility test failed: ${compatibilityResult.error.message}`);
    }
    
    // グローバル変数に設定
    oc = compatibilityResult.oc;
    
    // フォント読み込み
    await loadFonts();
    
    // API調査
    investigateAPI();
    
    // メッセージハンドラーの設定
    onmessage = function (e) {
      let response = messageHandlers[e.data.type](e.data.payload);
      if (response) { 
        postMessage({ "type": e.data.type, payload: response }); 
      }
    };
    
    // 初期化完了通知
    postMessage({ type: "startupCallback" });
    console.log("=== OpenCascade.js v1.1.1 Worker Ready (Simple Method) ===");
    
  } catch (error) {
    console.error("v1.1.1 Worker initialization failed:", error);
    postMessage({ type: "error", payload: error.message });
  }
}

// ワーカー開始
main();
```

### 2c.2 Next.js/Webpack設定の最適化

[公式バンドラー設定ガイド](https://ocjs.org/docs/getting-started/configure-bundler)に基づく設定：

```javascript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // OpenCascade.js用のWASMファイル設定
    config.module.rules.find(k => k.oneOf !== undefined).oneOf.unshift({
      test: /\.wasm$/,
      type: "javascript/auto",
      loader: "file-loader",
      options: {
        name: "static/js/[name].[contenthash:8].[ext]",
      },
    });
    
    // OpenCascade.js用のfallback設定
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      perf_hooks: false,
      os: false,
      path: false,
      worker_threads: false,
      crypto: false,
      stream: false
    };
    
    return config;
  },
};

export default nextConfig;
```

### 2c.3 カスタムビルドによる最適化（オプション）

[カスタムビルドガイド](https://ocjs.org/docs/app-dev-workflow/custom-builds)に基づくModeler X専用ビルド：

```yaml
# modeler-x-custom.yml
mainBuild:
  name: modelerX.js
  description: "Modeler X専用軽量ビルド"
  bindings:
    # 基本的なCAD操作
    - symbol: BRepPrimAPI_MakeBox
    - symbol: BRepPrimAPI_MakeSphere
    - symbol: BRepPrimAPI_MakeCylinder
    - symbol: BRepPrimAPI_MakeCone
    - symbol: BRepPrimAPI_MakeTorus
    # ブール演算
    - symbol: BRepAlgoAPI_Fuse
    - symbol: BRepAlgoAPI_Cut
    - symbol: BRepAlgoAPI_Common
    # 変形操作
    - symbol: BRepBuilderAPI_Transform
    - symbol: gp_Trsf
    - symbol: gp_Vec
    - symbol: gp_Pnt
    - symbol: gp_Ax1
    - symbol: gp_Dir
    # 形状操作
    - symbol: TopoDS_Shape
    - symbol: BRep_Builder
    - symbol: TopoDS_Compound
    # メッシュ生成
    - symbol: BRepMesh_IncrementalMesh
    # ファイルI/O
    - symbol: STEPControl_Writer
    - symbol: STEPControl_Reader
    - symbol: STLControl_Writer
  emccFlags:
    - -O3                              # 最適化
    - -sEXPORT_ES6=1                   # ES6モジュール
    - -sUSE_ES6_IMPORT_META=0          # ES6互換性
    - -sEXPORTED_RUNTIME_METHODS=['FS'] # ファイルシステム
    - -sINITIAL_MEMORY=100MB           # 初期メモリ
    - -sMAXIMUM_MEMORY=4GB             # 最大メモリ
    - -sALLOW_MEMORY_GROWTH=1          # メモリ拡張
    - -sDISABLE_EXCEPTION_CATCHING=1   # 45%ファイルサイズ削減
    - -sUSE_FREETYPE=1                 # フォント対応

# Dockerコマンド例:
# docker run --rm -it -v "$(pwd):/src" -u "$(id -u):$(id -g)" donalffons/opencascade.js modeler-x-custom.yml
```

**期待される効果**:
- フルビルド: 48.9MB → カスタムビルド: ~7MB（未圧縮）
- 圧縮後: ~2.4MB（brotli圧縮）
- 例外処理無効化により45%のサイズ削減

### 2c.4 段階的移行戦略

```javascript
// src/lib/CascadeStudioCore.ts
// v1.1.1移行時の4段階フォールバック戦略

initWorker: () => {
  try {
    if ((window as any).cascadeStudioWorker) {
      (window as any).cascadeStudioWorker.terminate();
    }

    let worker: Worker;
    if (typeof window !== 'undefined') {
      try {
        // Phase 2-1: v1.1.1カスタムビルド（最優先）
        const customWorkerUrl = `${window.location.origin}/js/CascadeStudioMainWorker.custom.mjs`;
        worker = new Worker(customWorkerUrl, { type: 'module' });
        console.log("OpenCascade.js v1.1.1 Custom Build Worker initialized successfully");
      } catch (customError) {
        console.warn("v1.1.1 Custom Build Worker failed, falling back to standard v1.1.1:", customError);
        try {
          // Phase 2-2: v1.1.1標準ビルド
          const v111WorkerUrl = `${window.location.origin}/js/CascadeStudioMainWorker.v111.mjs`;
          worker = new Worker(v111WorkerUrl, { type: 'module' });
          console.log("OpenCascade.js v1.1.1 Standard Worker initialized successfully");
        } catch (v111Error) {
          console.warn("v1.1.1 Standard Worker failed, falling back to v0.1.15 ESM worker:", v111Error);
          try {
            // Phase 2a: v0.1.15対応ESM Workerにフォールバック
            const esmWorkerUrl = `${window.location.origin}/js/CascadeStudioMainWorker.mjs`;
            worker = new Worker(esmWorkerUrl, { type: 'module' });
            console.log("v0.1.15 ESM Worker initialized as fallback");
          } catch (esmError) {
            console.warn("ESM Worker failed, falling back to legacy worker:", esmError);
            // Phase 1: Legacy Workerにフォールバック
            const legacyWorkerUrl = `${window.location.origin}/js/CascadeStudioMainWorker.js`;
            worker = new Worker(legacyWorkerUrl);
            console.log("Legacy Worker initialized as final fallback");
          }
        }
      }
    } else {
      return null;
    }

    return worker;
  } catch (error) {
    console.error("Failed to initialize any CAD Worker:", error);
    return null;
  }
}
```

### 2c.5 実装手順（優先順位付き）

**Step 1: シンプルな初期化テスト**
```bash
# 1. v1.1.1のインストール
npm install opencascade.js@beta

# 2. シンプルな初期化テスト
# public/js/CascadeStudioMainWorker.v111.mjs を作成
```

**Step 2: Next.js設定の最適化**
```bash
# next.config.mjsの更新
# WebpackのWASM設定追加
```

**Step 3: カスタムビルドの検討（オプション）**
```bash
# Dockerを使用したカスタムビルド作成
# ファイルサイズの大幅削減
```

**Step 4: 段階的デプロイ**
```bash
# 4段階フォールバック機能のテスト
# 本番環境での段階的ロールアウト
```

## Phase 2の実装判断基準

Phase 2（v1.1.1完全移行）の実装条件：

1. **✅ 公式推奨初期化方法の確認**: シンプルな`initOpenCascade()`方法を採用
2. **✅ Next.js/Webpack設定の最適化**: 公式バンドラー設定ガイドに基づく実装
3. **🔄 シンプルな初期化テスト**: 複雑な設定なしでの基本動作確認
4. **⏸️ カスタムビルドの検討**: 必要に応じてファイルサイズ最適化（2.4MB目標）
5. **✅ 4段階フォールバック**: Custom → Standard → v0.1.15 → Legacy の段階的切り替え

**推奨アプローチ**: 
1. まずシンプルな初期化方法でのテスト実施
2. 成功した場合、段階的にv1.1.1への移行を開始
3. ファイルサイズが問題になる場合、カスタムビルドで最適化
4. 全段階でフォールバック機能により安定性確保

**期待される成果**:
- **ファイルサイズ**: 48.9MB → 2.4MB（カスタムビルド + 圧縮）
- **初期化の簡素化**: 複雑な設定不要
- **最新機能**: v1.1.1の新機能とパフォーマンス改善
- **安定性**: 4段階フォールバックによる確実な動作保証

## 参考資料

- [OpenCascade.js公式ドキュメント](https://ocjs.org/)
- [Hello Worldガイド](https://ocjs.org/docs/getting-started/hello-world)
- [バンドラー設定ガイド](https://ocjs.org/docs/getting-started/configure-bundler)
- [カスタムビルドガイド](https://ocjs.org/docs/app-dev-workflow/custom-builds)