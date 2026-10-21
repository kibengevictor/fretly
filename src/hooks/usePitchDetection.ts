import { useCallback, useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import type { Subscription } from 'expo-stream-audio';
import { decodeBase64ToInt16, detectPitch, medianFrequency, pcm16ToFloat32 } from '../utils/pitch';
import type { PitchDetectionState } from './usePitchDetection.types';

type StreamAudioModule = typeof import('expo-stream-audio');

const BUFFER_SIZE = 4096;
const DETECT_INTERVAL_MS = 100;
const SILENCE_CLEAR_MS = 300;
const HISTORY_SIZE = 5;

const loadStreamModule = (): StreamAudioModule | null => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-stream-audio') as StreamAudioModule;
  } catch {
    return null;
  }
};

const requestMicrophonePermission = async (module: StreamAudioModule): Promise<boolean> => {
  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
    if (result === PermissionsAndroid.RESULTS.GRANTED) return true;
    if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) return false;
  }
  const status = await module.requestPermission();
  return status === 'granted';
};

export default function usePitchDetection(): PitchDetectionState {
  const [frequency, setFrequency] = useState<number | null>(null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bufferRef = useRef<Float32Array>(new Float32Array(BUFFER_SIZE));
  const filledRef = useRef(0);
  const historyRef = useRef<number[]>([]);
  const lastDetectRef = useRef(0);
  const lastPitchAtRef = useRef(0);
  const runningRef = useRef(false);
  const frameSubscriptionRef = useRef<Subscription | null>(null);
  const errorSubscriptionRef = useRef<Subscription | null>(null);
  const moduleRef = useRef<StreamAudioModule | null>(null);

  const processFrame = useCallback((pcmBase64: string, sampleRate: number) => {
    if (!runningRef.current) return;
    const pcm = decodeBase64ToInt16(pcmBase64);
    if (pcm.length === 0) return;
    const samples = pcm16ToFloat32(pcm);
    const buffer = bufferRef.current;

    const writeLength = Math.min(samples.length, BUFFER_SIZE);
    buffer.copyWithin(0, writeLength);
    buffer.set(samples.subarray(samples.length - writeLength), BUFFER_SIZE - writeLength);
    filledRef.current = Math.min(BUFFER_SIZE, filledRef.current + writeLength);
    if (filledRef.current < BUFFER_SIZE) return;

    const now = Date.now();
    if (now - lastDetectRef.current < DETECT_INTERVAL_MS) return;
    lastDetectRef.current = now;

    const pitch = detectPitch(buffer, sampleRate);
    const history = historyRef.current;
    if (pitch === null) {
      history.length = 0;
      if (now - lastPitchAtRef.current > SILENCE_CLEAR_MS) setFrequency(null);
      return;
    }
    lastPitchAtRef.current = now;
    history.push(pitch);
    if (history.length > HISTORY_SIZE) history.shift();
    setFrequency(medianFrequency(history));
  }, []);

  const stop = useCallback(() => {
    runningRef.current = false;
    frameSubscriptionRef.current?.remove();
    errorSubscriptionRef.current?.remove();
    frameSubscriptionRef.current = null;
    errorSubscriptionRef.current = null;
    const module = moduleRef.current;
    moduleRef.current = null;
    historyRef.current = [];
    setFrequency(null);
    setListening(false);
    if (module) {
      module.stop().catch(() => {});
    }
  }, []);

  const start = useCallback(async () => {
    stop();
    setError(null);

    const module = loadStreamModule();
    if (!module) {
      setError(
        'Live audio capture needs a development build. Run "npx expo run:ios" or "npx expo run:android" (Expo Go is not supported).',
      );
      return;
    }

    const granted = await requestMicrophonePermission(module).catch(() => false);
    if (!granted) {
      setError('Microphone access denied. Enable it in Settings to use the tuner.');
      return;
    }

    moduleRef.current = module;
    try {
      await module.start({
        sampleRate: 48000,
        frameDurationMs: 20,
        channels: 1,
        enableLevelMeter: false,
      });
    } catch {
      moduleRef.current = null;
      setError('Could not start microphone capture.');
      return;
    }

    bufferRef.current = new Float32Array(BUFFER_SIZE);
    filledRef.current = 0;
    historyRef.current = [];
    runningRef.current = true;
    setListening(true);

    frameSubscriptionRef.current = module.addFrameListener((event) => {
      processFrame(event.pcmBase64, event.sampleRate);
    });
    errorSubscriptionRef.current = module.addErrorListener((event) => {
      setError(event.message);
      stop();
    });
  }, [processFrame, stop]);

  useEffect(() => stop, [stop]);

  return { frequency, listening, error, start, stop };
}
