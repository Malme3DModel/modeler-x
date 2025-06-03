import dynamic from "next/dynamic";

// Three.js ベースの OpenCascade.js ビューポート
// SSR を有効化（コンポーネントが初期ロード時に表示されるように）
const ThreeJSViewport = dynamic(
  () => import("../components/threejs/ThreeJSViewport"),
  { ssr: true }
);

export default function Home() {
  return (
    <main className="flex min-h-screen w-full">
      <ThreeJSViewport />
    </main>
  );
} 