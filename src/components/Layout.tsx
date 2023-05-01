import { PropsWithChildren } from "react";
import { LayoutGroup, motion } from "framer-motion";

const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="min-h-screen">
      <nav className="flex flex-row items-center justify-between px-12 py-6 text-xl">
        <div>
          <div>[Logo] Is it my turn?</div>
        </div>
        <div className="flex flex-row gap-6">
          <button className="rounded-lg bg-gray-300 px-4 py-2 hover:bg-gray-400">
            Open
          </button>
          <button className="rounded-lg bg-teal-500 px-4 py-2 text-white hover:bg-teal-700">
            Create a session
          </button>
        </div>
      </nav>
      <LayoutGroup>
        {children}
        <motion.div layout>
          <footer className="flex flex-row justify-evenly px-8 pt-64">
            <span>© 2023 Kevin Q. Dam</span>
          </footer>
        </motion.div>
      </LayoutGroup>
    </div>
  );
};

export default Layout;
