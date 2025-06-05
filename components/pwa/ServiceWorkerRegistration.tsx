'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // GitHub Pages用のbasePath対応
      const isGitHubPages = window.location.hostname.includes('github.io');
      const basePath = isGitHubPages ? '/modeler-x' : '';
      const swPath = `${basePath}/sw.js`;
      
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
