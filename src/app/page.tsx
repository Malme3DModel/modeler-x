'use client';

import React, { useState, useCallback, useRef } from 'react';
import MonacoEditor from '../components/MonacoEditor';
import ThreeViewport, { ThreeViewportRef } from '../components/ThreeViewport';
import DockviewLayout from '../components/DockviewLayout';
import CADWorkerManager from '../components/CADWorkerManager';
import TopNavigation from '@/components/Navigation/TopNavigation';
import { ModelerColors } from '@/lib/colors';

// デフォルトコード
const defaultCode = 
`// Welcome to Cascade Studio!   Here are some useful functions:
//  Translate(), Rotate(), Scale(), Mirror(), Union(), Difference(), Intersection()
//  Box(), Sphere(), Cylinder(), Cone(), Text3D(), Polygon()
//  Offset(), Extrude(), RotatedExtrude(), Revolve(), Pipe(), Loft(), 
//  FilletEdges(), ChamferEdges(),
//  Slider(), Checkbox(), TextInput(), Dropdown()

let holeRadius = Slider("Radius", 30 , 20 , 40);

let sphere     = Sphere(50);
let cylinderZ  =                     Cylinder(holeRadius, 200, true);
let cylinderY  = Rotate([0,1,0], 90, Cylinder(holeRadius, 200, true));
let cylinderX  = Rotate([1,0,0], 90, Cylinder(holeRadius, 200, true));

Translate([0, 0, 50], Difference(sphere, [cylinderX, cylinderY, cylinderZ]));

Translate([-25, 0, 40], Text3D("Hi!", 36, 0.15, 'Consolas'));

// Don't forget to push imported or oc-defined shapes into sceneShapes to add them to the workspace!`;

const ColorTestCard = ({ title, color, description }: { title: string; color: string; description: string }) => (
  <div className="bg-modeler-control-base border border-modeler-control-border rounded-modeler p-4 mb-4">
    <h3 className="text-modeler-control-text-primary font-console text-lg mb-2">{title}</h3>
    <div 
      className="w-full h-12 mb-2 rounded border border-modeler-control-border"
      style={{ backgroundColor: color }}
    />
    <p className="text-modeler-control-text-secondary font-ui text-sm">{description}</p>
    <code className="text-modeler-accent-info font-console text-xs">{color}</code>
  </div>
)

const ButtonTestCard = () => (
  <div className="bg-modeler-control-base border border-modeler-control-border rounded-modeler p-4 mb-4">
    <h3 className="text-modeler-control-text-primary font-console text-lg mb-4">ボタンテスト</h3>
    <div className="space-y-2">
      <button 
        className="px-4 py-2 rounded font-ui text-sm transition-colors duration-150"
        style={{
          backgroundColor: 'var(--modeler-control-button)',
          color: 'var(--modeler-control-text-primary)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--modeler-control-button-hover)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--modeler-control-button)'
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--modeler-control-button-active)'
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--modeler-control-button-hover)'
        }}
      >
        Modeler Button
      </button>
      
      <button 
        className="px-4 py-2 rounded font-ui text-sm transition-colors duration-150 block"
        style={{
          backgroundColor: 'var(--modeler-accent-primary)',
          color: 'white',
        }}
      >
        Primary Action
      </button>
    </div>
  </div>
)

