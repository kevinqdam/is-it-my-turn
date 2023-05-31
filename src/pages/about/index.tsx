import { type NextPage } from "next";
import Head from "next/head";

import Link from "next/link";
import Image from "next/image";
import appDemo from "../../../public/is-it-my-turn.gif";

export const MAX_SESSION_NAME_INPUT_LENGTH = 50;

const About: NextPage = () => {
  return (
    <>
      <Head>
        <title>Is it my turn? - About</title>
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#ec4899" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />
      </Head>
      <main>
        <div className="flex h-full w-full flex-row justify-evenly">
          <div>
            <h1 className="text-4xl font-semibold">
              This app is for you if...
            </h1>
            <ul className="ml-5 list-disc pt-2 text-lg text-gray-700">
              <li className="py-1">
                You need to keep track of who or what hasn&apos;t gone yet
              </li>
              <li className="py-1">
                You need to keep track of who or what is up next
              </li>
              <li className="py-1">
                You need to keep track of who or what has gone already
              </li>
              <li className="py-1">
                You would like to randomize the order every now and then
              </li>
            </ul>
            <h1 className="pt-8 text-4xl font-semibold">If you like it...</h1>
            <p className="pt-2 text-lg text-gray-700">
              ...then please consider donating to help maintain the app!
            </p>
            <div className="pt-8">
              <Link
                className="flex flex-row gap-1 text-blue-600 visited:text-purple-600 hover:underline"
                href="https://ko-fi.com/kevinqdam"
                passHref
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit my Ko-fi page
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                  />
                </svg>
              </Link>
            </div>
          </div>
          <div className="w-3/5 shadow-xl">
            <Image
              src={appDemo}
              alt="A .gif image demonstrating the isitmyturn.io app"
              height={3348}
              width={1928}
            />
          </div>
        </div>
      </main>
    </>
  );
};

export default About;
