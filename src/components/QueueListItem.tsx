import { Item } from "@prisma/client";
import { motion, Reorder, useMotionValue } from "framer-motion";
import useRaisedShadow from "~/hooks/use-raised-shadow";

type QueueListItemProps = {
  item: Item;
  handleDeleteQueueItem: (itemToDelete: Item) => void;
};

const QueueListItem: React.FC<QueueListItemProps> = ({
  item,
  handleDeleteQueueItem,
}) => {
  const y = useMotionValue(0);
  const boxShadow = useRaisedShadow(y);

  return (
    <Reorder.Item
      style={{ y, boxShadow }}
      className="rounded-lg"
      value={item}
      id={item.id}
    >
      <motion.span
        layout
        className="flex flex-row items-center justify-between gap-4 rounded-lg border bg-white p-4 hover:cursor-grab"
      >
        <div className="flex flex-row gap-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="h-6 w-6 stroke-slate-400 stroke-1"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
          {item.name}
        </div>
        <button
          onClick={() => handleDeleteQueueItem(item)}
          className="-mr-1 flex h-8 w-8 flex-row items-center justify-center hover:cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </motion.span>
    </Reorder.Item>
  );
};

export default QueueListItem;
