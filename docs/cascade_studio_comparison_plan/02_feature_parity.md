# Phase 2: Feature Parity Achievement

## 概要

Phase 2では、元版CascadeStudioとの完全な機能パリティを達成します。

- **期間**: 2-3週間
- **優先度**: 🟡 Important
- **目標**: マルチセレクション機能とキーボードショートカット完全実装

## 🎯 実装対象

### 1. マルチセレクション機能の実装

#### 現状分析
- **問題**: 単一選択のみ対応、複数オブジェクトの選択ができない
- **影響**: 複数オブジェクトの一括操作（移動、削除、グループ化）ができない
- **元版機能**: Ctrl+クリック、ドラッグ選択、範囲選択

#### 技術仕様

```typescript
interface SelectionState {
  selectedObjects: Set<THREE.Object3D>;
  selectionMode: 'single' | 'multiple' | 'area';
  selectionBox: THREE.Box3 | null;
  isSelecting: boolean;
}

interface SelectionManager {
  addToSelection(object: THREE.Object3D): void;
  removeFromSelection(object: THREE.Object3D): void;
  clearSelection(): void;
  selectAll(): void;
  selectByArea(startPoint: THREE.Vector2, endPoint: THREE.Vector2): void;
  toggleSelection(object: THREE.Object3D): void;
}
```

#### 実装計画

##### Step 1.1: SelectionManagerクラス実装
**ファイル**: `lib/threejs/SelectionManager.ts`

```typescript
export class SelectionManager extends EventTarget {
  private selectedObjects = new Set<THREE.Object3D>();
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;

  constructor(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) {
    super();
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.setupSelectionBox();
  }

  // 単一選択
  selectObject(object: THREE.Object3D, additive = false): void {
    if (!additive) {
      this.clearSelection();
    }
    this.selectedObjects.add(object);
    this.updateObjectAppearance(object, true);
    this.dispatchEvent(new CustomEvent('selectionChanged', { 
      detail: { selectedObjects: Array.from(this.selectedObjects) }
    }));
  }

  // 複数選択（Ctrl+クリック）
  toggleSelection(object: THREE.Object3D): void {
    if (this.selectedObjects.has(object)) {
      this.removeFromSelection(object);
    } else {
      this.addToSelection(object);
    }
  }

  // 範囲選択（ドラッグ）
  selectByArea(startPoint: THREE.Vector2, endPoint: THREE.Vector2): void {
    const frustum = new THREE.Frustum();
    const bounds = new THREE.Box2(startPoint, endPoint);
    
    this.scene.traverse((object) => {
      if (this.isSelectableObject(object)) {
        const screenPosition = this.getScreenPosition(object);
        if (bounds.containsPoint(screenPosition)) {
          this.addToSelection(object);
        }
      }
    });
  }

  // 選択状態のビジュアル更新
  private updateObjectAppearance(object: THREE.Object3D, selected: boolean): void {
    if (object instanceof THREE.Mesh) {
      const material = object.material as THREE.MeshStandardMaterial;
      if (selected) {
        material.emissive.setHex(0x444444);
        material.wireframe = true;
      } else {
        material.emissive.setHex(0x000000);
        material.wireframe = false;
      }
    }
  }
}
```

##### Step 1.2: SelectionBoxコンポーネント実装
**ファイル**: `components/threejs/SelectionBox.tsx`

