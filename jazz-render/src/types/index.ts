export interface Album {
  id: number;
  title: string;
  release_year: number;
  label: string;
  is_leader: number;
}

export interface Track {
  id: number;
  title: string;
  track_number: number;
}

export interface TimelineAlbum {
  id: number;
  title: string;
  instrument: string;
}

export interface TimelineMusician {
  id: number;
  name: string;
  albums: TimelineAlbum[];
}

export interface TimelineYear {
  year: number;
  musicians: TimelineMusician[];
}
