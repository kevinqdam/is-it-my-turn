import { NextPage } from "next";
import { api } from "~/utils/api";
import { Reorder } from "framer-motion";
import { useEffect, useState } from "react";
import { Item } from "@prisma/client";

/**
 * Comparator to sort an array of {@link Item}s by ascending order
 */
const byAscendingOrder = (a: Item, b: Item) => a.order - b.order;

const LoadingItem: React.FC = () => (
  <div className="h-3 animate-pulse rounded bg-slate-300" />
);

const LoadingList: React.FC<{ itemCount: number }> = ({ itemCount }) => {
  return (
    <div className="flex h-full w-full flex-col justify-center gap-4 p-4">
      {Array.from({ length: itemCount }, () => (
        <LoadingItem />
      ))}
    </div>
  );
};

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

  /**
   * Set the data in the client after the query resolves successfully
   */
  useEffect(() => {
    if (sessionItems.isLoading || sessionItems.isError) return;
    const sessionItemsCopy = [...sessionItems.data];
    sessionItemsCopy.sort((a, b) => a.order - b.order);
    setQueueItems(sessionItemsCopy.filter((item) => item.list === "QUEUE"));
    const maybeNextItem = sessionItemsCopy.find((item) => item.list === "NEXT");
    if (maybeNextItem) {
      setNextItem(maybeNextItem);
    }
    setWentAlreadyItems(
      sessionItemsCopy.filter((item) => item.list === "WENT")
    );
  }, [sessionItems.isLoading, sessionItems.isError, sessionItems.data]);

  return (
    <main className="flex flex-col gap-6">
      <div className="flex flex-row justify-evenly gap-2">
        <h1 className="w-full text-center">In the queue</h1>
        <h1 className="w-full text-center">Up next</h1>
        <h1 className="w-full text-center">Went already</h1>
      </div>
      <div className="flex flex-row justify-evenly gap-2">
        <div className="flex w-full flex-col">
          {(sessionItems.isLoading && <LoadingList itemCount={10} />) || (
            <div className="h-64 w-full bg-red-200 p-2">
              <Reorder.Group
                values={queueItems}
                onReorder={setQueueItems}
                className="flex h-full w-full flex-col justify-center"
              >
                {queueItems.map((queueItem) => (
                  <Reorder.Item key={queueItem.id} value={queueItem.name}>
                    {queueItem.name}
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>
          )}
        </div>
        <div className="w-1 bg-slate-300"></div>
        {(sessionItems.isLoading && <LoadingList itemCount={1} />) || (
          <div className="flex h-64 w-full flex-col justify-center bg-green-200">
            {nextItem && (
              <span className="animate-fade-in text-center transition-all">
                {nextItem.name}
              </span>
            )}
          </div>
        )}
        <div className="w-1 bg-slate-300"></div>
        {(sessionItems.isLoading && <LoadingList itemCount={10} />) || (
          <div className="flex h-64 w-full flex-col justify-center bg-blue-200 p-2">
            {wentAlreadyItems.map((wentAlreadyItem) => (
              <span>{wentAlreadyItem.name}</span>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-row justify-evenly">
        <button
          onClick={handleWhosNextClick}
          disabled={isWhosNextDisabled}
          className="rounded-lg border px-4 py-2 text-white transition enabled:bg-teal-500 enabled:hover:bg-teal-700 disabled:bg-gray-500 disabled:hover:cursor-not-allowed"
        >
          Who's next?
        </button>
      </div>
    </main>
  );
};

export default Session;