```typescript
interface SelectionBoxProps {
  enabled: boolean;
  onSelectionComplete: (selectedObjects: THREE.Object3D[]) => void;
}

export const SelectionBox: React.FC<SelectionBoxProps> = ({ enabled, onSelectionComplete }) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPoint, setStartPoint] = useState<THREE.Vector2 | null>(null);
  const [endPoint, setEndPoint] = useState<THREE.Vector2 | null>(null);

  // マウスイベントハンドラー
  const handleMouseDown = (event: THREE.Event) => {
    if (!enabled || event.ctrlKey) return;
    
    setIsSelecting(true);
    setStartPoint(new THREE.Vector2(event.clientX, event.clientY));
  };

  const handleMouseMove = (event: THREE.Event) => {
    if (!isSelecting) return;
    setEndPoint(new THREE.Vector2(event.clientX, event.clientY));
  };

  const handleMouseUp = () => {
    if (!isSelecting || !startPoint || !endPoint) return;
    
    // 範囲選択実行
    onSelectionComplete(getObjectsInSelectionArea(startPoint, endPoint));
    
    setIsSelecting(false);
    setStartPoint(null);
    setEndPoint(null);
  };

  return (
    <>
      <primitive object={selectionBoxHelper} />
      {isSelecting && (
        <SelectionBoxVisual startPoint={startPoint} endPoint={endPoint} />
      )}
    </>
  );
};
```

##### Step 1.3: CADビューポートとの統合
**ファイル**: `components/cad/gui/CADViewport.tsx`

```typescript
// 既存コンポーネントに追加
const CADViewport = () => {
  const [selectionManager, setSelectionManager] = useState<SelectionManager | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<THREE.Object3D[]>([]);

  // 選択イベントハンドラー
  const handleObjectClick = (event: ThreeEvent<MouseEvent>) => {
    if (!selectionManager) return;

    const object = event.object;
    const isMultiSelect = event.nativeEvent.ctrlKey || event.nativeEvent.metaKey;

    if (isMultiSelect) {
      selectionManager.toggleSelection(object);
    } else {
      selectionManager.selectObject(object);
    }
  };

  // 選択状態変更ハンドラー
  const handleSelectionChange = (event: CustomEvent) => {
    setSelectedObjects(event.detail.selectedObjects);
  };

  return (
    <Canvas>
      <SelectionBox 
        enabled={true}
        onSelectionComplete={handleAreaSelection}
      />
      <CADObjects onPointerDown={handleObjectClick} />
    </Canvas>
  );
};
```

#### テスト仕様
```typescript
describe('MultiSelection', () => {
  test('Ctrl+クリックで複数選択ができる', () => {});
  test('ドラッグで範囲選択ができる', () => {});
  test('選択したオブジェクトのビジュアルが変更される', () => {});
  test('全選択・選択解除が動作する', () => {});
});
```

### 2. キーボードショートカット完全実装

#### 現状分析
- **問題**: F5（実行）、Ctrl+S（保存）のみ対応
- **影響**: CAD作業の効率性が大幅に制限される
- **元版機能**: 包括的なキーボードショートカット対応

#### 技術仕様

```typescript
interface KeyboardShortcutMap {
  // ファイル操作
  'Ctrl+N': () => void; // 新規プロジェクト
  'Ctrl+O': () => void; // プロジェクト開く
  'Ctrl+S': () => void; // プロジェクト保存
  'Ctrl+Shift+S': () => void; // 名前を付けて保存
  
  // 編集操作
  'Ctrl+Z': () => void; // 元に戻す
  'Ctrl+Y': () => void; // やり直し
  'Ctrl+X': () => void; // 切り取り
  'Ctrl+C': () => void; // コピー
  'Ctrl+V': () => void; // 貼り付け
  'Delete': () => void; // 削除
  
  // 選択操作
  'Ctrl+A': () => void; // 全選択
  'Ctrl+D': () => void; // 選択解除
  'Ctrl+I': () => void; // 選択反転
  
  // 表示操作
  'F': () => void; // フィット表示
  'H': () => void; // ホーム視点
  '1': () => void; // フロント視点
  '3': () => void; // 右視点
  '7': () => void; // トップ視点
  
  // Transform操作
  'G': () => void; // 移動モード
  'R': () => void; // 回転モード
  'S': () => void; // スケールモード
  'Tab': () => void; // モード切り替え
  'Escape': () => void; // キャンセル
  
  // 実行操作
  'F5': () => void; // コード実行
  'Ctrl+Enter': () => void; // コード実行（代替）
  
  // エクスポート操作
  'Ctrl+E': () => void; // エクスポートダイアログ
  'Ctrl+Shift+E': () => void; // バッチエクスポート
}
```

