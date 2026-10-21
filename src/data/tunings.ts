import { Tuning, NoteName } from '../types';

export const builtInTunings: Tuning[] = [
  {
    id: 'standard',
    name: 'Standard',
    stringNotes: ['E', 'A', 'D', 'G', 'B', 'E'],
    builtIn: true,
  },
  {
    id: 'dropd',
    name: 'Drop D',
    stringNotes: ['D', 'A', 'D', 'G', 'B', 'E'],
    builtIn: true,
  },
  {
    id: 'halfstepdown',
    name: 'Half-step Down',
    stringNotes: ['D#', 'G#', 'C#', 'F#', 'A#', 'D#'],
    builtIn: true,
  },
  {
    id: 'dadgad',
    name: 'DADGAD',
    stringNotes: ['D', 'A', 'D', 'G', 'A', 'D'],
    builtIn: true,
  },
  {
    id: 'openg',
    name: 'Open G',
    stringNotes: ['D', 'G', 'D', 'G', 'B', 'D'],
    builtIn: true,
  },
];
