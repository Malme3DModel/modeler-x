# 🎯 CascadeStudio移行作業 - フェーズ1.2実装指示書

## 📋 作業概要

**作業名**: フェーズ1.2 - MatCapマテリアルとライティング設定の改善  
**優先度**: 🔴 高  
**期間**: 3日  
**担当者**: 次期AI作業者  

## 🎯 作業目的

ホバーハイライト機能の実装が完了したため、次のステップとして「MatCapマテリアルとライティング設定の改善」を実装してください。現在は標準的なMeshStandardMaterialが使用されていますが、元のCascadeStudioと同等の見た目を実現するためにMatCapマテリアルを実装し、適切なライティング設定を行います。これにより、3Dオブジェクトの視覚的品質が向上し、ユーザー体験が改善されます。

**重要**: 実装完了後、必ずテストを作成・実行し、全テストがパスしてから完了とします。

## 📚 必須参考資料

### 1. 移行計画書
- **`docs/7_cascadestudio_migration/README.md`** - 全体概要
- **`docs/7_cascadestudio_migration/feature_comparison.md`** - 機能比較表（3Dビューポート機能部分を確認）
- **`docs/7_cascadestudio_migration/implementation_tasks.md`** - タスク1.2.1〜1.2.3の詳細

### 2. 元のCascadeStudio実装
- **`docs/template/js/MainPage/CascadeView.js`** - 元のマテリアル・ライティング実装（200-250行目付近）
- **`docs/template/textures/dullFrontLitMetal.png`** - 元のMatCapテクスチャ
- マテリアル設定とライティング設定の詳細を確認してください

### 3. 現在の実装
- **`components/threejs/ThreeJSViewport.tsx`** - 修正対象メインファイル
- **`components/threejs/ThreeJSModel.tsx`** - 3Dモデル表示コンポーネント
- **`tests/raycasting.spec.ts`** - 既存のレイキャスティングテスト

## 🔧 具体的な作業内容

### タスク1: MatCapマテリアルの実装

**対象ファイル**: `components/threejs/materials/MatCapMaterial.tsx` (新規作成)

#### 1.1 MatCapマテリアルコンポーネントの作成
```typescript
import { useMemo } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';

interface MatCapMaterialProps {
  color?: string;
  opacity?: number;
  transparent?: boolean;
}

export function useMatCapMaterial({ 
  color = '#f5f5f5', 
  opacity = 1.0, 
  transparent = false 
}: MatCapMaterialProps = {}) {
  const matcapTexture = useLoader(
    THREE.TextureLoader, 
    '/textures/dullFrontLitMetal.png'
  );
  
  return useMemo(() => {
    const material = new THREE.MeshMatcapMaterial({
      matcap: matcapTexture,
      color: color,
      transparent: transparent,
      opacity: opacity,
    });
    
    return material;
  }, [matcapTexture, color, opacity, transparent]);
}
```

#### 1.2 テクスチャファイルのコピー
元のテクスチャファイル `docs/template/textures/dullFrontLitMetal.png` を `public/textures/` ディレクトリにコピーします。

```bash
# ディレクトリの作成（存在しない場合）
mkdir -p public/textures

# テクスチャファイルのコピー
cp docs/template/textures/dullFrontLitMetal.png public/textures/
```

### タスク2: ThreeJSModelコンポーネントの修正

**対象ファイル**: `components/threejs/ThreeJSModel.tsx`

#### 2.1 MatCapマテリアルの統合
```typescript
import { useMatCapMaterial } from './materials/MatCapMaterial';

// 既存のコンポーネント内で
export default function ThreeJSModel({ geometry, edges, ...props }) {
  // MatCapマテリアルを使用
  const matcapMaterial = useMatCapMaterial({ 
    color: '#f5f5f5',
    transparent: props.transparent || false,
    opacity: props.opacity || 1.0
  });
  
  // 既存のマテリアル定義を置き換え
  // const material = new THREE.MeshStandardMaterial({ ... }); ← 削除
  
  return (
    <group {...props}>
      <mesh geometry={geometry} material={matcapMaterial}>
        {/* 既存の子要素 */}
      </mesh>
      {edges && (
        <lineSegments geometry={edges}>
          <lineBasicMaterial color="#000000" />
        </lineSegments>
      )}
    </group>
  );
}
```

### タスク3: ライティング設定の改善

**対象ファイル**: `components/threejs/ThreeJSViewport.tsx`

#### 3.1 ライティング設定の修正
```typescript
// 既存のライティング設定を以下に置き換え
<Canvas
  // 既存のprops
>
  {/* 環境光 */}
  <ambientLight intensity={0.3} />
  
  {/* 半球光 - 元の実装に合わせる */}
  <hemisphereLight 
    position={[0, 1, 0]} 
    args={['#ffffff', '#444444', 1]} 
  />
  
  {/* 平行光源 */}
  <directionalLight 
    position={[3, 10, 10]} 
    intensity={0.8} 
    castShadow 
    shadow-mapSize-width={2048} 
    shadow-mapSize-height={2048} 
  />
  
  {/* その他の既存コンポーネント */}
</Canvas>
```

