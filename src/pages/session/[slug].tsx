import { NextPage } from "next";
import { api } from "~/utils/api";
import { Reorder } from "framer-motion";
import { useState } from "react";

const Session: NextPage = () => {
  const sessionUsers = api.example.sessionUsers.useQuery({ slug: "123" });
  const [items, setItems] = useState(["foo", "bar", "baz"]);

  return (
    <main className="flex flex-row justify-evenly gap-2">
      <div className="flex w-full flex-col">
        <h1 className="text-center">In the queue</h1>
        <div className="h-64 w-full bg-red-200 p-2">
          <Reorder.Group values={items} onReorder={setItems}>
            {items.map((item) => (
              <Reorder.Item key={item} value={item}>
                {item}
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
      </div>
      <div className="w-1 bg-slate-300"></div>
      <div className="flex w-full flex-col">
        <h1 className="text-center">Up next</h1>
        <div className="h-64 w-full bg-green-200"></div>
      </div>
      <div className="w-1 bg-slate-300"></div>
      <div className="flex w-full flex-col">
        <h1 className="text-center">Went already</h1>
        <div className="h-64 w-full bg-blue-200"></div>
      </div>
    </main>
  );
};

export default Session;
