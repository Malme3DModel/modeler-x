# 🎯 CascadeStudio移行作業 - カメラアニメーション改良実装指示書

## 📋 作業概要

**作業名**: カメラアニメーション改良実装  
**優先度**: 🔴 高  
**担当者**: あなた  
**期限**: 1週間以内

## 🎯 作業目的

フェーズ2.2のカメラコントロール高度機能の一部として、既に基本実装済みのカメラアニメーション機能を改良します。現在は基本的なカメラアニメーションが動作していますが、よりスムーズな遷移とバウンディングボックスに基づく適切なカメラ距離計算が必要です。この改良により、ユーザーエクスペリエンスが向上し、様々なサイズのCADモデルに対して最適な視点を提供できるようになります。

## 📚 必須参考資料

### 1. 現在の実装状況
- **`components/cad/CameraControls.tsx`**: 現在のカメラコントロールUI実装
- **`hooks/useCameraAnimation.ts`**: 現在のカメラアニメーションフック
- **`components/threejs/ThreeJSViewport.tsx`**: ビューポートとの統合

### 2. 機能比較・タスク詳細
- **`docs/7_cascadestudio_migration/feature_comparison.md`**: カメラ機能の実装状況
- **`docs/7_cascadestudio_migration/implementation_tasks.md`**: タスク2.2の詳細

### 3. テスト実装
- **`tests/camera-controls.spec.ts`**: 既存のカメラコントロールテスト

## 🔍 現在の課題

1. **アニメーションの滑らかさ**
   - 現在のアニメーションは基本的に動作するが、より滑らかなイージング関数が必要
   - 長距離移動時のカメラアニメーション速度が一定で不自然

2. **バウンディングボックス計算**
   - 複雑なオブジェクトや大きなモデルに対する距離計算の最適化が必要
   - 空のシーンやエラー状態での適切な処理が不足

3. **パフォーマンス**
   - アニメーション中のフレームレート低下の改善
   - メモリ使用量の最適化

## 🔧 具体的な作業内容

### タスク1: useCameraAnimation.tsの改良

**対象ファイル**: `hooks/useCameraAnimation.ts`

#### 1.1 高度なイージング関数の実装
```typescript
// イージング関数の改良
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t: number): number => 
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutElastic = (t: number): number => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0
    ? 0
    : t === 1
    ? 1
    : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

// 距離に基づく動的なアニメーション時間計算
const calculateDuration = (start: THREE.Vector3, end: THREE.Vector3): number => {
  const distance = start.distanceTo(end);
  // 最小500ms、最大2000ms、距離に応じて線形に増加
  return Math.min(2000, Math.max(500, distance * 50));
};
```

#### 1.2 動的アニメーション速度の実装
```typescript
const animateToPosition = useCallback((
  position: THREE.Vector3, 
  target: THREE.Vector3,
  durationOverride?: number
) => {
  if (!controls || !camera) return;

  const startPosition = camera.position.clone();
  const startTarget = controls.target.clone();
  
  // 距離に基づく動的な時間計算
  const duration = durationOverride || calculateDuration(startPosition, position);
  
  let progress = 0;
  const startTime = Date.now();

  const animate = () => {
    const elapsed = Date.now() - startTime;
    progress = Math.min(elapsed / duration, 1);
    
    // より滑らかなイージング関数
    const eased = easeOutCubic(progress);
    
    camera.position.lerpVectors(startPosition, position, eased);
    controls.target.lerpVectors(startTarget, target, eased);
    
    controls.update();
    
    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      // アニメーション完了時のクリーンアップ
      animationRef.current = undefined;
    }
  };

  // 既存のアニメーションをキャンセル
  if (animationRef.current) {
    cancelAnimationFrame(animationRef.current);
  }
  
  animate();
}, [camera, controls]);
```

