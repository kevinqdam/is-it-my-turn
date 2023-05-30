import { PropsWithChildren } from "react";
import { LayoutGroup, motion } from "framer-motion";
import Logo from "./Logo";

const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex h-screen flex-col justify-between">
      <nav className="flex flex-row items-center justify-between px-12 py-6 text-xl">
        <Logo />
        <div />
      </nav>
      <LayoutGroup>
        {children}
        <motion.div layout>
          <footer className="flex flex-row justify-evenly py-12">
            <span>© 2023 Kevin Q. Dam</span>
          </footer>
        </motion.div>
      </LayoutGroup>
    </div>
  );
};

export default Layout;
