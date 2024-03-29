import { GetServerSideProps, NextPage } from "next";
import { api } from "~/utils/api";
import { shuffleArray } from "~/utils/shuffle-array";
import { AnimatePresence, Reorder, motion } from "framer-motion";
import {
  BaseSyntheticEvent,
  ChangeEventHandler,
  useEffect,
  useState,
} from "react";
import { Item, List } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import LoadingList from "../../components/LoadingList";
import QueueListItem from "~/components/QueueListItem";
import { useRouter } from "next/router";
import cn from "classnames";
import { prisma } from "~/server/db";
import { appRouter } from "~/server/api/root";
import { MAX_ITEM_NAME_LENGTH } from "~/utils/session-name";
import Head from "next/head";
import { useDebouncedCallback } from "use-debounce";

/**
 * Comparator to sort an array of {@link Item}s in ascending order
 */
const byAscendingOrder = (a: Item, b: Item) => a.order - b.order;

/**
 * The ID of the `input` element that accepts input to add another Item
 * to the queue
 */
const NEW_QUEUE_ITEM_INPUT_NAME = "newQueueItem";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const apiCaller = appRouter.createCaller({ prisma });
  const { exists: doesSlugExist, name } =
    await apiCaller.router.sessionSlugExists({
      slug: context?.params?.slug as string,
    });
  if (!doesSlugExist) {
    return {
      notFound: true,
    };
  }
  return { props: { name } };
};