#### 1.3 バウンディングボックス計算の改良
```typescript
const fitToObject = useCallback((boundingBox: THREE.Box3 | null) => {
  if (!controls || !camera || !boundingBox || boundingBox.isEmpty()) return;

  try {
    // バウンディングボックスの中心とサイズを計算
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    
    // サイズが小さすぎる場合の対応
    if (size.length() < 0.001) {
      console.warn('Object too small, using default size');
      size.set(1, 1, 1); // デフォルトサイズ
    }
    
    // 最大寸法を取得
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // カメラの視野角に基づいて適切な距離を計算
    const fov = camera.fov * (Math.PI / 180); // ラジアンに変換
    let distance = maxDim / (2 * Math.tan(fov / 2));
    
    // モデルサイズに応じた余裕を持たせる
    const padding = 1.2 + (0.2 * Math.log10(Math.max(1, maxDim)));
    distance *= padding;
    
    // 現在のカメラ方向を維持
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.negate(); // カメラから見た方向の逆
    
    const targetPosition = center.clone().add(direction.multiplyScalar(distance));
    
    // アニメーション開始
    animateToPosition(targetPosition, center);
  } catch (error) {
    console.error('Error in fitToObject:', error);
    // エラー発生時のフォールバック処理
  }
}, [camera, controls, animateToPosition]);
```

### タスク2: CameraControls.tsxの改良

**対象ファイル**: `components/cad/CameraControls.tsx`

#### 2.1 data-testid属性の追加
```typescript
<Button
  variant="outline"
  size="sm"
  onClick={() => animateToView('top')}
  className="flex items-center gap-1"
  data-testid="camera-top"
>
  <ArrowUp className="w-3 h-3" />
  Top
</Button>

// 他のボタンにも同様に
// data-testid="camera-front", data-testid="camera-right" など
// Fitボタンには data-testid="camera-fit"
```

#### 2.2 アクセシビリティの改善
```typescript
<Button
  variant="outline"
  size="sm"
  onClick={() => animateToView('front')}
  className="flex items-center gap-1"
  data-testid="camera-front"
  aria-label="Front view"
  title="Front view"
>
  <Eye className="w-3 h-3" />
  Front
</Button>

// すべてのボタンに適切なaria-labelとtitleを追加
```

### タスク3: ThreeJSViewport.tsxの統合改良

**対象ファイル**: `components/threejs/ThreeJSViewport.tsx`

#### 3.1 バウンディングボックス計算の最適化
```typescript
// バウンディングボックス計算を最適化
const calculateBoundingBox = useCallback((objects: THREE.Object3D[]) => {
  if (!objects || objects.length === 0) return null;
  
  try {
    const box = new THREE.Box3();
    let validObjectFound = false;
    
    objects.forEach(obj => {
      // メッシュオブジェクトのみを対象とする
      if (obj.type === 'Mesh' || obj.type === 'Group') {
        const objBox = new THREE.Box3().setFromObject(obj);
        if (!objBox.isEmpty() && objBox.min.length() !== Infinity && objBox.max.length() !== Infinity) {
          box.union(objBox);
          validObjectFound = true;
        }
      }
    });
    
    return validObjectFound ? box : null;
  } catch (error) {
    console.error('Error calculating bounding box:', error);
    return null;
  }
}, []);
```

#### 3.2 OrbitControlsの設定最適化
```typescript
<OrbitControls
  ref={controlsRef}
  enablePan={true}
  enableZoom={true}
  enableRotate={true}
  dampingFactor={0.05}
  enableDamping={true}
  minDistance={0.1}
  maxDistance={5000}
  minPolarAngle={0}
  maxPolarAngle={Math.PI}
  minAzimuthAngle={-Infinity}
  maxAzimuthAngle={Infinity}
  panSpeed={1.0}
  rotateSpeed={1.0}
  zoomSpeed={1.0}
  // カメラアニメーション中はユーザー操作を無効化
  enabled={!isAnimating}
/>
```

### タスク4: カメラアニメーション中のパフォーマンス最適化

#### 4.1 アニメーション中のレンダリング最適化
```typescript
// useCameraAnimation.ts内
const [isAnimating, setIsAnimating] = useState(false);

const animateToPosition = useCallback((
  // ...既存のコード
) => {
  // アニメーション開始時にフラグをセット
  setIsAnimating(true);
  
  const animate = () => {
    // ...既存のコード
    
    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      // アニメーション完了時にフラグをリセット
      setIsAnimating(false);
      animationRef.current = undefined;
    }
  };
  
  // ...既存のコード
}, [camera, controls]);

// isAnimatingをreturnに追加
return {
  fitToObject,
  animateToPosition,
  isAnimating
};
```

