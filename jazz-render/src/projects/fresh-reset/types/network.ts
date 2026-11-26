export type MusicianRole =
  | "Saxophone"
  | "Trumpet"
  | "Piano"
  | "Bass"
  | "Drums"
  | "Trombone"
  | "Other";

export interface SessionMusicianCredit {
  id: string;
  name: string;
  role: MusicianRole;
  instrument: string;
}

export interface SessionRecord {
  id: string;
  album: string;
  year: number;
  musicians: SessionMusicianCredit[];
}

export interface MusicianNode {
  id: string;
  name: string;
  role: MusicianRole;
  instruments: string[];
  sessionCount: number;
  albums: string[];
  isColtrane: boolean;
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
}

export interface MusicianLink {
  source: string | MusicianNode;
  target: string | MusicianNode;
  weight: number;
  albums: string[];
  years: number[];
}

export interface MusicianGraphData {
  nodes: MusicianNode[];
  links: MusicianLink[];
}
