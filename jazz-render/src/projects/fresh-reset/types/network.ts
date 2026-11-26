export type MusicianRole =
  | "Saxophone"
  | "Trumpet"
  | "Piano"
  | "Bass"
  | "Drums"
  | "Trombone"
  | "Other";

export interface RawNetworkMusician {
  id: number;
  name: string;
  primary_instrument: string;
}

export interface RawNetworkRelationship {
  session_id: number;
  musician_id: number;
  instrument: string;
  role: string;
  session_date: string | null;
}

export interface RawNetworkData {
  musicians: RawNetworkMusician[];
  relationships: RawNetworkRelationship[];
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
}

export interface MusicianGraphData {
  nodes: MusicianNode[];
  links: MusicianLink[];
}
