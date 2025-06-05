'use client';

import { useEffect } from 'react';
import { getAssetPath } from '@/lib/utils/paths';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const swPath = getAssetPath('/sw.js');
      
      navigator.serviceWorker
        .register(swPath)
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    }
  }, []);

  return null;
}
