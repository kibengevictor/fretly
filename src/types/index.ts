export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';
export type Handedness = 'right' | 'left';
export type GuitarType = 'acoustic' | 'electric' | 'classical';
export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export interface ChordVoicing {
  frets: number[]; // per string from low E to high e, -1 for muted/open? define
  fingers: number[]; // 0-4 or -1
  barre?: { fromFret: number; startString: number; endString: number };
}

export interface Chord {
  id: string;
  name: string;
  root: NoteName;
  quality: string;
  voicings: ChordVoicing[];
  audioFile?: string;
}

export interface Lesson {
  id: string;
  level: SkillLevel;
  order: number;
  title: string;
  content: string;
  summary: string;
  steps: string[];
  practiceTip: string;
  drill?: {
    title: string;
    description: string;
    tempo: number;
    chordIds: string[];
  };
  prerequisites?: string[];
  chordIds: string[];
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  key: string;
  tempo: number;
  difficulty: SkillLevel;
  genre: string;
  chart: string; // simplified
  licenseInfo: string;
  chordIds: string[];
  downloadable: boolean;
  sections?: SongSection[];
}

export interface SongSection {
  title: string;
  lines: SongLine[];
}

export interface SongLine {
  chords: string;
  lyrics: string;
}

export interface Tuning {
  id: string;
  name: string;
  stringNotes: NoteName[]; // from low to high
  builtIn: boolean;
}
