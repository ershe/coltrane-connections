import { Outlet, Link } from "react-router";
import { ModeToggle } from "@/components/ui/mode-toggle";

export default function RootLayout() {
  return (
    <div className="p-4 dark:bg-gray-800 dark:text-white min-h-screen w-full grow flex flex-col gap-8">
      <header className="flex w-full justify-between items-center mb-8 shadow-md p-4 rounded-lg bg-gray-200 dark:bg-gray-900 sticky top-0 z-50">
        <nav className="flex gap-24 text-2xl justify-start items-center w-full">
          <Link to="/timeline" className="text-nowrap">
            Coltrane Sessions Timeline
          </Link>
          <div className="grow w-full"></div>
          <Link to="/about">About</Link>
          <ModeToggle />
        </nav>
      </header>
      <main className="grow">
        <Outlet />
      </main>
      <footer className="mt-8">
        <p>&copy; 2027 Jazz Render. All rights reserved.</p>
      </footer>
    </div>
  );
}
