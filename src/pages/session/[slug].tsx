import { NextPage } from "next";
import { api } from "~/utils/api";
import { shuffleArray } from "~/utils/shuffle-array";
import { AnimatePresence, Reorder, motion } from "framer-motion";
import {
  BaseSyntheticEvent,
  ChangeEventHandler,
  useEffect,
  useState,
} from "react";
import { Item } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import LoadingList from "../../components/LoadingList";
import QueueListItem from "~/components/QueueListItem";
import { useRouter } from "next/router";
import cn from "classnames";

/**
 * Comparator to sort an array of {@link Item}s in ascending order
 */
const byAscendingOrder = (a: Item, b: Item) => a.order - b.order;

/**
 * The ID of the `input` element that accepts input to add another Item
 * to the queue
 */
const NEW_QUEUE_ITEM_INPUT_NAME = "newQueueItem";

/**
 * Maximum length of a session item name
 */
export const MAX_ITEM_NAME_LENGTH = 500;

const ONE_MINUTE_IN_MS = 60 * 1_000;

const Session: NextPage = () => {
  const router = useRouter();

  const sessionItemsQuery = api.router.getAllSessionItems.useQuery(
    { sessionSlug: router.query.slug as string },
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: ONE_MINUTE_IN_MS,
      enabled: Boolean(router.query.slug),
    }
  );
  const createSessionItemMutation = api.router.createSessionItem.useMutation();
  const deleteSessionItemMutation = api.router.deleteSessionItem.useMutation();

  const [queueItems, setQueueItems] = useState<Item[]>([]);
  const [nextItem, setNextItem] = useState<Item>();
  const [wentAlreadyItems, setWentAlreadyItems] = useState<Item[]>([]);
  const [shouldShowAddToQueueError, setShouldShowAddToQueueError] =
    useState(false);

  /**
   * Set the data in the client after the query resolves successfully
   */
  useEffect(() => {
    if (sessionItemsQuery.isLoading || sessionItemsQuery.isError) return;
    const sessionItemsCopy = [...sessionItemsQuery.data];
    sessionItemsCopy.sort(byAscendingOrder);
    setQueueItems(sessionItemsCopy.filter((item) => item.list === "QUEUE"));
    setNextItem(sessionItemsCopy.find((item) => item.list === "NEXT"));
    setWentAlreadyItems(
      sessionItemsCopy.filter((item) => item.list === "WENT")
    );
  }, [
    sessionItemsQuery.isLoading,
    sessionItemsQuery.isError,
    sessionItemsQuery.data,
  ]);

  const isWhosNextDisabled =
    sessionItemsQuery.isLoading || queueItems.length === 0;

  const handleWhosNextClick = () => {
    const [newNext] = queueItems;
    const newQueueItems = queueItems.slice(1);
    const newWentAlready = nextItem
      ? [...wentAlreadyItems, nextItem]
      : [...wentAlreadyItems];
    setQueueItems(newQueueItems);
    setNextItem(undefined);
    setNextItem(newNext);
    setWentAlreadyItems(newWentAlready);
  };

  const handleShuffleClick = () => {
    const newQueueItems = [...queueItems];
    shuffleArray(newQueueItems);
    setQueueItems(newQueueItems);
  };

  const handleResetClick = () => {
    const newQueueItems = [
      ...queueItems,
      ...wentAlreadyItems,
      ...(nextItem ? [nextItem] : []),
    ];
    setQueueItems(newQueueItems);
    setNextItem(undefined);
    setWentAlreadyItems([]);
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
    setQueueItems(newQueueItems);
  };

  const handleDeleteQueueItem = (itemToDelete: Item) => {
    setQueueItems(queueItems.filter((item) => item.id !== itemToDelete.id));
    deleteSessionItemMutation.mutate({
      sessionSlug: router.query.slug as string,
      itemIdToDelete: itemToDelete.id,
    });
  };

  return (
    <motion.main layout className="h-full overflow-hidden">
      <motion.div
        layout
        className="flex h-full flex-col justify-between gap-6 overflow-hidden p-4 pt-12"
      >
        <motion.div className="flex flex-row justify-evenly gap-2">
          <motion.h1 layout className="w-full text-center">
            In the queue
          </motion.h1>
          <motion.h1 layout className="w-full text-center">
            Up next
          </motion.h1>
          <motion.h1 layout className="w-full text-center">
            Went already
          </motion.h1>
        </motion.div>
        <motion.div
          layout
          className="flex h-full flex-row justify-evenly gap-10 overflow-hidden p-4 pt-0"
        >
          <motion.div
            layout
            className="flex h-full w-full flex-col overflow-hidden rounded-lg border"
          >
            <motion.div className="flex h-full flex-col overflow-auto">
              {(sessionItemsQuery.isLoading && (
                <LoadingList itemCount={7} />
              )) || (
                <motion.div layout className="w-full p-4">
                  <Reorder.Group
                    axis="y"
                    values={queueItems}
                    onReorder={setQueueItems}
                    className="flex h-full w-full flex-col gap-4"
                  >
                    {queueItems.map((queueItem) => (
                      <QueueListItem
                        key={queueItem.id}
                        item={queueItem}
                        handleUpdateItem={handleUpdateItem}
                        handleDeleteQueueItem={handleDeleteQueueItem}
                      />
                    ))}
                  </Reorder.Group>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
          <motion.div layout className="flex w-full flex-col rounded-lg border">
            {(sessionItemsQuery.isLoading && <LoadingList itemCount={2} />) || (
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
          <motion.div
            layout
            className="flex h-full w-full flex-col overflow-auto rounded-lg border"
          >
            {(sessionItemsQuery.isLoading && <LoadingList itemCount={7} />) || (
              <AnimatePresence>
                {wentAlreadyItems.length > 0 ? (
                  <motion.div layout className="flex w-full flex-col gap-4 p-4">
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
        <motion.div className="flex flex-row items-center">
          <motion.div className="w-1/3 pl-4 pr-6">
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
                  "mr-2 w-full outline-none",
                  shouldShowAddToQueueError && "bg-red-100 text-red-700"
                )}
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
                      : "stroke-slate-600"
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
        <motion.div layout className="flex flex-row justify-evenly">
          <motion.div layout className="flex flex-row gap-6">
            <motion.button
              layout
              onClick={handleShuffleClick}
              className="rounded-lg border border-teal-500 px-4 py-2 text-teal-500 transition enabled:hover:bg-teal-100 disabled:bg-gray-500 disabled:hover:cursor-not-allowed"
            >
              Shuffle queue
            </motion.button>
            <motion.button
              layout
              onClick={handleResetClick}
              className="rounded-lg border border-pink-500 px-4 py-2 text-pink-500 transition enabled:hover:bg-pink-100 disabled:bg-gray-500 disabled:hover:cursor-not-allowed"
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
