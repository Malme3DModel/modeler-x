'use client';

import { useState } from 'react';
import { HelpModal } from '@/components/ui/HelpModal';
import { ProgressIndicator } from '@/components/ui/ProgressIndicator';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function Home() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isProgressVisible, setIsProgressVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showError, setShowError] = useState(false);

  // キーボードショートカットの設定
  useKeyboardShortcuts({
    onEvaluateCode: () => {
      alert('F5キーが押されました - コード実行');
    },
    onSaveProject: () => {
      alert('Ctrl+Sキーが押されました - プロジェクト保存');
    },
    onClearSelection: () => {
      alert('Escキーが押されました - 選択解除');
    }
  });

  // プログレスバーのデモ
  const startProgress = () => {
    setIsProgressVisible(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsProgressVisible(false), 1000);
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };

  // エラーを発生させる関数
  const ErrorComponent = () => {
    throw new Error('テスト用のエラーです');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">UI/UXコンポーネントテスト</h1>
      
      <div className="flex flex-col space-y-4 w-full max-w-md">
        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">ヘルプモーダル</h2>
          <p className="text-gray-600 mb-4">
            ショートカットキーとアプリ情報を表示するモーダルウィンドウ
          </p>
          <Button onClick={() => setIsHelpOpen(true)}>ヘルプを開く</Button>
          <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
        </div>
        
        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">プログレスインジケーター</h2>
          <p className="text-gray-600 mb-4">
            処理の進行状況を表示するインジケーター
          </p>
          <Button onClick={startProgress}>プログレスバーを表示</Button>
          <ProgressIndicator 
            isVisible={isProgressVisible}
            progress={progress}
            message="処理を実行中..."
            onCancel={() => setIsProgressVisible(false)}
          />
        </div>
        
        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">エラーバウンダリー</h2>
          <p className="text-gray-600 mb-4">
            エラーが発生した場合に適切に処理するコンポーネント
          </p>
          <Button 
            onClick={() => setShowError(!showError)}
            className={showError ? "bg-red-500 hover:bg-red-600" : ""}
          >
            {showError ? "エラーを非表示" : "エラーを表示"}
          </Button>
          
          <div className="mt-4">
            <ErrorBoundary>
              {showError && <ErrorComponent />}
              {!showError && <p className="text-green-600">正常に動作しています</p>}
            </ErrorBoundary>
          </div>
        </div>
        
        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">キーボードショートカット</h2>
          <p className="text-gray-600 mb-4">
            以下のキーを押して動作を確認できます:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>F5: コード実行</li>
            <li>Ctrl+S: プロジェクト保存</li>
            <li>Esc: 選択解除</li>
            <li>G/R/S: 移動/回転/スケール</li>
          </ul>
        </div>
      </div>
    </main>
  );
} 