import { type NextPage } from "next";
import Head from "next/head";
import { ChangeEvent, MouseEventHandler, useEffect, useState } from "react";
import cn from "classnames";

import { api } from "~/utils/api";
import { messageFromError, toSessionSlug } from "~/utils/session-name";
import Spinner from "~/components/Spinner";
import { useRouter } from "next/router";
import { useDebouncedCallback } from "use-debounce";
import Link from "next/link";

export const MAX_SESSION_NAME_INPUT_LENGTH = 50;

const Home: NextPage = () => {
  const nextRouter = useRouter();

  const [hasProvidedInput, setHasProvidedInput] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [sessionNameErrors, setSessionNameErrors] = useState<
    ReturnType<typeof toSessionSlug>["errors"]
  >([]);
  const [isTyping, setIsTyping] = useState(false);
  const [newSlugDisplayedToClient, setNewSlugDisplayedToClient] = useState("");
  const [newSlugToCheckExists, setNewSlugToCheckExists] = useState("");

  const setNewSlugToCheckExistsDebounced = useDebouncedCallback(
    (nextNewSlug: string) => {
      setIsTyping(false);
      setNewSlugToCheckExists(nextNewSlug);
    },
    500
  );

  useEffect(() => {
    setNewSlugToCheckExistsDebounced(newSlugDisplayedToClient);
  }, [newSlugDisplayedToClient, setNewSlugToCheckExistsDebounced]);

  const [slugExistsQuery] = api.useQueries((trpc) => {
    return [trpc.router.sessionSlugExists({ slug: newSlugToCheckExists })];
  });
  const createSessionMutation = api.router.createSession.useMutation();

  const shouldShowError =
    newSessionName &&
    hasProvidedInput &&
    !isTyping &&
    sessionNameErrors.length > 0;

  const shouldShowSlugAvailableMessage =
    !isTyping &&
    newSlugToCheckExists &&
    newSlugDisplayedToClient === newSlugToCheckExists &&
    hasProvidedInput &&
    !shouldShowError &&
    !slugExistsQuery.isLoading &&
    !slugExistsQuery.isError &&
    !slugExistsQuery.data.exists;

  const shouldShowSlugTakenMessage =
    !isTyping &&
    newSlugToCheckExists &&
    hasProvidedInput &&
    !slugExistsQuery.isLoading &&
    !slugExistsQuery.isError &&
    slugExistsQuery.data.exists;

  const isButtonDisabled =
    isTyping ||
    newSlugToCheckExists.length === 0 ||
    newSlugDisplayedToClient !== newSlugToCheckExists ||
    sessionNameErrors.length > 0 ||
    slugExistsQuery.isLoading ||
    slugExistsQuery.isError ||
    slugExistsQuery.data.exists;

  const handleOnInput = (changeEvent: ChangeEvent<HTMLInputElement>) => {
    changeEvent.preventDefault();

    // Do not allow leading whitespace
    changeEvent.target.value = changeEvent.target.value.trimStart();

    /**
     * The trimmed session name is the one we store in the database. The client
     * can put trailing spaces, but these won't be honored when creating the
     * session on button click.
     */
    const trimmedInputNewSessionName = changeEvent.target.value.trim();

    /**
     * Do not check if the session slug exists if there is no new input from the
     * client or the session name has not changed.
     */
    if (
      (!changeEvent.target.value && !newSessionName) ||
      trimmedInputNewSessionName === newSessionName
    ) {
      return;
    }

    // Calculate the slug from the session name + check for errors
    const { errors, slug } = toSessionSlug(trimmedInputNewSessionName);

    /**
     * Do not set isTyping to true when the slug has not changed (i.e., if the client keeps
     * adding trailing spaces)
     */
    if (slug === newSlugDisplayedToClient) {
      return;
    }

    /**
     * The client has put new and meaningful input at this point. Set the state required
     * to kick off a "session slug exists" query.
     */
    if (trimmedInputNewSessionName) {
      setHasProvidedInput(true);
    }
    setIsTyping(true);
    setNewSlugDisplayedToClient(slug);
    setNewSessionName(trimmedInputNewSessionName);
    setSessionNameErrors(errors);
  };

  const handleOnClickGetStarted: MouseEventHandler<HTMLButtonElement> = async (
    clickEvent
  ) => {
    clickEvent.preventDefault();
    await createSessionMutation.mutateAsync({
      slug: newSlugToCheckExists,
      name: newSessionName,
    });
    nextRouter.push(`/session/${newSlugToCheckExists}`);
  };

  return (
    <>
      <Head>
        <title>Is it my turn?</title>
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
      <main className="pb-32 pt-8">
        <div className="flex flex-row justify-evenly">
          <div className="flex flex-col gap-10 md:gap-16 lg:gap-20 xl:gap-24">
            <h1 className="px-2 text-center text-5xl font-bold md:text-6xl lg:text-7xl xl:text-8xl">
              Never forget who&apos;s next again.
            </h1>
            <div className="flex flex-col gap-2 text-center text-3xl md:text-4xl lg:px-64 lg:text-5xl xl:text-6xl">
              <span className="text-gray-700">
                Select a name, item, or anything you&apos;d like.
              </span>
              <span className="text-teal-500">Without replacement.</span>
            </div>
            <div className="flex flex-col items-center gap-16 lg:flex-row lg:justify-evenly">
              <div className="flex flex-col justify-start">
                <div className="flex flex-col gap-y-4 px-16">
                  <span className="text-4xl font-semibold">Perfect for...</span>
                  <ul className="flex flex-col gap-2 text-2xl">
                    <li>
                      <span className="flex flex-row items-center gap-4">
                        <div className="text-4xl">🎲</div>
                        <div className="text-gray-700">Board game night</div>
                      </span>
                    </li>
                    <li>
                      <span className="flex flex-row items-center gap-4">
                        <div className="text-4xl">🍱</div>
                        <div className="text-gray-700">Meal planning</div>
                      </span>
                    </li>
                    <li>
                      <span className="flex flex-row items-center gap-4">
                        <div className="text-4xl">🧹</div>
                        <div className="text-gray-700">Chore duty</div>
                      </span>
                    </li>
                    <li>
                      <span className="flex flex-row items-center gap-4">
                        <div className="text-4xl">🗣️</div>
                        <div className="text-gray-700">
                          Rotating stand-up leaders
                        </div>
                      </span>
                    </li>
                    <li className="pt-4 italic text-gray-700">...and more!</li>
                  </ul>
                </div>
                {/* Placeholder width for non-mobile viewports */}
                <div className="md:h-[50px]" />
              </div>
              <div className="mx-8 flex h-full min-w-fit flex-col items-center gap-8 md:w-[522px]">
                <input
                  type="text"
                  className="w-64 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-lg text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-teal-500"
                  placeholder="Enter your session name"
                  onInput={handleOnInput}
                  maxLength={MAX_SESSION_NAME_INPUT_LENGTH}
                  required
                />
                {newSlugDisplayedToClient && (
                  <div className="flex w-full grow-0 flex-col items-center gap-2">
                    <div className="flex flex-row items-center justify-center gap-2">
                      <strong
                        className={cn(
                          "whitespace-nowrap",
                          shouldShowError ? "text-red-500" : "text-gray-600"
                        )}
                      >
                        Your session slug will be:
                      </strong>
                      {newSlugDisplayedToClient && (
                        <code
                          className={cn(
                            "w-full max-w-xs grow-0 overflow-auto rounded-md px-1.5 py-1",
                            shouldShowError
                              ? "bg-pink-100 text-red-500"
                              : "bg-gray-200 text-gray-600"
                          )}
                        >
                          {newSlugDisplayedToClient}
                        </code>
                      )}
                    </div>
                  </div>
                )}
                {createSessionMutation.isIdle && (
                  <div className="flex w-full flex-col items-center justify-center gap-8">
                    <div className="flex flex-row justify-evenly">
                      <button
                        disabled={isButtonDisabled}
                        onClick={handleOnClickGetStarted}
                        className="rounded-lg border bg-teal-500 px-5 py-3 text-center text-4xl text-white transition hover:bg-teal-700 disabled:bg-gray-400 disabled:hover:cursor-not-allowed"
                      >
                        Get started
                      </button>
                    </div>
                    {shouldShowError && (
                      <ul className="flex flex-col gap-2 px-2 text-red-500 md:w-[522px] lg:px-0">
                        {sessionNameErrors.map((errorType) => {
                          const { primaryMessage, secondaryMessage } =
                            messageFromError(errorType);
                          return (
                            <li key={errorType}>
                              <div
                                className="border-l-4 border-red-500 bg-red-100 p-4 text-red-700"
                                role="alert"
                              >
                                <p className="font-bold">{primaryMessage}</p>
                                <p>{secondaryMessage}</p>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {(isTyping && <Spinner />) ||
                      (hasProvidedInput && slugExistsQuery.isLoading && (
                        <Spinner />
                      ))}
                    {shouldShowSlugAvailableMessage && (
                      <div
                        className="border-l-4 border-teal-500 bg-teal-100 p-4 text-teal-700"
                        role="alert"
                      >
                        <p className="font-bold">The slug is available!</p>
                        <p>
                          Click <em>Get started</em> to begin your session!
                        </p>
                      </div>
                    )}
                    {shouldShowSlugTakenMessage && (
                      <div className="max-w-[522px] px-4">
                        <div
                          className="border-l-4 border-yellow-500 bg-yellow-100 p-4 text-yellow-700"
                          role="alert"
                        >
                          <p className="font-bold">
                            That slug is already being used for another session.
                          </p>
                          <p>
                            If this slug is yours, click{" "}
                            <Link
                              href={`/session/${newSlugToCheckExists}`}
                              className="text-blue-600 visited:text-purple-600 hover:underline"
                            >
                              here
                            </Link>{" "}
                            to return to your session.
                          </p>
                          <p>
                            If not, then please try using another session name.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {createSessionMutation.isLoading && <Spinner />}
                {createSessionMutation.isError && (
                  <div
                    className="border-l-4 border-red-500 bg-red-100 p-4 text-red-700"
                    role="alert"
                  >
                    <p className="font-bold">
                      Sorry, something went wrong while creating your session!
                    </p>
                    <p>Please refresh the page and try again.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;
