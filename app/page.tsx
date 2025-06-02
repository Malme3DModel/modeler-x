import dynamic from "next/dynamic";

// Three.js ベースの OpenCascade.js ビューポート
// SSR は無効化（OpenCascade.js がブラウザ専用のため）
const ThreeJSViewport = dynamic(
  () => import("../components/threejs/ThreeJSViewport"),
  { ssr: false }
);

export default function Home() {
  return (
    <main>
      <ThreeJSViewport />
    </main>
  );
} 