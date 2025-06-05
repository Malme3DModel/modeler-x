# Phase 1: Critical Issues Resolution

## 概要

Phase 1では、CascadeStudioの機能パリティ達成において最も重要な2つの問題を解決します。

- **期間**: 1-2週間
- **優先度**: 🔴 Critical
- **目標**: TransformControls機能有効化とPWA Service Worker強化

## 🎯 実装対象

### 1. TransformControls機能の有効化

#### 現状分析
- **問題**: ギズモ機能が実装済みだが無効化されている
- **影響**: CADオブジェクトの直接操作（移動・回転・スケール）ができない
- **原因**: TransformControlsボタンが無効化状態

#### 技術仕様
```typescript
// 期待される実装
interface TransformControlsState {
  mode: 'translate' | 'rotate' | 'scale';
  enabled: boolean;
  selectedObject: THREE.Object3D | null;
  space: 'local' | 'world';
  size: number;
}
```

#### 実装計画

##### Step 1.1: TransformControlsコンポーネントの修正
**ファイル**: `components/threejs/TransformControls.tsx`

```typescript
// 修正対象
- disabled={true} // 現在無効化されている
+ disabled={!selectedObject} // 選択オブジェクトがある場合のみ有効化
```

**作業項目**:
1. 無効化フラグの条件修正
2. 選択オブジェクトとの連動実装
3. モード切り替え機能実装

##### Step 1.2: CADビューポートとの統合
**ファイル**: `components/cad/gui/CADViewport.tsx`

```typescript
// 追加実装
const handleObjectSelect = (object: THREE.Object3D) => {
  setSelectedObject(object);
  setTransformControlsEnabled(true);
};

const handleTransformChange = () => {
  // CADエンジンへの変更通知
  updateCADGeometry();
};
```

**作業項目**:
1. オブジェクト選択イベントハンドラー実装
2. Transform変更時のCADエンジン更新
3. ギズモ表示/非表示の制御

##### Step 1.3: キーボードショートカット実装
**ファイル**: `hooks/useKeyboardShortcuts.ts`

```typescript
// 追加ショートカット
- 'G': 移動モード (Translate)
- 'R': 回転モード (Rotate)  
- 'S': スケールモード (Scale)
- 'Tab': モード切り替え
- 'Escape': 選択解除
```

#### テスト仕様
```typescript
describe('TransformControls', () => {
  test('オブジェクト選択時にギズモが表示される', () => {});
  test('移動・回転・スケール操作が正常動作する', () => {});
  test('キーボードショートカットが機能する', () => {});
  test('CADエンジンとの同期が正常動作する', () => {});
});
```

### 2. PWA Service Worker機能の強化

#### 現状分析
- **問題**: 104行の基本実装 vs 元版182行の包括的実装
- **影響**: オフライン機能が制限的、CAD特有リソースのキャッシュ不足
- **原因**: キャッシュ戦略が基本的すぎる

#### 技術仕様

##### 元版Service Worker分析
```javascript
// 元版の包括的キャッシュ戦略
const CACHE_NAME = 'cascade-studio-v1.5.9';
const urlsToCache = [
  // Three.js完全キャッシュ
  './js/three.min.js',
  './js/controls/OrbitControls.js',
  
  // Monaco Editor完全キャッシュ  
  './js/monaco-editor/',
  
  // OpenCascade.js完全キャッシュ
  './js/opencascade/opencascade.full.js',
  './js/opencascade/opencascade.full.wasm',
  
  // フォント・テクスチャキャッシュ
  './fonts/',
  './textures/',
  
  // ネットワーク優先→キャッシュフォールバック
  // バージョン管理による自動更新
];
```

#### 実装計画

##### Step 2.1: Service Worker全面書き換え
**ファイル**: `public/sw.js`

