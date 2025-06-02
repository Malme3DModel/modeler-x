import dynamic from "next/dynamic";

// We cannot use SSR for our OpenCascade.js viewport,
// therefore we have to load it dynamically without SSR
// https://nextjs.org/docs/advanced-features/dynamic-import#with-no-ssr
const OCJSViewport = dynamic(
  () => import("../components/OCJSViewport"),
  { ssr: false }
);

// 新しいThree.jsコンポーネント
const ThreeJSViewport = dynamic(
  () => import("../components/threejs/ThreeJSViewport"),
  { ssr: false }
);

export default function Home() {
  // 環境変数による切り替え
  const useThreeJS = process.env.NEXT_PUBLIC_USE_THREEJS === 'true';
  
  return (
    <main>
      {useThreeJS ? <ThreeJSViewport /> : <OCJSViewport />}
    </main>
  );
} 