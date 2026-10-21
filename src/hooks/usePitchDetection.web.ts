import { useCallback, useEffect, useRef, useState } from 'react';
import { detectPitch, medianFrequency } from '../utils/pitch';
import type { PitchDetectionState } from './usePitchDetection.types';

const DETECT_INTERVAL_MS = 100;
const SILENCE_CLEAR_MS = 300;
const HISTORY_SIZE = 5;
const FFT_SIZE = 4096;

type AudioContextConstructor = new () => AudioContext;

const getAudioContextConstructor = (): AudioContextConstructor | null => {
  if (typeof window === 'undefined') return null;
  return (
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext ?? null
  );
};

export default function usePitchDetection(): PitchDetectionState {
  const [frequency, setFrequency] = useState<number | null>(null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bufferRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const frameRef = useRef<number | null>(null);
  const historyRef = useRef<number[]>([]);
  const lastDetectRef = useRef(0);
  const lastPitchAtRef = useRef(0);
  const runningRef = useRef(false);

  const stop = useCallback(() => {
    runningRef.current = false;
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    analyserRef.current = null;
    bufferRef.current = null;
    contextRef.current?.close().catch(() => {});
    contextRef.current = null;
    historyRef.current = [];
    setFrequency(null);
    setListening(false);
  }, []);

  const start = useCallback(async () => {
    stop();
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser does not support microphone access.');
      return;
    }
    const AudioContextConstructor = getAudioContextConstructor();
    if (!AudioContextConstructor) {
      setError('This browser does not support live audio analysis.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      const context = new AudioContextConstructor();
      await context.resume();
      const analyser = context.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = 0;
      context.createMediaStreamSource(stream).connect(analyser);

      streamRef.current = stream;
      contextRef.current = context;
      analyserRef.current = analyser;
      bufferRef.current = new Float32Array(analyser.fftSize);
      historyRef.current = [];
      runningRef.current = true;
      setListening(true);

      const loop = () => {
        if (!runningRef.current) return;
        const node = analyserRef.current;
        const buffer = bufferRef.current;
        const currentContext = contextRef.current;
        if (node && buffer && currentContext) {
          node.getFloatTimeDomainData(buffer);
          const now = Date.now();
          if (now - lastDetectRef.current >= DETECT_INTERVAL_MS) {
            lastDetectRef.current = now;
            const pitch = detectPitch(buffer, currentContext.sampleRate);
            const history = historyRef.current;
            if (pitch === null) {
              history.length = 0;
              if (now - lastPitchAtRef.current > SILENCE_CLEAR_MS) setFrequency(null);
            } else {
              lastPitchAtRef.current = now;
              history.push(pitch);
              if (history.length > HISTORY_SIZE) history.shift();
              setFrequency(medianFrequency(history));
            }
          }
        }
        frameRef.current = requestAnimationFrame(loop);
      };
      frameRef.current = requestAnimationFrame(loop);
    } catch (err) {
      stop();
      if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) {
        setError('Microphone access denied. Allow microphone access in your browser settings.');
      } else {
        setError('Could not start the microphone. Check that an input device is available.');
      }
    }
  }, [stop]);

  useEffect(() => stop, [stop]);

  return { frequency, listening, error, start, stop };
}