### タスク5: テストの改良・安定化

**対象ファイル**: `tests/camera-controls.spec.ts`

#### 5.1 テスト安定性の向上
```typescript
// テストの待機時間を適切に調整
test('カメラアニメーションがスムーズに動作する', async ({ page }) => {
  // アニメーション完了を検出する関数
  await page.evaluate(() => {
    window._animationComplete = false;
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    
    window.requestAnimationFrame = function(callback) {
      const id = originalRequestAnimationFrame(callback);
      setTimeout(() => {
        window._animationComplete = true;
      }, 2000); // 十分な時間を設定
      return id;
    };
  });
  
  // 視点切り替え
  await page.click('[data-testid="camera-front"]');
  
  // アニメーション完了を待機（より安定的）
  await page.waitForFunction(() => window._animationComplete === true, { timeout: 5000 });
  
  // 次の視点切り替え
  await page.click('[data-testid="camera-top"]');
  
  // 同様に待機
  await page.waitForFunction(() => window._animationComplete === true, { timeout: 5000 });
  
  // 検証
  const consoleErrors = await page.evaluate(() => {
    return window.console.error.calls || [];
  });
  expect(consoleErrors.length).toBe(0);
});
```

## ✅ 完了条件

### 必須要件
1. **スムーズなアニメーション**: 改良されたイージング関数による自然な動き
2. **動的アニメーション速度**: 距離に応じた適切なアニメーション時間
3. **バウンディングボックス最適化**: 様々なサイズのモデルに対する適切な距離計算
4. **エラーハンドリング**: エッジケース（空のシーンなど）に対する適切な処理
5. **パフォーマンス改善**: アニメーション中のフレームレート維持

### テスト基準
1. **既存テストのパス**: 既存のカメラコントロールテストが安定して成功
2. **エッジケーステスト**: 極端なサイズのモデルでのテスト追加
3. **パフォーマンステスト**: アニメーション中のフレームレート監視テスト

## 🧪 検証手順

1. **基本機能確認**:
   ```bash
   # 開発サーバー起動
   npm run dev
   
   # 各視点切り替えボタンとFitボタンを操作して動作確認
   ```

2. **テスト実行**:
   ```bash
   # カメラコントロールテスト実行
   npx playwright test tests/camera-controls.spec.ts
   
   # 全テスト実行で既存機能への影響確認
   npm run test
   ```

3. **パフォーマンス検証**:
   - Chrome DevToolsのPerformanceタブでアニメーション中のフレームレート測定
   - メモリリークがないことを確認

## 📋 成果物

1. **改良されたコード**:
   - `hooks/useCameraAnimation.ts`
   - `components/cad/CameraControls.tsx`
   - `components/threejs/ThreeJSViewport.tsx`

2. **テスト**:
   - 改良された `tests/camera-controls.spec.ts`

3. **ドキュメント更新**:
   - `docs/7_cascadestudio_migration/feature_comparison.md` の「カメラアニメーション」ステータス更新
   - `docs/7_cascadestudio_migration/implementation_tasks.md` の進捗更新

## 🚨 注意事項

1. **既存機能との競合回避**: ホバーハイライト、TransformControlsとの競合を避ける
2. **メモリ管理**: アニメーションフレームとリソースの適切な解放
3. **TypeScript型安全性**: 全ての変更がstrict modeに準拠していること
4. **アクセシビリティ**: UIコンポーネントの適切なARIA属性設定

## 📞 サポート・参考リソース

- **React Three Fiber**: https://docs.pmnd.rs/react-three-fiber/api/hooks#usethree
- **Three.js OrbitControls**: https://threejs.org/docs/#examples/en/controls/OrbitControls
- **アニメーションイージング関数**: https://easings.net/

この改良により、カメラアニメーション機能が大幅に向上し、フェーズ2.2の完成度がさらに高まります。 