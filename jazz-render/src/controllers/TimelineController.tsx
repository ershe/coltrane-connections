import { useEffect, useState } from "react";
import TimelineView from "@/pages/TimelineView";
import type { TimelineYear } from "@/types";

export default function TimelineController() {
  const [timelineData, setTimelineData] = useState<TimelineYear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTimelineData() {
      try {
        setIsLoading(true);
        // Coltrane timeline API endpoint
        const response = await fetch("/api/timeline");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: TimelineYear[] = await response.json();
        setTimelineData(data);
      } catch (err) {
        console.error("Failed to load timeline data:", err);
        setError(
          "Could not load the discography timeline. Please try again later.",
        );

        // --- FALLBACK MOCK DATA FOR UI TESTING ---
        // If your backend isn't running, it will gracefully fall back to this mock data
        setTimelineData([
          {
            year: 1957,
            musicians: [
              {
                id: 1,
                name: "John Coltrane",
                albums: [
                  {
                    id: 101,
                    title: "Blue Train",
                    instrument: "Tenor Saxophone",
                  },
                ],
              },
              {
                id: 2,
                name: "Lee Morgan",
                albums: [
                  { id: 101, title: "Blue Train", instrument: "Trumpet" },
                ],
              },
            ],
          },
          {
            year: 1959,
            musicians: [
              {
                id: 1,
                name: "John Coltrane",
                albums: [
                  {
                    id: 102,
                    title: "Giant Steps",
                    instrument: "Tenor Saxophone",
                  },
                  {
                    id: 103,
                    title: "Kind of Blue (Miles Davis)",
                    instrument: "Tenor Saxophone",
                  },
                ],
              },
            ],
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTimelineData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground font-medium">
            Syncing sessions from database...
          </p>
        </div>
      </div>
    );
  }

  if (error && timelineData.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-2 sm:p-4 md:p-8 lg:p-12">
      {/* Page Header */}
      <header className="max-w-4xl mx-auto mb-6 sm:mb-10 border-b pb-4 sm:pb-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
          Coltrane Discography
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
          An interactive timeline of recording sessions (1949–1967)
        </p>
      </header>

      {/* The Timeline Component we built earlier */}
      <TimelineView timelineData={timelineData} />
    </main>
  );
}
