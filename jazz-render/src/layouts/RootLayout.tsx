import { Outlet, Link } from "react-router";
import { ModeToggle } from "@/components/ui/mode-toggle";

export default function RootLayout() {
  return (
    <div className="p-3 sm:p-4 md:p-6 dark:bg-gray-800 dark:text-white min-h-screen w-full grow flex flex-col gap-6 sm:gap-8">
      <header className="flex w-full justify-between items-center mb-4 sm:mb-8 shadow-md p-3 sm:p-4 rounded-lg bg-gray-200 dark:bg-gray-900 sticky top-0 z-50">
        <nav className="flex gap-4 sm:gap-8 md:gap-16 lg:gap-24 text-base sm:text-xl md:text-2xl justify-between items-center w-full">
          <Link to="/timeline" className="truncate font-semibold tracking-tight">
            Coltrane Sessions
          </Link>
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            <Link to="/about" className="hover:text-primary transition-colors">
              About
            </Link>
            <ModeToggle />
          </div>
        </nav>
      </header>
      <main className="grow">
        <Outlet />
      </main>
      <footer className="mt-8 text-center sm:text-left text-xs sm:text-sm text-muted-foreground">
        <p>&copy; 2027 Jazz Render. All rights reserved.</p>
      </footer>
    </div>
  );
}
