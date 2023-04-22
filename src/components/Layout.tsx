import { PropsWithChildren } from "react";

const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      <nav className="flex flex-row justify-between px-12 py-6 text-xl">
        <div>
          <div>[Logo] Is it my turn?</div>
        </div>
        <div className="flex flex-row gap-2">
          <button className="rounded-lg bg-gray-300 px-4 py-2 hover:bg-gray-400">
            Open
          </button>
          <button className="rounded-lg bg-teal-500 px-4 py-2 text-white hover:bg-teal-700">
            Create a session
          </button>
        </div>
      </nav>
      {children}
      <footer className="flex flex-row justify-evenly px-8 py-4">
        <span>© 2023 Kevin Q. Dam</span>
      </footer>
    </>
  );
};

export default Layout;