#### 実装計画

##### Step 2.1: KeyboardShortcutManagerクラス実装
**ファイル**: `lib/gui/KeyboardShortcutManager.ts`

```typescript
export class KeyboardShortcutManager {
  private shortcuts = new Map<string, () => void>();
  private isEnabled = true;
  private excludedElements = ['INPUT', 'TEXTAREA'];

  constructor() {
    this.setupEventListeners();
  }

  // ショートカット登録
  register(key: string, callback: () => void): void {
    this.shortcuts.set(key, callback);
  }

  // ショートカット解除
  unregister(key: string): void {
    this.shortcuts.delete(key);
  }

  // イベントリスナー設定
  private setupEventListeners(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  // キーダウンハンドラー
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled || this.isExcludedElement(event.target)) {
      return;
    }

    const shortcutKey = this.getShortcutKey(event);
    const callback = this.shortcuts.get(shortcutKey);

    if (callback) {
      event.preventDefault();
      event.stopPropagation();
      callback();
    }
  }

  // ショートカットキー文字列生成
  private getShortcutKey(event: KeyboardEvent): string {
    const parts = [];
    
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.shiftKey) parts.push('Shift');
    if (event.altKey) parts.push('Alt');
    if (event.metaKey) parts.push('Meta');
    
    parts.push(event.key);
    
    return parts.join('+');
  }
}
```

##### Step 2.2: React Hookとしての実装
**ファイル**: `hooks/useKeyboardShortcuts.ts`

```typescript
export const useKeyboardShortcuts = (shortcuts: KeyboardShortcutMap) => {
  const managerRef = useRef<KeyboardShortcutManager | null>(null);

  useEffect(() => {
    managerRef.current = new KeyboardShortcutManager();
    
    // ショートカットを登録
    Object.entries(shortcuts).forEach(([key, callback]) => {
      managerRef.current?.register(key, callback);
    });

    return () => {
      managerRef.current?.destroy();
    };
  }, [shortcuts]);

  return {
    enable: () => managerRef.current?.enable(),
    disable: () => managerRef.current?.disable(),
    isEnabled: () => managerRef.current?.isEnabled() ?? false,
  };
};
```

##### Step 2.3: メインアプリケーションとの統合
**ファイル**: `app/page.tsx`

```typescript
const CascadeStudio = () => {
  const { 
    projectManager,
    cadEngine,
    selectionManager,
    transformManager 
  } = useAppContext();

  // ショートカット定義
  const shortcuts: KeyboardShortcutMap = {
    // ファイル操作
    'Ctrl+N': () => projectManager.newProject(),
    'Ctrl+O': () => projectManager.openProject(),
    'Ctrl+S': () => projectManager.saveProject(),
    'Ctrl+Shift+S': () => projectManager.saveAsProject(),
    
    // 編集操作
    'Ctrl+Z': () => cadEngine.undo(),
    'Ctrl+Y': () => cadEngine.redo(),
    'Delete': () => selectionManager.deleteSelected(),
    
    // 選択操作
    'Ctrl+A': () => selectionManager.selectAll(),
    'Ctrl+D': () => selectionManager.clearSelection(),
    
    // Transform操作
    'G': () => transformManager.setMode('translate'),
    'R': () => transformManager.setMode('rotate'),
    'S': () => transformManager.setMode('scale'),
    'Escape': () => transformManager.cancel(),
    
    // 実行操作
    'F5': () => cadEngine.executeCode(),
    'Ctrl+Enter': () => cadEngine.executeCode(),
    
    // 視点操作
    'F': () => cameraManager.fitView(),
    '1': () => cameraManager.setView('front'),
    '3': () => cameraManager.setView('right'),
    '7': () => cameraManager.setView('top'),
  };

  useKeyboardShortcuts(shortcuts);

  return <CascadeStudioUI />;
};
```

