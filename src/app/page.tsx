'use client';

import { useEffect } from 'react';
import TopNavigation from './components/TopNavigation';
import CascadeStudio from './components/CascadeStudio';

export default function Home() {
  useEffect(() => {
    // Service Workerの登録
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').then(
        (registration) => {
          registration.update();
        },
        () => {
          console.log('Could not register Modeler X for offline use!');
        }
      );
    } else {
      console.log('Browser does not support offline access!');
    }
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-800">
      <CascadeStudio />
    </div>
  );
}
