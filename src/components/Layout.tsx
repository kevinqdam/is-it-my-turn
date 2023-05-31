import { PropsWithChildren } from "react";
import { LayoutGroup, motion } from "framer-motion";
import Logo from "./Logo";
import Link from "next/link";

const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex h-screen flex-col justify-between">
      <nav className="flex flex-row items-center justify-between px-12 py-6 text-xl">
        <Link href="/" className="w-full h-full">
          <Logo className="h-12" />
        </Link>
        <div>
          <Link href="/about">
            <span className="rounded-lg px-4 py-2 hover:bg-gray-200 transition">About</span>
          </Link>
        </div>
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
