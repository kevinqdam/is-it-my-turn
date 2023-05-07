import { NextPage } from "next";
import { api } from "~/utils/api";
import { shuffleArray } from "~/utils/shuffle-array";
import { AnimatePresence, Reorder, motion } from "framer-motion";
import { BaseSyntheticEvent, useEffect, useState } from "react";
import { Item } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import LoadingList from "../../components/LoadingList";
import QueueListItem from "~/components/QueueListItem";
import { useRouter } from "next/router";

/**
 * Comparator to sort an array of {@link Item}s in ascending order
 */
const byAscendingOrder = (a: Item, b: Item) => a.order - b.order;

/**
 * The ID of the `input` element that accepts input to add another Item
 * to the queue
 */
const NEW_QUEUE_ITEM_INPUT_NAME = "newQueueItem";

const ONE_MINUTE_IN_MS = 60 * 1_000;

const Session: NextPage = () => {
  const sessionItems = api.router.sessionItems.useQuery(
    { slug: "123" },
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: ONE_MINUTE_IN_MS,
    }
  );
  const router = useRouter();

  const [queueItems, setQueueItems] = useState<Item[]>([]);
  const [nextItem, setNextItem] = useState<Item>();
  const [wentAlreadyItems, setWentAlreadyItems] = useState<Item[]>([]);

  /**
   * Set the data in the client after the query resolves successfully
   */
  useEffect(() => {
    if (sessionItems.isLoading || sessionItems.isError) return;
    const sessionItemsCopy = [...sessionItems.data];
    sessionItemsCopy.sort(byAscendingOrder);
    setQueueItems(sessionItemsCopy.filter((item) => item.list === "QUEUE"));
    setNextItem(sessionItemsCopy.find((item) => item.list === "NEXT"));
    setWentAlreadyItems(
      sessionItemsCopy.filter((item) => item.list === "WENT")
    );
  }, [sessionItems.isLoading, sessionItems.isError, sessionItems.data]);

  const isWhosNextDisabled = sessionItems.isLoading || queueItems.length === 0;

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

  const handleAddToQueue = (event: BaseSyntheticEvent<SubmitEvent>) => {
    event.preventDefault();
    if (!event || !event.target) {
      return;
    }
    const formElement = new FormData(event.target);
    const formData = Object.fromEntries(formElement.entries()) as {
      [NEW_QUEUE_ITEM_INPUT_NAME]: string;
    };
    if (!formData[NEW_QUEUE_ITEM_INPUT_NAME]) {
      return;
    }
    const queueItemToInsertOrder =
      queueItems.length + wentAlreadyItems.length + (nextItem ? 1 : 0);
    const queueItemToInsert: Item = {
      name: formData[NEW_QUEUE_ITEM_INPUT_NAME],
      id: uuidv4(),
      order: queueItemToInsertOrder,
      list: "QUEUE",
      updatedAt: new Date(),
      createdAt: new Date(),
      sessionSlug: router.query.slug as string,
    };
    const newQueueItems = [...queueItems, queueItemToInsert];
    setQueueItems(newQueueItems);

    // clear the input after successful submit
    event.target.reset();
  };

  const handleDeleteQueueItem = (itemToDelete: Item) => {
    setQueueItems(queueItems.filter((item) => item.id !== itemToDelete.id));
  };

  return (
    <motion.main layout className="h-full overflow-hidden">
      <motion.div layout className="flex h-full flex-col justify-between pt-12 gap-6 overflow-hidden">
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
        <motion.div layout className="flex flex-row h-full justify-evenly gap-2 overflow-hidden p-4">
          <motion.div layout className="flex flex-col h-full w-full overflow-hidden">
            <motion.div className="flex flex-col h-full overflow-auto border-b">
              {(sessionItems.isLoading && <LoadingList itemCount={7} />) || (
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
                        handleDeleteQueueItem={handleDeleteQueueItem}
                      />
                    ))}
                  </Reorder.Group>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
          <motion.div layout className="flex w-full flex-col border-b">
            {(sessionItems.isLoading && <LoadingList itemCount={2} />) || (
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
          <motion.div layout className="h-full flex w-full flex-col overflow-auto border-b">
            {(sessionItems.isLoading && <LoadingList itemCount={7} />) || (
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
        <motion.div className="flex flex-row justify-evenly gap-2">
          <motion.div className="w-full pl-4 pr-10">
            <motion.form
              layout
              onSubmit={handleAddToQueue}
              className="flex flex-row justify-between rounded-lg border bg-white p-4"
            >
              <motion.input
                layout
                name={NEW_QUEUE_ITEM_INPUT_NAME}
                placeholder="Add to queue"
                className="mr-2 w-full outline-none"
              />
              <motion.button layout>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  className="h-6 w-6 stroke-slate-600"
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
          <motion.div className="w-full" />
          <motion.div className="w-full" />
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
              className="rounded-lg border px-4 py-2 text-white transition enabled:bg-teal-500 enabled:hover:bg-teal-700 disabled:bg-gray-500 disabled:hover:cursor-not-allowed"
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
