import { type NextPage } from "next";
import Head from "next/head";
import { ChangeEvent, MouseEventHandler, useState } from "react";
import cn from "classnames";

import { api } from "~/utils/api";
import { messageFromError, toSessionSlug } from "~/utils/session-name";
import Spinner from "~/components/Spinner";
import { useRouter } from "next/router";

export const MAX_SESSION_NAME_INPUT_LENGTH = 50;

const Home: NextPage = () => {
  const nextRouter = useRouter();

  const [hasProvidedInput, setHasProvidedInput] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [sessionNameErrors, setSessionNameErrors] = useState<
    ReturnType<typeof toSessionSlug>["errors"]
  >([]);
  const [newSlug, setNewSlug] = useState("");

  const [slugExistsQuery] = api.useQueries((trpc) => {
    return [trpc.router.sessionSlugExists({ slug: newSlug })];
  });
  const createSessionMutation = api.router.createSession.useMutation();

  const shouldShowError = hasProvidedInput && sessionNameErrors.length > 0;
  const shouldShowSlugAvailableMessage =
    newSlug &&
    hasProvidedInput &&
    !slugExistsQuery.isLoading &&
    !slugExistsQuery.isError &&
    !slugExistsQuery.data.exists;
  const shouldShowSlugTakenMessage =
    newSlug &&
    hasProvidedInput &&
    !slugExistsQuery.isLoading &&
    !slugExistsQuery.isError &&
    slugExistsQuery.data.exists;

  const isButtonDisabled =
    newSlug.length === 0 ||
    sessionNameErrors.length > 0 ||
    slugExistsQuery.isLoading ||
    slugExistsQuery.isError ||
    slugExistsQuery.data.exists;

  const handleOnChange = (changeEvent: ChangeEvent<HTMLInputElement>) => {
    changeEvent.preventDefault();
    const { errors, slug } = toSessionSlug(changeEvent.target.value);
    if (changeEvent.target.value) {
      setHasProvidedInput(true);
    }
    if (changeEvent.target.value.length > MAX_SESSION_NAME_INPUT_LENGTH) {
      changeEvent.target.value = changeEvent.target.value.slice(
        0,
        MAX_SESSION_NAME_INPUT_LENGTH + 1
      );
      return;
    }
    setNewSlug(slug);
    setNewSessionName(changeEvent.target.value);
    setSessionNameErrors(errors);
  };

  const handleOnClickGetStarted: MouseEventHandler<HTMLButtonElement> = async (
    clickEvent
  ) => {
    clickEvent.preventDefault();
    await createSessionMutation.mutateAsync({
      slug: newSlug,
      name: newSessionName,
    });
    nextRouter.push(`/session/${newSlug}`);
  };

  return (
    <>
      <Head>
        <title>Is it my turn?</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="pb-32 pt-8">
        <div className="flex flex-row justify-evenly">
          <div className="flex flex-col gap-24">
            <h1 className="text-center text-8xl">
              Never forget who&apos;s next again.
            </h1>
            <span className="px-64 text-center text-6xl">
              Select a name, item, or anything you&apos;d like. Without
              replacement.
            </span>
            <div className="flex flex-row justify-evenly">
              <div className="mx-16 flex flex-col gap-y-4">
                <span className="text-4xl">Perfect for...</span>
                <ul className="flex flex-col gap-2 text-2xl">
                  <li>
                    <span className="flex flex-row items-center gap-4">
                      <div className="text-4xl">🎲</div>
                      <div>Board game night</div>
                    </span>
                  </li>
                  <li>
                    <span className="flex flex-row items-center gap-4">
                      <div className="text-4xl">🍱</div>
                      <div>Meal planning</div>
                    </span>
                  </li>
                  <li>
                    <span className="flex flex-row items-center gap-4">
                      <div className="text-4xl">🧹</div>
                      <div>Chore duty</div>
                    </span>
                  </li>
                  <li>
                    <span className="flex flex-row items-center gap-4">
                      <div className="text-4xl">🗣️</div>
                      <div>Rotating stand-up leaders</div>
                    </span>
                  </li>
                  <li className="pt-4">...and more!</li>
                </ul>
              </div>
              <div className="w-1/3">
                <div className="flex w-full flex-col items-center justify-center gap-8">
                  <input
                    type="text"
                    className="w-64 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-lg text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-teal-500"
                    placeholder="Enter your session name"
                    onChange={handleOnChange}
                    required
                  />
                  {newSlug && (
                    <div className="flex w-full flex-col gap-2">
                      <div className="flex flex-row items-center justify-center gap-2">
                        <strong
                          className={cn(
                            "whitespace-nowrap",
                            shouldShowError ? "text-red-500" : "text-gray-600"
                          )}
                        >
                          Your session slug will be:
                        </strong>
                        <code
                          className={cn(
                            "overflow-auto rounded-md px-1.5 py-1",
                            shouldShowError
                              ? "bg-pink-100 text-red-500"
                              : "bg-gray-200 text-gray-600"
                          )}
                        >
                          {newSlug}
                        </code>
                      </div>
                      {sessionNameErrors.length > 0 && (
                        <ul className="ml-4 list-disc whitespace-pre-line text-red-500">
                          {sessionNameErrors.map((errorType) => (
                            <li key={errorType}>
                              {messageFromError(errorType)}
                            </li>
                          ))}
                        </ul>
                      )}
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
                      {hasProvidedInput && slugExistsQuery.isLoading && (
                        <Spinner />
                      )}
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
                        <div
                          className="border-l-4 border-red-500 bg-red-100 p-4 text-red-700"
                          role="alert"
                        >
                          <p className="font-bold">
                            Sorry, that slug is already being used for another
                            session!
                          </p>
                          <p>Please try using another session name.</p>
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
        </div>
      </main>
    </>
  );
};

export default Home;
