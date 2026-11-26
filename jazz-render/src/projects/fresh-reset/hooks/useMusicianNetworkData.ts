import { useMemo } from "react";
import type {
  MusicianGraphData,
  MusicianLink,
  MusicianNode,
  SessionRecord,
} from "../types/network";

export function transformSessionsToGraph(
  sessions: SessionRecord[],
): MusicianGraphData {
  const nodeMap = new Map<string, MusicianNode>();
  const linkMap = new Map<string, MusicianLink>();

  for (const session of sessions) {
    const credits = session.musicians;

    for (const credit of credits) {
      const existing = nodeMap.get(credit.id);
      if (existing) {
        existing.sessionCount += 1;
        if (!existing.albums.includes(session.album)) {
          existing.albums.push(session.album);
        }
        if (!existing.instruments.includes(credit.instrument)) {
          existing.instruments.push(credit.instrument);
        }
      } else {
        nodeMap.set(credit.id, {
          id: credit.id,
          name: credit.name,
          role: credit.role,
          instruments: [credit.instrument],
          sessionCount: 1,
          albums: [session.album],
          isColtrane: credit.id === "coltrane",
        });
      }
    }

    for (let i = 0; i < credits.length; i++) {
      for (let j = i + 1; j < credits.length; j++) {
        const a = credits[i].id;
        const b = credits[j].id;
        const [source, target] = a < b ? [a, b] : [b, a];
        const key = `${source}::${target}`;

        const existingLink = linkMap.get(key);
        if (existingLink) {
          existingLink.weight += 1;
          if (!existingLink.albums.includes(session.album)) {
            existingLink.albums.push(session.album);
          }
          if (!existingLink.years.includes(session.year)) {
            existingLink.years.push(session.year);
          }
        } else {
          linkMap.set(key, {
            source,
            target,
            weight: 1,
            albums: [session.album],
            years: [session.year],
          });
        }
      }
    }
  }

  return {
    nodes: Array.from(nodeMap.values()),
    links: Array.from(linkMap.values()),
  };
}

export function useMusicianNetworkData(
  sessions: SessionRecord[],
): MusicianGraphData {
  return useMemo(() => transformSessionsToGraph(sessions), [sessions]);
}
