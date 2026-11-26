import { useEffect, useState } from "react";
import TimelineView from "@/pages/TimelineView";
import type { TimelineYear } from "@/types";
import {
  FALLBACK_TIMELINE_DATA,
  fetchArchivedTimelineData,
} from "@/projects/coltrane-archive/data/timelineService";

export default function TimelineController() {
  const [timelineData, setTimelineData] = useState<TimelineYear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTimelineData() {
      try {
        setIsLoading(true);
        const data = await fetchArchivedTimelineData();
        setTimelineData(data);
      } catch (err) {
        console.error("Failed to load timeline data:", err);
        setError(
          "Could not load the discography timeline. Please try again later.",
        );

        // --- FALLBACK MOCK DATA FOR UI TESTING ---
        // If your backend isn't running, it will gracefully fall back to this mock data
        setTimelineData(FALLBACK_TIMELINE_DATA);
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
