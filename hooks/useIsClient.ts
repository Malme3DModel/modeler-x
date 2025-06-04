import { useState, useEffect } from 'react';

/**
 * クライアントサイドレンダリングを検出するためのフック
 * SSRの場合はfalseを返し、クライアントサイドマウント後にtrueを返す
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
} 