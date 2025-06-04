'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useCADWorker } from '@/hooks/useCADWorker';

const CADTester = dynamic(() => import('@/components/cad/CADTester'), {
  ssr: false,
  loading: () => <div className="loading loading-spinner loading-lg"></div>
});

const CADViewport = dynamic(() => import('@/components/cad/CADViewport'), {
  ssr: false,
  loading: () => <div className="loading loading-spinner loading-lg"></div>
});

export default function CADTestPage() {
  const cadWorkerState = useCADWorker();

  return (
    <div className="h-screen w-full bg-gray-900 flex">
      <div className="w-1/2 border-r border-gray-700">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="loading loading-spinner loading-lg text-primary"></div>
          </div>
        }>
          <CADTester cadWorkerState={cadWorkerState} />
        </Suspense>
      </div>
      
      <div className="w-1/2">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="loading loading-spinner loading-lg text-primary"></div>
          </div>
        }>
          <CADViewport cadWorkerState={cadWorkerState} />
        </Suspense>
      </div>
    </div>
  );
}
