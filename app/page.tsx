import dynamic from "next/dynamic";

// We cannot use SSR for our OpenCascade.js viewport,
// therefore we have to load it dynamically without SSR
// https://nextjs.org/docs/advanced-features/dynamic-import#with-no-ssr
const OCJSViewport = dynamic(
  () => import("../components/OCJSViewport"),
  { ssr: false }
);

export default function Home() {
  return (
    <main>
      <OCJSViewport />
    </main>
  );
} 