const Session: NextPage<{ name: string }> = ({ name }) => {
  const router = useRouter();
  const apiContext = api.useContext();

  const sessionItemsQuery = api.router.getAllSessionItems.useQuery(
    { sessionSlug: router.query.slug as string },
    {
      refetchOnWindowFocus: "always",
      enabled: Boolean(router.query.slug),
      staleTime: Infinity,
    }
  );
  const createSessionItemMutation = api.router.createSessionItem.useMutation({
    retry: false,
    onError: () => apiContext.invalidate(),
  });
  const updateSessionItemMutation = api.router.updateSessionItem.useMutation({
    retry: false,
    onError: () => apiContext.invalidate(),
  });
  const updateWhosNextMutation = api.router.updateWhosNext.useMutation({
    retry: false,
    onError: () => apiContext.invalidate(),
  });
  const updateSessionItemBatchMutation =
    api.router.updateSessionItemBatch.useMutation({
      retry: false,
      onError: () => apiContext.invalidate(),
    });
  const deleteSessionItemMutation = api.router.deleteSessionItem.useMutation({
    retry: false,
    onError: () => apiContext.invalidate(),
  });

  const [queueItems, setQueueItems] = useState<Item[]>([]);
  const [nextItem, setNextItem] = useState<Item>();
  const [wentAlreadyItems, setWentAlreadyItems] = useState<Item[]>([]);
  const [shouldShowAddToQueueError, setShouldShowAddToQueueError] =
    useState(false);
  const [isStatusBarVisible, setIsStatusBarVisible] = useState(false);
  const [statusBarTimeoutId, setStatusBarTimeoutId] = useState<
    number | undefined
  >();
  const [visibleMobileList, setVisibleMobileList] = useState<List>("NEXT");
  const [isReorderDebounceWaiting, setIsReorderDebounceWaiting] =
    useState(false);

  /**
   * Set the data in the client after the query resolves successfully
   */
  useEffect(() => {
    if (sessionItemsQuery.isSuccess) {
      const sessionItemsCopy = [...sessionItemsQuery.data];
      sessionItemsCopy.sort(byAscendingOrder);
      setQueueItems(sessionItemsCopy.filter((item) => item.list === "QUEUE"));
      setNextItem(sessionItemsCopy.find((item) => item.list === "NEXT"));
      setWentAlreadyItems(
        sessionItemsCopy.filter((item) => item.list === "WENT")
      );
    }
  }, [sessionItemsQuery.data, sessionItemsQuery.isSuccess]);

  const isQueryLoading =
    sessionItemsQuery.isLoading || sessionItemsQuery.isRefetching;
  const isQueryError =
    sessionItemsQuery.isError || sessionItemsQuery.isRefetchError;
  const isCreateUpdateMutationLoading =
    createSessionItemMutation.isLoading ||
    updateSessionItemMutation.isLoading ||
    updateWhosNextMutation.isLoading ||
    updateSessionItemBatchMutation.isLoading ||
    isReorderDebounceWaiting;
  const isCreateUpdateMutationError =
    createSessionItemMutation.isError ||
    updateSessionItemMutation.isError ||
    updateWhosNextMutation.isError ||
    updateSessionItemBatchMutation.isError;

  /**
   * The status bar is visible whenever any query or mutation is loading
   */
  useEffect(() => {
    if (isQueryLoading || isCreateUpdateMutationLoading) {
      if (statusBarTimeoutId !== undefined) {
        clearTimeout(statusBarTimeoutId);
      }
      setIsStatusBarVisible(true);
    }
  // NOTE: do not put `statusBarTimeoutId` in the dependency array. Performance suffers for no benefit.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isQueryLoading, isCreateUpdateMutationLoading]);

  /**
   * The status bar hides when the queries and mutations are all successful
   */
  useEffect(() => {
    if (
      sessionItemsQuery.isSuccess &&
      !isCreateUpdateMutationLoading &&
      !isCreateUpdateMutationError
    ) {
      if (statusBarTimeoutId !== undefined) {
        clearTimeout(statusBarTimeoutId);
      }
      setStatusBarTimeoutId(
        setTimeout(
          () => setIsStatusBarVisible(false),
          1_000
        ) as unknown as number
      );
    }
  // NOTE: do not put `statusBarTimeoutId` in the dependency array. Performance suffers for no benefit.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sessionItemsQuery.isSuccess,
    isCreateUpdateMutationLoading,
    isCreateUpdateMutationError,
  ]);

  /**
   * The status bar is visible when there is an error
   */
  useEffect(() => {
    if (isQueryError || isCreateUpdateMutationError) {
      setIsStatusBarVisible(true);
    }
  }, [isQueryError, isCreateUpdateMutationError]);

  const isShuffleDisabled =
    isCreateUpdateMutationLoading ||
    sessionItemsQuery.isLoading ||
    sessionItemsQuery.isFetching;
  const isResetDisabled =
    isCreateUpdateMutationLoading ||
    sessionItemsQuery.isLoading ||
    sessionItemsQuery.isFetching;
  const isCreateQueueItemInputDisabled =
    isCreateUpdateMutationLoading ||
    sessionItemsQuery.isLoading ||
    sessionItemsQuery.isFetching;
  const isWhosNextDisabled =
    sessionItemsQuery.isLoading ||
    sessionItemsQuery.isFetching ||
    queueItems.length === 0 ||
    isCreateUpdateMutationLoading;

  const handleWhosNextClick = () => {
    const [maybeNextItem] = queueItems;
    if (!maybeNextItem) {
      return;
    }
    const newNextItem = { ...maybeNextItem, list: List.NEXT };
    const newQueueItems = queueItems.slice(1);
    // current next item is added to the WENT list
    const currentNextItem = nextItem && { ...nextItem, list: List.WENT };
    const newWentAlreadyItems = currentNextItem
      ? [...wentAlreadyItems, currentNextItem]
      : [...wentAlreadyItems];
    setQueueItems(newQueueItems);
    setNextItem(newNextItem);
    setWentAlreadyItems(newWentAlreadyItems);
    updateWhosNextMutation.mutate({
      currentNextItem: currentNextItem && {
        sessionSlug: router.query.slug as string,
        itemIdToUpdate: currentNextItem.id,
        newList: currentNextItem.list,
        newOrder: currentNextItem.order,
        newName: currentNextItem.name,
      },
      newNextItem: {
        sessionSlug: router.query.slug as string,
        itemIdToUpdate: newNextItem.id,
        newList: newNextItem.list,
        newOrder: newNextItem.order,
        newName: newNextItem.name,
      },
    });
  };

  const handleShuffleClick = () => {
    const queueItemsCopy = [...queueItems];
    shuffleArray(queueItemsCopy);
    const minimumOrder = Math.min(
      ...queueItemsCopy.map((item: Item) => item.order)
    );
    const newQueueItems = queueItemsCopy.map((item, index) => {
      const newOrder = minimumOrder + index;
      return {
        ...item,
        order: newOrder,
      };
    });
    setQueueItems(newQueueItems);
    updateSessionItemBatchMutation.mutate(
      newQueueItems.map((item) => {
        return {
          sessionSlug: router.query.slug as string,
          itemIdToUpdate: item.id,
          newList: item.list,
          newName: item.name,
          newOrder: item.order,
        };
      })
    );
  };

  const handleResetClick = () => {
    const newQueueItems = [
      ...queueItems,
      ...wentAlreadyItems,
      ...(nextItem ? [nextItem] : []),
    ].map((queueItem, index) => ({
      ...queueItem,
      list: List.QUEUE,
      order: index,
    }));
    setQueueItems(newQueueItems);
    setNextItem(undefined);
    setWentAlreadyItems([]);
    updateSessionItemBatchMutation.mutate(
      newQueueItems.map((item) => ({
        sessionSlug: router.query.slug as string,
        itemIdToUpdate: item.id,
        newList: item.list,
        newName: item.name,
        newOrder: item.order,
      }))
    );
  };

  const handleOnChangeAddToQueue: ChangeEventHandler<HTMLInputElement> = (
    changeEvent
  ) => {
    changeEvent.preventDefault();
    setShouldShowAddToQueueError(false);
    if (changeEvent.target.value.length > MAX_ITEM_NAME_LENGTH) {
      setShouldShowAddToQueueError(true);
    }
  };

  const handleAddToQueue = (submitEvent: BaseSyntheticEvent<SubmitEvent>) => {
    submitEvent.preventDefault();
    const formElement = new FormData(submitEvent.target);
    const formData = Object.fromEntries(formElement.entries()) as {
      [NEW_QUEUE_ITEM_INPUT_NAME]: string;
    };
    if (
      !formData[NEW_QUEUE_ITEM_INPUT_NAME] ||
      formData[NEW_QUEUE_ITEM_INPUT_NAME].length > MAX_ITEM_NAME_LENGTH
    ) {
      return;
    }
    const queueItemToInsertOrder =
      queueItems.length + wentAlreadyItems.length + (nextItem ? 1 : 0);
    const queueItemName = formData[NEW_QUEUE_ITEM_INPUT_NAME];
    const queueItemToInsert: Item = {
      name: queueItemName,
      id: uuidv4(),
      order: queueItemToInsertOrder,
      list: "QUEUE",
      updatedAt: new Date(),
      createdAt: new Date(),
      sessionSlug: router.query.slug as string,
    };
    const newQueueItems = [...queueItems, queueItemToInsert];
    setQueueItems(newQueueItems);
    createSessionItemMutation.mutate({
      id: queueItemToInsert.id,
      sessionSlug: router.query.slug as string,
      name: queueItemName,
      order: queueItems.length + wentAlreadyItems.length + (nextItem ? 1 : 0),
      list: "QUEUE",
    });

    // clear the input after successful submit
    submitEvent.target.reset();
  };

  const handleUpdateItem = (targetItemId: string, newItemName: string) => {
    const newQueueItems = [...queueItems];
    const itemToUpdate = newQueueItems.find((item) => item.id === targetItemId);
    if (!itemToUpdate) {
      return;
    }
    itemToUpdate.name = newItemName;
    updateSessionItemMutation.mutate({
      sessionSlug: router.query.slug as string,
      itemIdToUpdate: itemToUpdate.id,
      newName: newItemName,
      newOrder: itemToUpdate.order,
      newList: itemToUpdate.list,
    });
  };

  const updateReorderDebounced = useDebouncedCallback((queueItems: Item[]) => {
    updateSessionItemBatchMutation.mutate(
      queueItems.map((item, index) => ({
        sessionSlug: router.query.slug as string,
        itemIdToUpdate: item.id,
        newName: item.name,
        newOrder: index,
        newList: item.list,
      }))
    );
    setIsReorderDebounceWaiting(false);
  }, 1_500);
  const handleReorderQueue = (queueItems: Item[]) => {
    setIsReorderDebounceWaiting(true);
    const minOrder = Math.min(...queueItems.map((item) => item.order));
    setQueueItems(
      queueItems.map((item, index) => {
        const newOrder = minOrder + index;
        return {
          ...item,
          order: newOrder,
        };
      })
    );
    updateReorderDebounced(queueItems);
  };

  const handleDeleteQueueItem = (itemToDelete: Item) => {
    deleteSessionItemMutation.mutateAsync({
      sessionSlug: router.query.slug as string,
      itemIdToDelete: itemToDelete.id,
    });
    setQueueItems(queueItems.filter((item) => item.id !== itemToDelete.id));
  };

  return (
    <motion.main layout className="h-full overflow-auto">
      <Head>
        <title>{name}</title>
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
      {/* Status bar */}
      <AnimatePresence>
        {isStatusBarVisible && (
          <motion.div
            initial={{ y: -140 }}
            animate={{ y: -60 }}
            exit={{ y: -150 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={cn("absolute flex w-full justify-center")}
            aria-hidden={!isStatusBarVisible}
          >
            {((isQueryLoading || isCreateUpdateMutationLoading) && (
              <div
                className="absolute rounded-lg border border-slate-500 bg-slate-100 px-4 py-3 text-slate-700"
                role="alert"
              >
                <p className="font-bold">Loading...</p>
              </div>
            )) ||
              ((isQueryError || isCreateUpdateMutationError) && (
                <div
                  className="absolute rounded-lg border border-red-500 bg-red-100 px-4 py-3 text-red-700"
                  role="alert"
                >
                  <p>
                    <span className="font-bold">
                      Sorry, something went wrong!
                    </span>{" "}
                    Please refresh the page and try again.
                  </p>
                </div>
              )) || (
                <div
                  className="absolute rounded-lg border border-green-500 bg-green-100 px-4 py-3 text-green-700"
                  role="alert"
                >
                  <p className="font-bold">Success!</p>
                </div>
              )}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Mobile buttons */}
      <ul className="flex h-10 w-full justify-center -space-x-px pt-4 text-base md:hidden">
        <li>
          <button
            onClick={() => setVisibleMobileList("QUEUE")}
            className={cn(
              "ml-0 flex h-10 items-center justify-center rounded-l-lg border border-gray-300 px-4 leading-tight",
              visibleMobileList === "QUEUE"
                ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                : "bg-white text-gray-500 hover:bg-gray-100"
            )}
          >
            Queue
          </button>
        </li>
        <li>
          <button
            onClick={() => setVisibleMobileList("NEXT")}
            className={cn(
              "flex h-10 items-center justify-center border border-gray-300 px-4 leading-tight",
              visibleMobileList === "NEXT"
                ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                : "bg-white text-gray-500 hover:bg-gray-100"
            )}
          >
            Next
          </button>
        </li>
        <li>
          <button
            onClick={() => setVisibleMobileList("WENT")}
            className={cn(
              "flex h-10 items-center justify-center rounded-r-lg border border-gray-300 px-4 leading-tight",
              visibleMobileList === "WENT"
                ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                : "bg-white text-gray-500 hover:bg-gray-100"
            )}
          >
            Went
          </button>
        </li>
      </ul>
      {/* App */}
      <motion.div
        layout
        className="flex h-[65vh] flex-col justify-between gap-8 overflow-auto p-4 pt-12 md:h-full md:gap-6"
      >
        <motion.div
          layout
          className="mx-4 flex h-full min-h-fit flex-col overflow-scroll rounded-lg p-4 px-6 shadow-md ring-1 ring-black/5 md:flex-row md:justify-evenly md:gap-10 md:overflow-hidden md:px-0 md:shadow-none md:ring-0"
        >
          <motion.div className="flex w-full flex-col gap-4">
            <motion.h1
              layout
              className="hidden w-full text-center text-2xl font-bold md:block"
            >
              In the queue
            </motion.h1>
            <motion.div
              layout
              className={cn(
                "h-72 w-full flex-col overflow-hidden rounded-lg border md:flex md:h-full",
                visibleMobileList === "QUEUE" ? "flex" : "hidden"
              )}
            >
              <motion.div className="flex h-full flex-col overflow-auto">
                {(sessionItemsQuery.isLoading && (
                  <LoadingList itemCount={7} />
                )) || (
                  <motion.div layout className="w-full p-4">
                    <Reorder.Group
                      axis="y"
                      values={queueItems}
                      onReorder={handleReorderQueue}
                      className="flex h-full w-full flex-col gap-4"
                    >
                      {queueItems.map((queueItem) => (
                        <QueueListItem
                          key={queueItem.id}
                          item={queueItem}
                          isCreateUpdateMutationLoading={
                            isCreateUpdateMutationLoading
                          }
                          handleUpdateItem={handleUpdateItem}
                          handleDeleteQueueItem={handleDeleteQueueItem}
                        />
                      ))}
                    </Reorder.Group>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
          <motion.div className="flex w-full flex-col gap-4">
            <motion.h1
              layout
              className="hidden w-full text-center text-2xl font-bold md:block"
            >
              Up next
            </motion.h1>
            <motion.div
              layout
              className={cn(
                "h-36 w-full flex-col overflow-hidden rounded-lg border md:flex md:h-full",
                visibleMobileList === "NEXT" ? "flex" : "hidden"
              )}
            >
              {(sessionItemsQuery.isLoading && (
                <LoadingList itemCount={2} />
              )) || (
                <motion.div layout className="flex w-full flex-col p-4">
                  <AnimatePresence>
                    {nextItem && (
                      <motion.span
                        layout
                        key={nextItem.name}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: 0.2,
                        }}
                        className="flex flex-row gap-4 rounded-lg border bg-green-100 p-4"
                      >
                        {nextItem.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
          <motion.div className="flex w-full flex-col gap-4">
            <motion.h1
              layout
              className="hidden w-full text-center text-2xl font-bold md:block"
            >
              Went already
            </motion.h1>
            <motion.div
              layout
              className={cn(
                "h-72 w-full flex-col overflow-auto rounded-lg border md:flex md:h-full",
                visibleMobileList === "WENT" ? "flex" : "hidden"
              )}
            >
              {(sessionItemsQuery.isLoading && (
                <LoadingList itemCount={7} />
              )) || (
                <AnimatePresence>
                  {wentAlreadyItems.length > 0 ? (
                    <motion.div
                      layout
                      className="flex w-full flex-col gap-4 p-4"
                    >
                      {wentAlreadyItems.map((wentAlreadyItem) => (
                        <motion.span
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex flex-row gap-4 rounded-lg border bg-slate-200 p-4"
                          key={wentAlreadyItem.id}
                        >
                          {wentAlreadyItem.name}
                        </motion.span>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div layout className="flex w-full" />
                  )}
                </AnimatePresence>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
        <motion.div className="flex flex-col items-center gap-4 md:flex-row md:gap-0">
          <motion.div className="w-full pl-4 pr-4 md:w-1/3 md:pr-6">
            <motion.form
              layout
              onSubmit={handleAddToQueue}
              className={cn(
                "flex flex-row justify-between rounded-lg border p-4",
                shouldShowAddToQueueError
                  ? "border-red-500 bg-red-100"
                  : "bg-transparent"
              )}
            >
              <motion.input
                layout
                name={NEW_QUEUE_ITEM_INPUT_NAME}
                onChange={handleOnChangeAddToQueue}
                placeholder="Add to queue"
                className={cn(
                  "mr-2 w-full placeholder-gray-400 outline-none disabled:bg-transparent disabled:placeholder-opacity-0 disabled:hover:cursor-not-allowed",
                  shouldShowAddToQueueError && "bg-red-100 text-red-700"
                )}
                disabled={isCreateQueueItemInputDisabled}
              />
              <motion.button type="submit" layout>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  className={cn(
                    "h-6 w-6",
                    shouldShowAddToQueueError
                      ? "stroke-red-700"
                      : "stroke-slate-600",
                    isCreateQueueItemInputDisabled && "stroke-transparent"
                  )}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </motion.button>
            </motion.form>
          </motion.div>
          {shouldShowAddToQueueError && (
            <motion.div
              className="w-1/3 border-l-4 border-red-500 bg-red-100 p-4 text-red-700"
              role="alert"
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.p>
                <motion.strong>The item name is too long.</motion.strong> Please
                shorten the name of the item.
              </motion.p>
            </motion.div>
          )}
        </motion.div>
        <motion.div layout className="mx-4 flex flex-row justify-evenly">
          <motion.div layout className="flex flex-row gap-6">
            <motion.button
              layout
              onClick={handleShuffleClick}
              disabled={isShuffleDisabled}
              className="rounded-lg border border-teal-500 px-4 py-2 text-teal-500 transition enabled:hover:bg-teal-100 disabled:border-0 disabled:bg-gray-400 disabled:text-white disabled:hover:cursor-not-allowed"
            >
              Shuffle queue
            </motion.button>
            <motion.button
              layout
              onClick={handleResetClick}
              disabled={isResetDisabled}
              className="rounded-lg border border-pink-500 px-4 py-2 text-pink-500 transition enabled:hover:bg-pink-100 disabled:border-0 disabled:bg-gray-400 disabled:text-white disabled:hover:cursor-not-allowed"
            >
              Reset
            </motion.button>
            <motion.button
              layout
              onClick={handleWhosNextClick}
              disabled={isWhosNextDisabled}
              className="rounded-lg border px-4 py-2 text-white transition enabled:bg-teal-500 enabled:hover:bg-teal-700 disabled:bg-gray-400 disabled:hover:cursor-not-allowed"
            >
              Who&apos;s next?
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.main>
  );
};

export default Session;
