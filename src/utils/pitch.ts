const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const BASE64_LOOKUP: Record<string, number> = {};
for (let i = 0; i < BASE64_CHARS.length; i++) {
  BASE64_LOOKUP[BASE64_CHARS[i]] = i;
}

export const decodeBase64ToInt16 = (b64: string): Int16Array => {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const byteLength = (clean.length * 3) >> 2;
  const bytes = new Uint8Array(byteLength);
  let p = 0;
  let i = 0;
  for (; i + 3 < clean.length; i += 4) {
    const n =
      (BASE64_LOOKUP[clean[i]] << 18) |
      (BASE64_LOOKUP[clean[i + 1]] << 12) |
      (BASE64_LOOKUP[clean[i + 2]] << 6) |
      BASE64_LOOKUP[clean[i + 3]];
    bytes[p++] = (n >> 16) & 0xff;
    bytes[p++] = (n >> 8) & 0xff;
    bytes[p++] = n & 0xff;
  }
  const remaining = clean.length - i;
  if (remaining === 2) {
    const n = (BASE64_LOOKUP[clean[i]] << 18) | (BASE64_LOOKUP[clean[i + 1]] << 12);
    bytes[p++] = (n >> 16) & 0xff;
  } else if (remaining === 3) {
    const n =
      (BASE64_LOOKUP[clean[i]] << 18) |
      (BASE64_LOOKUP[clean[i + 1]] << 12) |
      (BASE64_LOOKUP[clean[i + 2]] << 6);
    bytes[p++] = (n >> 16) & 0xff;
    bytes[p++] = (n >> 8) & 0xff;
  }
  return new Int16Array(bytes.buffer, 0, bytes.byteLength >> 1);
};

export const pcm16ToFloat32 = (pcm: Int16Array, out?: Float32Array): Float32Array => {
  const result = out && out.length >= pcm.length ? out : new Float32Array(pcm.length);
  for (let i = 0; i < pcm.length; i++) {
    result[i] = pcm[i] / 32768;
  }
  return result;
};

const parabolicInterpolation = (values: Float32Array, index: number): number => {
  if (index <= 0 || index >= values.length - 1) return index;
  const s0 = values[index - 1];
  const s1 = values[index];
  const s2 = values[index + 1];
  const denominator = 2 * s1 - s2 - s0;
  if (denominator === 0) return index;
  const shift = (s2 - s0) / (2 * denominator);
  return index + (Number.isFinite(shift) ? shift : 0);
};

// YIN pitch detection (de Cheveigné & Kawahara, 2002).
export const detectPitch = (
  buffer: Float32Array,
  sampleRate: number,
  minFreq: number = 50,
  maxFreq: number = 1500,
): number | null => {
  const windowSize = buffer.length >> 1;
  const tauMin = Math.max(2, Math.floor(sampleRate / maxFreq));
  const tauMax = Math.min(windowSize - 1, Math.ceil(sampleRate / minFreq));
  if (tauMax <= tauMin) return null;

  let energy = 0;
  for (let i = 0; i < buffer.length; i++) {
    energy += buffer[i] * buffer[i];
  }
  const rms = Math.sqrt(energy / buffer.length);
  if (rms < 0.01) return null;

  const difference = new Float32Array(tauMax + 1);
  for (let tau = 1; tau <= tauMax; tau++) {
    let sum = 0;
    for (let j = 0; j < windowSize; j++) {
      const delta = buffer[j] - buffer[j + tau];
      sum += delta * delta;
    }
    difference[tau] = sum;
  }

  const normalized = new Float32Array(tauMax + 1);
  normalized[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau <= tauMax; tau++) {
    runningSum += difference[tau];
    normalized[tau] = runningSum > 0 ? (difference[tau] * tau) / runningSum : 1;
  }

  const threshold = 0.15;
  let tauEstimate = -1;
  for (let tau = tauMin; tau <= tauMax; tau++) {
    if (normalized[tau] < threshold) {
      while (tau + 1 <= tauMax && normalized[tau + 1] < normalized[tau]) {
        tau++;
      }
      tauEstimate = tau;
      break;
    }
  }

  if (tauEstimate === -1) {
    let minimum = Infinity;
    for (let tau = tauMin; tau <= tauMax; tau++) {
      if (normalized[tau] < minimum) {
        minimum = normalized[tau];
        tauEstimate = tau;
      }
    }
    if (minimum > 0.5) return null;
  }

  const refinedTau = parabolicInterpolation(normalized, tauEstimate);
  const frequency = sampleRate / refinedTau;
  if (!Number.isFinite(frequency) || frequency < minFreq || frequency > maxFreq) return null;
  return frequency;
};

export const medianFrequency = (readings: number[]): number | null => {
  if (readings.length === 0) return null;
  const sorted = [...readings].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