export default function Home() {
  const [code, setCode] = useState(defaultCode);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [projectName, setProjectName] = useState('Untitled');
  const [isCADWorkerReady, setIsCADWorkerReady] = useState(false);
  const [consoleMessages, setConsoleMessages] = useState<string[]>([
    '> Welcome to Modeler X!',
    '> Loading CAD Kernel...'
  ]);
  const threejsViewportRef = useRef<ThreeViewportRef>(null);

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
  }, []);

  const handleEvaluate = useCallback(() => {
    // この関数は現在MonacoEditorコンポーネント内でCADワーカーを直接呼び出しているため、
    // 追加の処理が必要な場合はここに実装
    console.log('Code evaluation triggered');
  }, []);

  const handleSaveProject = useCallback(() => {
    // TODO: プロジェクト保存機能を実装
    console.log('Saving project:', projectName);
    setHasUnsavedChanges(false);
  }, [projectName]);

  const handleProjectNameUpdate = useCallback((name: string) => {
    setProjectName(name);
  }, []);

  const handleUnsavedChangesUpdate = useCallback((hasChanges: boolean) => {
    setHasUnsavedChanges(hasChanges);
  }, []);

  const handleWorkerReady = useCallback(() => {
    setIsCADWorkerReady(true);
    setConsoleMessages(prev => [...prev, '> CAD Kernel loaded successfully!', '> Ready to evaluate code']);
  }, []);

  // CADワーカーからの形状更新を処理
  const handleShapeUpdate = useCallback((facesAndEdges: any, sceneOptions: any) => {
    if (threejsViewportRef.current?.updateShape) {
      threejsViewportRef.current.updateShape(facesAndEdges, sceneOptions);
    }
  }, []);

  // CADワーカーからの進捗更新を処理
  const handleProgress = useCallback((progress: { opNumber: number; opType: string }) => {
    const progressMessage = `> Generating Model${'.' .repeat(progress.opNumber)}${progress.opType ? ` (${progress.opType})` : ''}`;
    setConsoleMessages(prev => {
      const newMessages = [...prev];
      // 最後のメッセージが進捗メッセージの場合は置き換え、そうでなければ追加
      if (newMessages.length > 0 && newMessages[newMessages.length - 1].startsWith('> Generating Model')) {
        newMessages[newMessages.length - 1] = progressMessage;
      } else {
        newMessages.push(progressMessage);
      }
      return newMessages;
    });
  }, []);

  // CADワーカーからのログメッセージを処理
  const handleLog = useCallback((message: string) => {
    setConsoleMessages(prev => [...prev, `> ${message}`]);
  }, []);

  // CADワーカーからのエラーメッセージを処理
  const handleError = useCallback((error: string) => {
    setConsoleMessages(prev => [...prev, `> ERROR: ${error}`]);
  }, []);

  // ThreeViewportのシーン準備完了時の処理
  const handleSceneReady = useCallback((scene: any) => {
  }, []);

  // エディタータイトルの生成
  const editorTitle = `${hasUnsavedChanges ? '* ' : ''}${projectName}.ts`;

  // 左パネル（エディター）
  const leftPanel = (
    <MonacoEditor
      value={code}
      onChange={handleCodeChange}
      onEvaluate={handleEvaluate}
      onSaveProject={handleSaveProject}
      hasUnsavedChanges={hasUnsavedChanges}
      onUnsavedChangesUpdate={handleUnsavedChangesUpdate}
      projectName={projectName}
      onProjectNameUpdate={handleProjectNameUpdate}
    />
  );

  // 右上パネル（3Dビューポート）
  const rightTopPanel = (
    <ThreeViewport 
      ref={threejsViewportRef}
      onSceneReady={handleSceneReady}
    />
  );

  // 右下パネル（コンソール）
  const rightBottomPanel = (
    <div className="h-full bg-gray-900 flex flex-col">
      <div className="p-4 h-full overflow-auto text-white font-mono text-sm">
                 {consoleMessages.map((message, index) => (
           <div key={index} className="text-gray-300">{message}</div>
         ))}
         {isCADWorkerReady && (
           <div className="text-green-400 mt-2">
             &gt; CAD Worker Status: Ready
           </div>
         )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--modeler-bg-primary)' }}>
      {/* v0互換のトップナビゲーション */}
      <TopNavigation />
      
      {/* メインコンテンツ */}
      <div className="container mx-auto p-6">
        <h1 className="text-modeler-control-text-primary font-console text-3xl mb-6">
          Modeler X カラーシステムテスト
        </h1>
        
        <p className="text-modeler-control-text-secondary font-ui mb-8">
          v0の色設定と完全に一致するカラーシステムの実装テストページです。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 基本色のテスト */}
          <ColorTestCard
            title="メイン背景"
            color={ModelerColors.background.primary}
            description="v0のbody背景色"
          />
          
          <ColorTestCard
            title="サーフェス背景"
            color={ModelerColors.background.surface}
            description="v0のTweakPane背景色"
          />
          
          <ColorTestCard
            title="モーダル背景"
            color={ModelerColors.background.modal}
            description="v0のcenteredクラス背景"
          />

          {/* ナビゲーション色のテスト */}
          <ColorTestCard
            title="ナビ背景"
            color={ModelerColors.nav.bg}
            description="v0のトップナビ背景"
          />
          
          <ColorTestCard
            title="ナビホバー"
            color={ModelerColors.nav.hover.bg}
            description="v0のナビホバー背景"
          />
          
          <ColorTestCard
            title="ナビアクティブ"
            color={ModelerColors.nav.active.bg}
            description="v0のナビアクティブ背景"
          />

          {/* コントロール色のテスト */}
          <ColorTestCard
            title="ボタン背景"
            color={ModelerColors.control.button}
            description="v0のTweakPaneボタン"
          />
          
          <ColorTestCard
            title="ボタンホバー"
            color={ModelerColors.control.buttonHover}
            description="v0のTweakPaneボタンホバー"
          />
          
          <ColorTestCard
            title="ボタンアクティブ"
            color={ModelerColors.control.buttonActive}
            description="v0のTweakPaneボタンアクティブ"
          />

          {/* テキスト色のテスト */}
          <ColorTestCard
            title="プライマリテキスト"
            color={ModelerColors.control.textPrimary}
            description="v0のメインテキスト色"
          />
          
          <ColorTestCard
            title="セカンダリテキスト"
            color={ModelerColors.control.textSecondary}
            description="v0のラベルテキスト色"
          />
          
          <ColorTestCard
            title="アクセントカラー"
            color={ModelerColors.accent.primary}
            description="v0のアクセント色"
          />
        </div>

        {/* ボタンのインタラクションテスト */}
        <div className="mt-8">
          <ButtonTestCard />
        </div>

        {/* スクロールテスト */}
        <div className="bg-modeler-control-base border border-modeler-control-border rounded-modeler p-4 mt-4">
          <h3 className="text-modeler-control-text-primary font-console text-lg mb-4">スクロールバーテスト</h3>
          <div 
            className="h-32 overflow-y-auto scrollbar-modeler"
            style={{ backgroundColor: 'var(--modeler-bg-secondary)' }}
          >
            <div className="h-96 p-4">
              <p className="text-modeler-control-text-primary font-ui">
                このエリアはスクロール可能です。v0と同じスクロールバーのスタイルが適用されています。
              </p>
              {Array.from({ length: 20 }, (_, i) => (
                <p key={i} className="text-modeler-control-text-secondary font-console text-sm mt-2">
                  Line {i + 1}: Modeler X Color System Test
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* CSS変数テスト */}
        <div className="bg-modeler-control-base border border-modeler-control-border rounded-modeler p-4 mt-4">
          <h3 className="text-modeler-control-text-primary font-console text-lg mb-4">CSS変数アクセステスト</h3>
          <div className="space-y-2 text-modeler-control-text-secondary font-console text-sm">
            <div>--modeler-bg-primary: <span className="text-modeler-accent-info">{ModelerColors.background.primary}</span></div>
            <div>--modeler-nav-bg: <span className="text-modeler-accent-info">{ModelerColors.nav.bg}</span></div>
            <div>--modeler-control-base: <span className="text-modeler-accent-info">{ModelerColors.control.base}</span></div>
            <div>--tp-base-background-color: <span className="text-modeler-accent-info">#2e2e2e (v0互換)</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
