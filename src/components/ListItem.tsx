import { Item } from "@prisma/client";
import { Reorder, useMotionValue } from "framer-motion";
import useRaisedShadow from "~/hooks/use-raised-shadow";

type ListItemProps = {
  item: Item;
};

const ListItem: React.FC<ListItemProps> = ({ item }) => {
  const y = useMotionValue(0);
  const boxShadow = useRaisedShadow(y);

  return (
    <Reorder.Item value={item} id={item.id}>
      <span className="flex flex-row gap-4 rounded-lg border p-4 bg-white hover:cursor-grab">
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
      </span>
    </Reorder.Item>
  );
};

export default ListItem;