#### テスト仕様
```typescript
describe('KeyboardShortcuts', () => {
  test('ファイル操作ショートカットが動作する', () => {});
  test('編集操作ショートカットが動作する', () => {});
  test('Transform操作ショートカットが動作する', () => {});
  test('視点操作ショートカットが動作する', () => {});
  test('入力フィールド内ではショートカットが無効化される', () => {});
});
```

### 3. 追加機能実装

#### 3.1 アンドゥ・リドゥ機能
**ファイル**: `lib/cad/HistoryManager.ts`

```typescript
interface HistoryEntry {
  id: string;
  type: 'geometry' | 'transform' | 'delete' | 'create';
  before: any;
  after: any;
  timestamp: Date;
}

export class HistoryManager {
  private history: HistoryEntry[] = [];
  private currentIndex = -1;
  private maxHistorySize = 100;

  addEntry(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): void {
    const newEntry: HistoryEntry = {
      ...entry,
      id: generateId(),
      timestamp: new Date()
    };

    // 現在の位置以降の履歴を削除
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    // 新しいエントリを追加
    this.history.push(newEntry);
    this.currentIndex++;

    // 履歴サイズ制限
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  undo(): boolean {
    if (!this.canUndo()) return false;

    const entry = this.history[this.currentIndex];
    this.applyHistoryEntry(entry, 'undo');
    this.currentIndex--;
    
    return true;
  }

  redo(): boolean {
    if (!this.canRedo()) return false;

    this.currentIndex++;
    const entry = this.history[this.currentIndex];
    this.applyHistoryEntry(entry, 'redo');
    
    return true;
  }
}
```

#### 3.2 グループ操作機能
**ファイル**: `lib/cad/GroupManager.ts`

```typescript
export class GroupManager {
  private groups = new Map<string, THREE.Group>();

  createGroup(objects: THREE.Object3D[], name?: string): THREE.Group {
    const group = new THREE.Group();
    group.name = name || `Group_${Date.now()}`;
    
    objects.forEach(obj => {
      obj.parent?.remove(obj);
      group.add(obj);
    });

    this.groups.set(group.name, group);
    return group;
  }

  ungroupObjects(group: THREE.Group): THREE.Object3D[] {
    const objects = group.children.slice();
    
    objects.forEach(obj => {
      group.remove(obj);
    });

    this.groups.delete(group.name);
    return objects;
  }
}
```

## 📅 実装スケジュール

### Week 1: マルチセレクション機能
- **Day 1-2**: SelectionManagerクラス実装
- **Day 3**: SelectionBoxコンポーネント実装
- **Day 4**: CADビューポート統合
- **Day 5**: テスト実装

### Week 2: キーボードショートカット
- **Day 1-2**: KeyboardShortcutManagerクラス実装
- **Day 3**: React Hook実装
- **Day 4**: メインアプリ統合
- **Day 5**: テスト実装

### Week 3: 追加機能とテスト
- **Day 1-2**: アンドゥ・リドゥ機能実装
- **Day 3**: グループ操作機能実装
- **Day 4-5**: 統合テストと品質確認

## ✅ 完了条件

### マルチセレクション
- [ ] Ctrl+クリックによる複数選択
- [ ] ドラッグによる範囲選択
- [ ] 選択状態のビジュアル表示
- [ ] 全選択・選択解除機能

### キーボードショートカット
- [ ] ファイル操作ショートカット（20個以上）
- [ ] 編集操作ショートカット
- [ ] Transform操作ショートカット
- [ ] 視点操作ショートカット
- [ ] 入力フィールドでの無効化

### 追加機能
- [ ] アンドゥ・リドゥ機能（100段階）
- [ ] グループ操作機能
- [ ] 操作履歴の永続化

---

*Phase 2実装責任者: AI Assistant*  
*作成日時: 2024年1月1日* 