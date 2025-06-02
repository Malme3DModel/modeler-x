import Head from "next/head";
import Image from "next/image";
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
    <div className="px-8">
      <Head>
        <title>OpenCascade.js Demo</title>
        <meta name="description" content="OpenCascade.js demo application with Next.js and TypeScript" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen py-16 flex flex-1 flex-col justify-center items-center">
        <h1 className="m-0 leading-[1.15] text-4xl text-center">
          Welcome to <a href="https://ocjs.org" className="text-[#b39b00] no-underline hover:underline">OpenCascade.js!</a>
        </h1>

        <p className="my-16 leading-6 text-xl text-center">
          Get started by editing{" "}
          <code className="bg-[#fafafa] rounded px-3 py-3 text-base font-mono">components/OCJSViewport.tsx</code>
        </p>

        <div className="flex items-center justify-center flex-wrap max-w-[800px] w-full max-[600px]:flex-col">
          <a href="https://ocjs.org/reference-docs" className="m-4 p-6 text-left text-inherit no-underline border border-gray-200 rounded-xl transition-colors duration-150 max-w-[300px] hover:text-[#b39b00] hover:border-[#b39b00]">
            <h2 className="m-0 mb-4 text-xl">Reference Documentation &rarr;</h2>
            <p className="m-0 text-lg leading-6">Find in-depth information about OpenCascade.js features and API.</p>
          </a>

          <a href="https://ocjs.org/docs/getting-started/hello-world" className="m-4 p-6 text-left text-inherit no-underline border border-gray-200 rounded-xl transition-colors duration-150 max-w-[300px] hover:text-[#b39b00] hover:border-[#b39b00]">
            <h2 className="m-0 mb-4 text-xl">Guides &rarr;</h2>
            <p className="m-0 text-lg leading-6">Get started and learn about some of the more advanced topics on our documentation website!</p>
          </a>

          <a
            href="https://ocjs.org/docs/examples/bottle"
            className="m-4 p-6 text-left text-inherit no-underline border border-gray-200 rounded-xl transition-colors duration-150 max-w-[300px] hover:text-[#b39b00] hover:border-[#b39b00]"
          >
            <h2 className="m-0 mb-4 text-xl">Examples &rarr;</h2>
            <p className="m-0 text-lg leading-6">Check out some of the interactive examples on our website.</p>
          </a>

          <a
            href="https://github.com/donalffons/opencascade.js/discussions"
            className="m-4 p-6 text-left text-inherit no-underline border border-gray-200 rounded-xl transition-colors duration-150 max-w-[300px] hover:text-[#b39b00] hover:border-[#b39b00]"
          >
            <h2 className="m-0 mb-4 text-xl">Discuss &rarr;</h2>
            <p className="m-0 text-lg leading-6">
              Get in touch with the community and help us build awesome CAD tools.
            </p>
          </a>
        </div>
        <OCJSViewport />
      </main>

      <footer className="flex flex-1 py-8 border-t border-gray-200 justify-center items-center">
        <a
          href="https://ocjs.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex justify-center items-center flex-grow"
        >
          Powered by{" "}
          <span className="ml-2">
            <Image src="https://raw.githubusercontent.com/donalffons/opencascade.js/master/images/logo.svg" alt="Ocjs Logo" width={150} height={50} />
          </span>
        </a>
      </footer>
    </div>
  );
}

export default Home;
