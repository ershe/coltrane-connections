import { useMemo } from "react";
import type {
  MusicianGraphData,
  MusicianLink,
  MusicianNode,
  MusicianRole,
  RawNetworkData,
} from "../types/network";

function mapInstrumentToRole(instrument: string): MusicianRole {
  const lower = instrument.toLowerCase();
  if (lower.includes("sax")) return "Saxophone";
  if (lower.includes("trumpet") || lower.includes("cornet") || lower.includes("flugelhorn")) {
    return "Trumpet";
  }
  if (lower.includes("piano") || lower.includes("organ") || lower.includes("key")) {
    return "Piano";
  }
  if (lower.includes("bass")) return "Bass";
  if (lower.includes("drum") || lower.includes("percussion")) return "Drums";
  if (lower.includes("trombone")) return "Trombone";
  return "Other";
}

export function transformNetworkJsonToGraph(
  raw: RawNetworkData | null,
): MusicianGraphData {
  if (!raw) {
    return { nodes: [], links: [] };
  }

  const nodeMap = new Map<string, MusicianNode>();
  for (const m of raw.musicians) {
    const id = String(m.id);
    nodeMap.set(id, {
      id,
      name: m.name,
      role: mapInstrumentToRole(m.primary_instrument || ""),
      instruments: m.primary_instrument ? [m.primary_instrument] : [],
      sessionCount: 0,
      albums: [],
      isColtrane: m.name.toLowerCase() === "john coltrane",
    });
  }

  const sessionsMap = new Map<number, string[]>();
  for (const rel of raw.relationships) {
    const musicianId = String(rel.musician_id);
    const node = nodeMap.get(musicianId);
    if (!node) continue;

    node.sessionCount += 1;
    if (rel.instrument && !node.instruments.includes(rel.instrument)) {
      node.instruments.push(rel.instrument);
    }

    const list = sessionsMap.get(rel.session_id);
    if (list) {
      if (!list.includes(musicianId)) {
        list.push(musicianId);
      }
    } else {
      sessionsMap.set(rel.session_id, [musicianId]);
    }
  }

  const linkMap = new Map<string, MusicianLink>();
  for (const musicianIds of sessionsMap.values()) {
    for (let i = 0; i < musicianIds.length; i++) {
      for (let j = i + 1; j < musicianIds.length; j++) {
        const a = musicianIds[i];
        const b = musicianIds[j];
        const [source, target] = a < b ? [a, b] : [b, a];
        const key = `${source}::${target}`;

        const existing = linkMap.get(key);
        if (existing) {
          existing.weight += 1;
        } else {
          linkMap.set(key, {
            source,
            target,
            weight: 1,
          });
        }
      }
    }
  }

  const connectedNodes = Array.from(nodeMap.values()).filter(
    (n) => n.sessionCount > 0,
  );

  return {
    nodes: connectedNodes,
    links: Array.from(linkMap.values()),
  };
}

export function useMusicianNetworkData(
  raw: RawNetworkData | null,
): MusicianGraphData {
  return useMemo(() => transformNetworkJsonToGraph(raw), [raw]);
}
