import { Chord, NoteName } from '../types';

export const commonChords: Chord[] = [
  {
    id: 'am',
    name: 'Am',
    root: 'A',
    quality: 'minor',
    voicings: [
      {
        frets: [0, 1, 2, 2, 0, -1],
        fingers: [0, 1, 2, 3, 0, -1],
      },
    ],
  },
  {
    id: 'em',
    name: 'Em',
    root: 'E',
    quality: 'minor',
    voicings: [
      {
        frets: [0, 2, 2, 0, 0, 0],
        fingers: [0, 2, 3, 0, 0, 0],
      },
    ],
  },
  {
    id: 'e',
    name: 'E',
    root: 'E',
    quality: 'major',
    voicings: [
      {
        frets: [0, 2, 2, 1, 0, 0],
        fingers: [0, 3, 4, 2, 0, 0],
      },
    ],
  },
  {
    id: 'a',
    name: 'A',
    root: 'A',
    quality: 'major',
    voicings: [
      {
        frets: [0, 0, 2, 2, 2, 0],
        fingers: [0, 0, 3, 4, 2, 0],
      },
    ],
  },
  {
    id: 'd',
    name: 'D',
    root: 'D',
    quality: 'major',
    voicings: [
      {
        frets: [2, 3, 2, 0, -1, -1],
        fingers: [2, 3, 1, 0, -1, -1],
      },
    ],
  },
];