**新しいキャッシュ戦略**:
```javascript
// キャッシュカテゴリ分類
const CACHES = {
  static: 'modeler-x-static-v1.0.0',
  dynamic: 'modeler-x-dynamic-v1.0.0',
  cad: 'modeler-x-cad-v1.0.0',
  assets: 'modeler-x-assets-v1.0.0'
};

// CAD特有リソース
const CAD_RESOURCES = [
  '/opencascade/',
  '/monaco-editor-workers/',
  '/textures/',
  '/workers/'
];

// 動的キャッシュ戦略
const CACHE_STRATEGIES = {
  static: 'CacheFirst',
  dynamic: 'NetworkFirst', 
  cad: 'CacheFirst',
  assets: 'CacheFirst'
};
```

**作業項目**:
1. キャッシュカテゴリの分類実装
2. CAD特有リソースの包括的キャッシュ
3. ネットワーク優先→キャッシュフォールバック戦略
4. バージョン管理による自動更新機能

##### Step 2.2: プッシュ通知機能実装
**ファイル**: `lib/pwa/notificationManager.ts`

```typescript
class NotificationManager {
  async requestPermission(): Promise<boolean> {}
  async showNotification(title: string, options: NotificationOptions): Promise<void> {}
  async registerPushSubscription(): Promise<PushSubscription> {}
}
```

**作業項目**:
1. 通知許可リクエスト実装
2. プロジェクト保存/エクスポート完了通知
3. オフライン状態変更通知

##### Step 2.3: オフライン機能強化
**ファイル**: `components/pwa/OfflineManager.tsx`

```typescript
const OfflineManager = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [cachedProjects, setCachedProjects] = useState([]);
  
  // オフライン時の動作
  const handleOfflineOperation = () => {
    // ローカルストレージからプロジェクト読み込み
    // キャッシュされたCADエンジンの使用
    // 制限された機能での動作継続
  };
};
```

#### テスト仕様
```typescript
describe('PWA Service Worker', () => {
  test('CAD特有リソースが完全キャッシュされる', () => {});
  test('オフライン時にアプリが正常動作する', () => {});
  test('ネットワーク復帰時に同期が動作する', () => {});
  test('プッシュ通知が正常送信される', () => {});
});
```

## 📅 実装スケジュール

### Week 1: TransformControls機能有効化
- **Day 1-2**: コンポーネント修正とCADビューポート統合
- **Day 3-4**: キーボードショートカット実装
- **Day 5**: テスト実装と品質確認

### Week 2: PWA Service Worker強化  
- **Day 1-3**: Service Worker全面書き換え
- **Day 4**: プッシュ通知機能実装
- **Day 5**: オフライン機能強化とテスト

## 🧪 品質保証

### 単体テスト
- TransformControls各機能の単体テスト
- Service Worker各キャッシュ戦略のテスト

### 統合テスト
- CADオブジェクト操作のE2Eテスト
- オフライン→オンライン復帰のE2Eテスト

### パフォーマンステスト
- ギズモ操作時のフレームレート計測
- キャッシュ効率の計測

## ✅ 完了条件

### TransformControls
- [ ] ギズモによるオブジェクト移動が動作
- [ ] 回転・スケール操作が動作
- [ ] キーボードショートカットが動作
- [ ] CADエンジンとの同期が動作

### PWA Service Worker
- [ ] CAD特有リソースの完全キャッシュ
- [ ] オフライン時の基本動作
- [ ] プッシュ通知機能
- [ ] 182行以上の包括的実装

## 🔍 検証方法

### 手動テスト
1. **TransformControls**: オブジェクト選択→ギズモ表示→操作→CAD更新の一連動作
2. **PWA**: ネットワーク切断→オフライン動作→ネットワーク復帰→同期の確認

### 自動テスト
1. **単体テスト**: Jest + React Testing Library
2. **E2Eテスト**: Playwright
3. **パフォーマンステスト**: Lighthouse CI

---

*Phase 1実装責任者: AI Assistant*  
*作成日時: 2024年1月1日* 