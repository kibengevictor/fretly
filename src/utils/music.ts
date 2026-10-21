import { NoteName, Tuning } from '../types';

export const noteNames: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const NOTE_MIDI_OFFSET: Record<NoteName, number> = {
  C: 0,
  'C#': 1,
  D: 2,
  'D#': 3,
  E: 4,
  F: 5,
  'F#': 6,
  G: 7,
  'G#': 8,
  A: 9,
  'A#': 10,
  B: 11,
};

export interface NoteReading {
  note: NoteName;
  octave: number;
  cents: number;
}

export const frequencyToNote = (frequency: number, a4: number = 440): NoteReading | null => {
  if (!Number.isFinite(frequency) || frequency <= 0) return null;
  const midi = 69 + 12 * Math.log2(frequency / a4);
  const midiRounded = Math.round(midi);
  const octave = Math.floor(midiRounded / 12) - 1;
  const noteIndex = ((midiRounded % 12) + 12) % 12;
  let cents = Math.round((midi - midiRounded) * 100);
  if (cents > 50) cents = 50;
  if (cents < -50) cents = -50;
  return {
    note: noteNames[noteIndex],
    octave,
    cents,
  };
};

export const noteToFrequency = (note: NoteName, octave: number, a4: number = 440): number => {
  const midi = (octave + 1) * 12 + NOTE_MIDI_OFFSET[note];
  return a4 * Math.pow(2, (midi - 69) / 12);
};

export interface TuningTarget {
  stringNumber: number;
  note: NoteName;
  octave: number;
  frequency: number;
}

const nearestOctaveToPitch = (note: NoteName, referenceHz: number): number => {
  let bestOctave = 2;
  let bestDistance = Infinity;
  for (let octave = 0; octave <= 7; octave++) {
    const distance = Math.abs(noteToFrequency(note, octave) - referenceHz);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestOctave = octave;
    }
  }
  return bestOctave;
};

// Guitar-family open strings rise in pitch from low to high, so infer
// octaves from the first string and keep each next string above the last.
export const getTuningTargets = (tuning: Tuning, a4: number = 440): TuningTarget[] => {
  const targets: TuningTarget[] = [];
  const stringCount = tuning.stringNotes.length;
  tuning.stringNotes.forEach((note, index) => {
    let octave: number;
    if (index === 0) {
      octave = nearestOctaveToPitch(note, 100);
    } else {
      const previous = targets[index - 1];
      octave = previous.octave;
      if (noteToFrequency(note, octave, a4) <= previous.frequency) {
        octave += 1;
      }
    }
    targets.push({
      stringNumber: stringCount - index,
      note,
      octave,
      frequency: noteToFrequency(note, octave, a4),
    });
  });
  return targets;
};

export const centsBetween = (frequency: number, targetFrequency: number): number =>
  1200 * Math.log2(frequency / targetFrequency);

export const findNearestTarget = (
  frequency: number,
  targets: TuningTarget[],
): TuningTarget | null => {
  if (targets.length === 0 || !Number.isFinite(frequency) || frequency <= 0) return null;
  let nearest: TuningTarget | null = null;
  let bestDistance = Infinity;
  for (const target of targets) {
    const distance = Math.abs(Math.log2(frequency / target.frequency));
    if (distance < bestDistance) {
      bestDistance = distance;
      nearest = target;
    }
  }
  return nearest;
};
