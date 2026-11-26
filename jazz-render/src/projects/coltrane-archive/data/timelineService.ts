import type { TimelineYear } from "@/types";

export const FALLBACK_TIMELINE_DATA: TimelineYear[] = [
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
        albums: [{ id: 101, title: "Blue Train", instrument: "Trumpet" }],
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
];

export async function fetchArchivedTimelineData(): Promise<TimelineYear[]> {
  const response = await fetch("/api/timeline");

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}
