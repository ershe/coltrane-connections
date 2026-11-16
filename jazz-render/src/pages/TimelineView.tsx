import { useState, useEffect, useMemo, useDeferredValue, useRef } from "react";
import { Disc3, X, Calendar, Search } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import type { TimelineYear, TimelineMusician } from "@/types";

interface TimelinePageProps {
  timelineData: TimelineYear[];
}

interface IndexedMusician extends TimelineMusician {
  _lowerName: string;
}

interface IndexedYear {
  year: number;
  musicians: IndexedMusician[];
}

export default function TimelinePage({ timelineData }: TimelinePageProps) {
  const [selectedMusician, setSelectedMusician] =
    useState<TimelineMusician | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const isStale = searchQuery !== deferredSearchQuery;
  const searchBarRef = useRef<HTMLDivElement>(null);

  // When user types in search while scrolled far down, smoothly bring search bar and top results into view
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    setSearchQuery(nextVal);

    if (nextVal.trim() && searchBarRef.current) {
      const rect = searchBarRef.current.getBoundingClientRect();
      // If the user has scrolled past the search bar
      if (rect.top < 100) {
        searchBarRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  // Pre-normalize dataset once so we never run .toLowerCase() repeatedly on keystrokes
  const indexedData: IndexedYear[] = useMemo(() => {
    return (timelineData ?? []).map((yearData) => ({
      year: yearData.year,
      musicians: (yearData.musicians ?? []).map((m) => ({
        ...m,
        _lowerName: m.name.toLowerCase(),
      })),
    }));
  }, [timelineData]);

  // Extract all available years across the dataset
  const allYears = useMemo(() => {
    return indexedData.map((y) => y.year).sort((a, b) => a - b);
  }, [indexedData]);

  // Non-blocking deferred filter
  const filteredTimeline = useMemo(() => {
    const trimmed = deferredSearchQuery.trim().toLowerCase();
    if (!trimmed) return indexedData;

    return indexedData
      .map((yearData) => {
        const matchingMusicians = yearData.musicians.filter((m) =>
          m._lowerName.includes(trimmed),
        );
        return {
          year: yearData.year,
          musicians: matchingMusicians,
        };
      })
      .filter((yearData) => yearData.musicians.length > 0);
  }, [indexedData, deferredSearchQuery]);

  // Total matching musician count
  const matchingMusicianCount = useMemo(() => {
    return filteredTimeline.reduce((acc, y) => acc + y.musicians.length, 0);
  }, [filteredTimeline]);

  // Years that currently have visible results
  const visibleYears = useMemo(() => {
    return new Set(filteredTimeline.map((y) => y.year));
  }, [filteredTimeline]);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedMusician(null);
      }
    };

    if (selectedMusician) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedMusician]);

  // Smooth scroll handler for the floating year index
  const scrollToYear = (year: number) => {
    const element = document.getElementById(`year-section-${year}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto py-2 sm:py-6 px-1 sm:px-4">
      {/* Floating Years Active Navigation (Fixed Left Sidebar on Desktop) */}
      {allYears.length > 0 && (
        <aside
          aria-label="Active years navigation"
          className="hidden xl:flex flex-col fixed left-4 2xl:left-8 top-32 z-40 bg-card/90 backdrop-blur-md border border-border rounded-xl p-3 shadow-lg max-h-[75vh] overflow-y-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-2">
            Years
          </span>
          <div className="flex flex-col gap-1">
            {allYears.map((year) => {
              const isMatch = visibleYears.has(year);

              return (
                <button
                  key={year}
                  type="button"
                  onClick={() => scrollToYear(year)}
                  disabled={!isMatch}
                  className={`text-xs px-2.5 py-1 rounded-md text-left font-mono transition-all cursor-pointer ${
                    isMatch
                      ? "text-foreground hover:bg-muted hover:text-primary"
                      : "text-muted-foreground/30 cursor-not-allowed line-through"
                  }`}>
                  {year}
                </button>
              );
            })}
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 min-h-[75vh]">
        {/* Search Bar & Mobile Quick-Year Selector */}
        <div
          ref={searchBarRef}
          className="sticky top-16 sm:top-20 z-30 bg-background/95 backdrop-blur-md p-3 sm:p-4 rounded-xl border border-border shadow-sm scroll-mt-24 space-y-3">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by musician name..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-9 pr-8 h-9 sm:h-10 text-xs sm:text-sm rounded-lg"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 p-1 text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Horizontal scrollable years for mobile/tablet */}
          {allYears.length > 0 && (
            <div className="flex xl:hidden items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar text-xs">
              <span className="text-[10px] uppercase font-bold text-muted-foreground shrink-0 mr-1">
                Jump to:
              </span>
              {allYears.map((year) => {
                const isMatch = visibleYears.has(year);
                return (
                  <button
                    key={year}
                    type="button"
                    onClick={() => scrollToYear(year)}
                    disabled={!isMatch}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono shrink-0 transition-colors ${
                      isMatch
                        ? "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-primary active:text-primary-foreground"
                        : "text-muted-foreground/30 line-through cursor-not-allowed"
                    }`}>
                    {year}
                  </button>
                );
              })}
            </div>
          )}

          {searchQuery.trim() && (
            <p className="text-xs text-muted-foreground px-1 flex items-center gap-2">
              <span>
                Showing results for &ldquo;{searchQuery}&rdquo; ({matchingMusicianCount} musicians found)
              </span>
              {isStale && (
                <span className="inline-block w-2 h-2 rounded-full bg-primary/60 animate-ping" />
              )}
            </p>
          )}
        </div>

        {/* Vertical Timeline Container with Streamlined Animations */}
        <div
          className={`relative border-l-2 border-muted ml-2 sm:ml-4 space-y-8 sm:space-y-12 transition-opacity duration-150 min-h-[400px] ${
            isStale ? "opacity-70" : "opacity-100"
          }`}>
          <AnimatePresence>
            {filteredTimeline.length > 0 ? (
              filteredTimeline.map((yearData) => {
                const safeMusicians = yearData.musicians ?? [];

                return (
                  <motion.div
                    key={yearData.year}
                    id={`year-section-${yearData.year}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="relative pl-6 sm:pl-8 scroll-mt-36">
                    <div className="absolute -left-3.25 sm:-left-4.25 top-0 bg-background border-2 border-primary rounded-full p-0.5 sm:p-1">
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4 leading-none tracking-tight">
                      {yearData.year}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {safeMusicians.map((musician) => {
                        const albums = musician.albums ?? [];

                        return (
                          <div
                            key={musician.id}
                            className="flex flex-col p-3 sm:p-4 rounded-xl border bg-card shadow-sm hover:border-primary/50 hover:shadow-md transition-all group animate-in fade-in-50 duration-200">
                            <div className="flex items-center justify-between gap-3 sm:gap-4">
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() => setSelectedMusician(musician)}
                                  className="text-left font-semibold text-foreground group-hover:text-primary transition-colors cursor-pointer text-sm sm:text-base truncate block max-w-full">
                                  {musician.name}
                                </button>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {albums.length} Session
                                  {albums.length !== 1 ? "s" : ""}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => setSelectedMusician(musician)}
                                className="shrink-0 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors cursor-pointer">
                                View Details
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="pl-6 sm:pl-8 py-12 text-center">
                <p className="text-base sm:text-lg font-medium text-foreground">
                  No musicians found matching &ldquo;{searchQuery}&rdquo;
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Try checking the spelling or clearing your search query.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="mt-4 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer">
                  Clear Search
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Global Popup Dialog Modal */}
        <AnimatePresence>
          {selectedMusician && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2 }}
                className="relative w-full max-w-lg rounded-xl border bg-background p-4 sm:p-6 shadow-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between pb-3 sm:pb-4 border-b shrink-0">
                  <div className="pr-2">
                    <h3 className="text-lg sm:text-xl font-bold text-foreground truncate">
                      {selectedMusician.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Recorded Sessions & Discography
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedMusician(null)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer shrink-0">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="overflow-y-auto py-3 sm:py-4 space-y-2.5 sm:space-y-3 grow">
                  {(selectedMusician.albums ?? []).map((album) => (
                    <li
                      key={album.id}
                      className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-muted/30 border text-xs sm:text-sm list-none">
                      <Disc3 className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold leading-snug text-foreground break-words">
                          {album.title}
                        </p>
                        <p className="text-muted-foreground font-medium text-[11px] sm:text-xs mt-0.5">
                          {album.instrument}
                        </p>
                      </div>
                    </li>
                  ))}
                  {(selectedMusician.albums ?? []).length === 0 && (
                    <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">
                      No sessions recorded for this year.
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-3 sm:pt-4 border-t shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedMusician(null)}
                    className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer text-center">
                    Close Window
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