#### 3.2 シャドウ設定の改善
```typescript
// Canvasコンポーネントに追加
<Canvas
  shadows
  camera={{ position: [10, 10, 10], fov: 50 }}
  // 既存のprops
>
  {/* 既存の内容 */}
</Canvas>

// 地面コンポーネントにシャドウ設定を追加（存在する場合）
<mesh 
  receiveShadow 
  rotation={[-Math.PI / 2, 0, 0]} 
  position={[0, -0.5, 0]}
>
  <planeGeometry args={[100, 100]} />
  <shadowMaterial opacity={0.2} />
</mesh>
```

### タスク4: フォグ機能の実装

**対象ファイル**: `components/threejs/ThreeJSViewport.tsx`

#### 4.1 動的フォグの実装
```typescript
// バウンディングボックスに基づくフォグ距離の計算
const calculateFogDistance = (boundingBox: THREE.Box3) => {
  if (!boundingBox) return { near: 50, far: 200 };
  
  const size = new THREE.Vector3();
  boundingBox.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  
  return {
    near: maxDim * 2,
    far: maxDim * 5
  };
};

// コンポーネント内で
const [fogSettings, setFogSettings] = useState({ near: 50, far: 200 });

// バウンディングボックスの更新時にフォグ設定を更新
useEffect(() => {
  if (boundingBox) {
    setFogSettings(calculateFogDistance(boundingBox));
  }
}, [boundingBox]);

// Canvasコンポーネント内でフォグを設定
<Canvas
  // 既存のprops
>
  <fog attach="fog" args={['#f0f0f0', fogSettings.near, fogSettings.far]} />
  
  {/* 既存の内容 */}
</Canvas>
```

### タスク5: 背景色の設定

**対象ファイル**: `components/threejs/ThreeJSViewport.tsx`

#### 5.1 背景色の設定
```typescript
// Canvasコンポーネントに背景色を設定
<Canvas
  gl={{ 
    antialias: true,
    outputEncoding: THREE.sRGBEncoding 
  }}
  // 既存のprops
>
  <color attach="background" args={['#222222']} />
  
  {/* 既存の内容 */}
</Canvas>
```

## 🧪 テスト実装

### タスク6: マテリアルとライティングのテスト

**新規作成ファイル**: `tests/material-lighting.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('3Dビューポート マテリアルとライティング', () => {
  test.beforeEach(async ({ page }) => {
    // アプリケーションにアクセス
    await page.goto('http://localhost:3000');
    
    // ローディングが完了するまで待機
    await page.waitForSelector('[data-testid="loading-spinner"]', { state: 'hidden', timeout: 60000 });
    
    // 3Dビューポートが表示されるまで待機
    await page.waitForSelector('[data-testid="cascade-3d-viewport"]', { timeout: 10000 });
  });

  test('MatCapマテリアルが正しく適用されている', async ({ page }) => {
    // スクリーンショットを取得して視覚的に確認
    await page.screenshot({ path: 'test-results/matcap-material.png', fullPage: true });
    
    // マテリアルの種類を確認
    const materialInfo = await page.evaluate(() => {
      return (window as any).cascadeTestUtils?.getMaterialInfo();
    });
    
    // マテリアルがMeshMatcapMaterialであることを確認
    expect(materialInfo?.type).toBe('MeshMatcapMaterial');
  });

  test('ライティング設定が正しく適用されている', async ({ page }) => {
    // ライトの情報を取得
    const lightInfo = await page.evaluate(() => {
      return (window as any).cascadeTestUtils?.getLightingInfo();
    });
    
    // 必要なライトが存在することを確認
    expect(lightInfo?.hasHemisphereLight).toBe(true);
    expect(lightInfo?.hasDirectionalLight).toBe(true);
    expect(lightInfo?.hasAmbientLight).toBe(true);
  });

  test('フォグが正しく設定されている', async ({ page }) => {
    // フォグの設定を確認
    const fogInfo = await page.evaluate(() => {
      return (window as any).cascadeTestUtils?.getFogInfo();
    });
    
    expect(fogInfo?.hasFog).toBe(true);
    expect(fogInfo?.fogColor).toBe('#f0f0f0');
  });
});
```

### タスク7: テスト用ユーティリティの追加

**対象ファイル**: `components/threejs/ThreeJSViewport.tsx`

