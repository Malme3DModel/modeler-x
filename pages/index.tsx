import Head from "next/head";
import dynamic from "next/dynamic";
import type { NextPage } from "next";

// We cannot use SSR for our OpenCascade.js viewport,
// therefore we have to load it dynamically without SSR
// https://nextjs.org/docs/advanced-features/dynamic-import#with-no-ssr
const OCJSViewport = dynamic(
  () => import("../components/OCJSViewport"),
  { ssr: false }
);

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>OpenCascade.js Demo</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <OCJSViewport />
      </main>
    </div>
  );
}

export default Home;
