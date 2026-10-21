export interface PitchDetectionState {
  frequency: number | null;
  listening: boolean;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
}
