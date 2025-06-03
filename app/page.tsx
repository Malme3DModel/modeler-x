'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/cascade-studio');
  }, [router]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center">
      <div className="text-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
        <p className="mt-4 text-lg text-gray-500">リダイレクト中...</p>
      </div>
    </div>
  );
} 