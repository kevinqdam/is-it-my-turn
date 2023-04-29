import { NextPage } from "next";
import { api } from "~/utils/api";
import { shuffleArray } from "~/utils/shuffle-array";
import { Reorder } from "framer-motion";
import { useEffect, useState } from "react";
import { Item } from "@prisma/client";
import LoadingList from "../../components/LoadingList";
import ListItem from "~/components/ListItem";

/**
 * Comparator to sort an array of {@link Item}s in ascending order
 */
const byAscendingOrder = (a: Item, b: Item) => a.order - b.order;

const Session: NextPage = () => {
  const sessionItems = api.router.sessionItems.useQuery({ slug: "123" });

  const [queueItems, setQueueItems] = useState<Item[]>([]);
  const [nextItem, setNextItem] = useState<Item>();
  const [wentAlreadyItems, setWentAlreadyItems] = useState<Item[]>([]);

  const isWhosNextDisabled = sessionItems.isLoading || queueItems.length === 0;
  const handleWhosNextClick = () => {
    const [newNext] = queueItems;
    const newQueueItems = queueItems.slice(1);
    const newWentAlready = nextItem
      ? [...wentAlreadyItems, nextItem]
      : [...wentAlreadyItems];
    setQueueItems(newQueueItems);
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

  return (
    <main className="h-5/6 pt-12">
      <div className="flex h-full flex-col justify-evenly">
        <div className="flex flex-row justify-evenly gap-2">
          <div className="flex w-full flex-col">
            <h1 className="w-full text-center">In the queue</h1>
            <div className="flex w-full flex-col">
              {(sessionItems.isLoading && <LoadingList itemCount={10} />) || (
                <div className="w-full p-4">
                  <Reorder.Group
                    axis="y"
                    values={queueItems}
                    onReorder={setQueueItems}
                    className="flex h-full w-full flex-col gap-4"
                  >
                    {queueItems.map((queueItem) => (
                      <ListItem key={queueItem.id} item={queueItem} />
                    ))}
                  </Reorder.Group>
                </div>
              )}
            </div>
          </div>
          <div className="flex w-full flex-col">
            <h1 className="w-full text-center">Up next</h1>
            {(sessionItems.isLoading && <LoadingList itemCount={1} />) || (
              <div className="flex w-full flex-col p-4">
                {nextItem && (
                  <span className="flex flex-row gap-4 rounded-lg border bg-green-100 p-4">
                    {nextItem.name}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex w-full flex-col">
            <h1 className="w-full text-center">Went already</h1>
            {(sessionItems.isLoading && <LoadingList itemCount={10} />) ||
              (wentAlreadyItems.length > 0 ? (
                <div className="flex w-full flex-col gap-4 p-4">
                  {wentAlreadyItems.map((wentAlreadyItem) => (
                    <span
                      className="flex flex-row gap-4 rounded-lg border bg-slate-200 p-4"
                      key={wentAlreadyItem.id}
                    >
                      {wentAlreadyItem.name}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="flex w-full" />
              ))}
          </div>
        </div>
        <div className="flex flex-row justify-evenly">
          <div className="flex flex-row gap-6">
            <button
              onClick={handleShuffleClick}
              className="rounded-lg border border-teal-500 px-4 py-2 text-teal-500 transition enabled:hover:bg-gray-100 disabled:bg-gray-500 disabled:hover:cursor-not-allowed"
            >
              Shuffle queue
            </button>
            <button
              onClick={handleResetClick}
              className="rounded-lg border border-teal-500 px-4 py-2 text-teal-500 transition enabled:hover:bg-gray-100 disabled:bg-gray-500 disabled:hover:cursor-not-allowed"
            >
              Reset
            </button>
            <button
              onClick={handleWhosNextClick}
              disabled={isWhosNextDisabled}
              className="rounded-lg border px-4 py-2 text-white transition enabled:bg-teal-500 enabled:hover:bg-teal-700 disabled:bg-gray-500 disabled:hover:cursor-not-allowed"
            >
              Who&apos;s next?
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Session;
