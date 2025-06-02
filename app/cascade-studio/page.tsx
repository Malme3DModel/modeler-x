'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Golden Layout統合コンポーネントを動的インポート
const CascadeStudioLayout = dynamic(() => import('../../components/layout/CascadeStudioLayout'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="text-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
        <p className="mt-4 text-lg text-gray-300">CascadeStudio Loading...</p>
      </div>
    </div>
  )
});

export default function CascadeStudioPage() {
  return (
    <div className="h-screen w-full bg-gray-900">
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen bg-gray-900">
          <div className="text-center">
            <div className="loading loading-spinner loading-lg text-primary"></div>
            <p className="mt-4 text-lg text-gray-300">CascadeStudio 初期化中...</p>
          </div>
        </div>
      }>
        <CascadeStudioLayout />
      </Suspense>
    </div>
  );
} 