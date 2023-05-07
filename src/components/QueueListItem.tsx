import { Item } from "@prisma/client";
import { motion, Reorder, useMotionValue } from "framer-motion";
import { BaseSyntheticEvent, useState } from "react";
import useRaisedShadow from "~/hooks/use-raised-shadow";

type QueueListItemProps = {
  item: Item;
  handleUpdateItem: (itemId: string, itemNewName: string) => void;
  handleDeleteQueueItem: (itemToDelete: Item) => void;
};

const NEW_QUEUE_ITEM_NAME_INPUT_NAME = "newName";

const QueueListItem: React.FC<QueueListItemProps> = ({
  item,
  handleUpdateItem,
  handleDeleteQueueItem,
}) => {
  const y = useMotionValue(0);
  const boxShadow = useRaisedShadow(y);
  const [isEditing, setIsEditing] = useState(false);
  const handleStartEditingItem = () => {
    setIsEditing(true);
  };
  const handleCancelEditingItem = () => {
    setIsEditing(false);
  };
  const handleSubmitEditItem = (event: BaseSyntheticEvent<SubmitEvent>) => {
    event.preventDefault();
    const formElement = new FormData(event.target);
    const formData = Object.fromEntries(formElement.entries()) as {
      [NEW_QUEUE_ITEM_NAME_INPUT_NAME]: string;
    };
    if (!formData[NEW_QUEUE_ITEM_NAME_INPUT_NAME]) {
      return;
    }
    handleUpdateItem(item.id, formData[NEW_QUEUE_ITEM_NAME_INPUT_NAME]);
    setIsEditing(false);
  };

  return (
    <Reorder.Item
      style={{ y, boxShadow }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.2,
      }}
      className="rounded-lg"
      value={item}
      id={item.id}
    >
      {isEditing ? (
        <motion.div className="rounded-lg border p-4">
          <motion.form
            onBlur={handleCancelEditingItem}
            onSubmit={handleSubmitEditItem}
          >
            <motion.input
              name={NEW_QUEUE_ITEM_NAME_INPUT_NAME}
              autoFocus
              type="text"
              defaultValue={item.name}
              className="w-full outline-none"
            />
            <motion.button type="submit" className="hidden" />
          </motion.form>
        </motion.div>
      ) : (
        <motion.span
          layout
          className="group flex w-full flex-row items-center justify-between gap-4 break-words rounded-lg border bg-white p-4 hover:cursor-grab"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="h-6 w-6 flex-none stroke-slate-400 stroke-1"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
          <span className="min-w-0 grow">{item.name}</span>
          <div className="flex flex-row gap-2">
            <button onClick={handleStartEditingItem}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                className="h-4 w-4 stroke-transparent group-hover:stroke-slate-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                />
              </svg>
            </button>
            <button onClick={() => handleDeleteQueueItem(item)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                className="h-4 w-4 stroke-transparent group-hover:stroke-slate-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </motion.span>
      )}
    </Reorder.Item>
  );
};

export default QueueListItem;