```typescript
// テスト用のアクセス機能を追加
useEffect(() => {
  // 既存のcascadeTestUtilsに追加
  (window as any).cascadeTestUtils = {
    ...(window as any).cascadeTestUtils || {},
    
    // マテリアル情報を取得
    getMaterialInfo: () => {
      const meshes = scene.children.filter(child => 
        child.type === 'Mesh' || 
        (child.type === 'Group' && child.children.some(c => c.type === 'Mesh'))
      );
      
      if (meshes.length === 0) return null;
      
      const mesh = meshes[0].type === 'Mesh' ? 
        meshes[0] : 
        meshes[0].children.find(c => c.type === 'Mesh');
      
      if (!mesh || !mesh.material) return null;
      
      return {
        type: mesh.material.type,
        color: (mesh.material as THREE.MeshMatcapMaterial).color?.getHexString(),
        hasMatcap: !!(mesh.material as THREE.MeshMatcapMaterial).matcap
      };
    },
    
    // ライティング情報を取得
    getLightingInfo: () => {
      const lights = scene.children.filter(child => 
        child.type.includes('Light')
      );
      
      return {
        lightCount: lights.length,
        hasHemisphereLight: lights.some(light => light.type === 'HemisphereLight'),
        hasDirectionalLight: lights.some(light => light.type === 'DirectionalLight'),
        hasAmbientLight: lights.some(light => light.type === 'AmbientLight')
      };
    },
    
    // フォグ情報を取得
    getFogInfo: () => {
      return {
        hasFog: !!scene.fog,
        fogType: scene.fog?.type,
        fogColor: scene.fog ? `#${(scene.fog as THREE.Fog).color.getHexString()}` : null,
        fogNear: (scene.fog as THREE.Fog)?.near,
        fogFar: (scene.fog as THREE.Fog)?.far
      };
    }
  };
  
  return () => {
    // 既存のクリーンアップ処理を保持
  };
}, [scene]);
```

## 🧪 テスト実行

### タスク8: テスト実行とパス確認

#### 8.1 開発サーバーの起動
```bash
npm run dev
```

#### 8.2 テストの実行
```bash
# 新しいテストの実行
npx playwright test tests/material-lighting.spec.ts

# 既存のテストも含めて全テストを実行
npx playwright test
```

## ✅ 完了条件

### 必須条件
1. **機能実装完了**:
   - MatCapマテリアルが正しく実装され、テクスチャが表示される
   - ライティング設定が元のCascadeStudioと同等に設定されている
   - フォグ機能が正しく動作している
   - 背景色が適切に設定されている

2. **テスト実装完了**:
   - マテリアルとライティングのテストが作成されている
   - テスト用のユーティリティ関数が実装されている
   - 既存のテストが引き続きパスしている

3. **視覚的確認**:
   - 3Dオブジェクトが元のCascadeStudioと同等の見た目になっている
   - ライティングとシャドウが適切に表示されている
   - フォグ効果が適切に表示されている

### 確認方法
1. **機能確認**:
   - アプリケーションを起動して3Dオブジェクトを表示
   - MatCapマテリアルが適用されていることを視覚的に確認
   - ライティングとシャドウが適切に表示されていることを確認
   - フォグ効果が距離に応じて適切に表示されていることを確認

2. **テスト確認**:
   - `npx playwright test tests/material-lighting.spec.ts` でテストがパス
   - `npx playwright test` で全テストがパス
   - テストスクリーンショットで視覚的な確認

## 🚨 注意事項

### パフォーマンス
- テクスチャのサイズと解像度に注意
- 不要なライトやエフェクトを避ける
- メモリリークを防ぐためにテクスチャを適切に解放

### 互換性
- React Three Fiberの最新バージョンとの互換性を確認
- Three.jsのバージョンに対応したAPIを使用
- SSR（サーバーサイドレンダリング）との互換性に注意

### テスト環境
- テクスチャのロードは非同期処理なので適切に待機
- スクリーンショットテストは環境によって結果が異なる可能性がある
- OpenCascade.jsの読み込みエラーに対応したエラーハンドリングを実装

### 既存機能への影響
- ホバーハイライト機能が引き続き動作することを確認
- レイキャスティング機能への影響がないことを確認
- パフォーマンスが低下していないことを確認

## 📁 作業完了時の提出物

1. **新規作成ファイル**:
   - `components/threejs/materials/MatCapMaterial.tsx`
   - `public/textures/dullFrontLitMetal.png`
   - `tests/material-lighting.spec.ts`

2. **修正ファイル**:
   - `components/threejs/ThreeJSViewport.tsx`
   - `components/threejs/ThreeJSModel.tsx`

3. **テスト実行結果**:
   - テスト実行のスクリーンショット
   - パスしたテストの一覧

4. **視覚的確認結果**:
   - 実装前後の3Dビューポートのスクリーンショット比較
   - 異なる角度からの見た目の確認

## 🔄 次のステップ

この実装が完了したら、次は**フェーズ2: 高度な3D機能**の実装に進みます。特に「トランスフォームハンドル（ギズモ）の実装」が最優先項目となります。

## 💬 質問・相談

実装中に不明点があれば：
1. 元のCascadeView.jsの該当部分を詳細確認
2. 機能比較表で元の仕様を確認
3. React Three FiberとThree.jsのドキュメントを参照
4. MatCapマテリアルのサンプルコードを参考にする

**重要**: 
- 視覚的な品質は元のCascadeStudioと同等以上を目指してください
- テストは必ず実装し、全てパスさせてください
- 既存機能（特にホバーハイライト）を壊さないよう注意してください

---
**作業開始**: 即座に開始可能  
**完了予定**: 3日以内（テスト含む）  
**完了条件**: 機能実装 + 全テストパス + 視覚的確認  
**レビュー**: 完了時に動作確認とテスト結果を確認

---

**🚀 CascadeStudio移行プロジェクトの次のマイルストーン達成を目指してください！** 