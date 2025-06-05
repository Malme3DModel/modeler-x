import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallBanner() {
  // PWAインストールバナーを非表示にする
  return null;

  // 以下のコードはコメントアウト
  /*
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA installed');
    }
    
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDeferredPrompt(null);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Modeler-Xをインストール</h3>
          <p className="text-xs mt-1 opacity-90">
            オフラインでも使用できるCADアプリとしてインストールしますか？
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-2 text-white hover:text-gray-200"
        >
          ×
        </button>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleInstallClick}
          className="bg-white text-blue-600 px-3 py-1 rounded text-xs font-medium hover:bg-gray-100"
        >
          インストール
        </button>
        <button
          onClick={handleDismiss}
          className="text-white text-xs hover:text-gray-200"
        >
          後で
        </button>
      </div>
    </div>
  );
  */
}
