'use client';

import { useState, useEffect } from 'react';
import { Button } from './button';

interface ShortcutInfo {
  key: string;
  description: string;
  category: string;
}

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * キーボードショートカットとヘルプ情報を表示するモーダル
 */
export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'about'>('shortcuts');

  // キーボード操作でモーダルを閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 表示用のショートカット情報
  const shortcuts: ShortcutInfo[] = [
    { key: 'F5', description: 'コードを実行', category: '基本操作' },
    { key: 'Ctrl+S', description: 'プロジェクトを保存', category: '基本操作' },
    { key: 'Esc', description: '選択解除', category: '基本操作' },
    { key: 'G', description: '移動ツール', category: '3D操作' },
    { key: 'R', description: '回転ツール', category: '3D操作' },
    { key: 'S', description: 'スケールツール', category: '3D操作' },
    { key: '1', description: '前面視点', category: 'カメラ' },
    { key: '2', description: '背面視点', category: 'カメラ' },
    { key: '3', description: '上面視点', category: 'カメラ' },
    { key: '4', description: '底面視点', category: 'カメラ' },
    { key: '5', description: '左側面視点', category: 'カメラ' },
    { key: '6', description: '右側面視点', category: 'カメラ' },
    { key: '7', description: 'アイソメトリック視点', category: 'カメラ' },
    { key: 'F', description: 'オブジェクトにフィット', category: 'カメラ' },
  ];

  // カテゴリーごとにグループ化
  const categories = shortcuts.reduce<Record<string, ShortcutInfo[]>>((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {});

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-2xl overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">ヘルプ</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* タブ */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`px-4 py-2 ${activeTab === 'shortcuts' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('shortcuts')}
          >
            ショートカット
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'about' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('about')}
          >
            Modeler-Xについて
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {activeTab === 'shortcuts' ? (
            <div>
              {Object.entries(categories).map(([category, shortcuts]) => (
                <div key={category} className="mb-6">
                  <h3 className="text-lg font-medium mb-2">{category}</h3>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <tbody>
                        {shortcuts.map((shortcut, index) => (
                          <tr 
                            key={index} 
                            className={index % 2 === 0 ? 'bg-transparent' : 'bg-gray-100 dark:bg-gray-800'}
                          >
                            <td className="py-2 px-4">
                              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm">
                                {shortcut.key}
                              </kbd>
                            </td>
                            <td className="py-2 px-4">{shortcut.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Modeler-X</h3>
              <p>
                Modeler-Xは、OpenCascadeをベースにしたパラメトリック3D CADモデリングアプリケーションです。
                コードベースのモデリングにより、複雑な形状を簡単に作成できます。
              </p>
              <p>
                主な機能:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>TypeScriptベースのモデリング</li>
                <li>リアルタイムプレビュー</li>
                <li>STEP/IGESファイルのインポート・エクスポート</li>
                <li>3Dオブジェクト操作</li>
                <li>カスタマイズ可能なUI</li>
              </ul>
              <p className="text-sm text-gray-500 mt-4">
                バージョン: 1.0.0<br />
                © 2024 Modeler-X Team
              </p>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={onClose}>閉じる</Button>
        </div>
      </div>
    </div>
  );
} 