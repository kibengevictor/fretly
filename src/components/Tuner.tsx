import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { builtInTunings } from '../data/tunings';
import { useSettings } from '../contexts/SettingsContext';
import usePitchDetection from '../hooks/usePitchDetection';
import GuitarGlyph, { StringStatus } from './GuitarGlyph';
import {
  centsBetween,
  findNearestTarget,
  frequencyToNote,
  getTuningTargets,
} from '../utils/music';

const IN_TUNE_CENTS = 3;

const COLORS = {
  inTune: '#22C55E',
  outOfTune: '#EF4444',
  neutral: '#6B7280',
  muted: '#9CA3AF',
};

export default function Tuner() {
  const { settings } = useSettings();
  const [selectedTuning, setSelectedTuning] = useState(builtInTunings[0]);
  const [manualString, setManualString] = useState<number | null>(null);
  const [stringStatus, setStringStatus] = useState<Record<number, StringStatus>>({});
  const { frequency, listening, error, start, stop } = usePitchDetection();

  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  useEffect(() => {
    setManualString(null);
    setStringStatus({});
  }, [selectedTuning]);

  const targets = useMemo(
    () => getTuningTargets(selectedTuning, settings.a4Frequency),
    [selectedTuning, settings.a4Frequency],
  );

  const detected = frequency !== null ? frequencyToNote(frequency, settings.a4Frequency) : null;

  const activeTarget = useMemo(() => {
    if (manualString !== null) {
      return targets.find((target) => target.stringNumber === manualString) ?? null;
    }
    if (frequency === null) return null;
    return findNearestTarget(frequency, targets);
  }, [manualString, frequency, targets]);

  const cents = frequency !== null && activeTarget ? centsBetween(frequency, activeTarget.frequency) : null;
  const inTune = cents !== null && Math.abs(cents) <= IN_TUNE_CENTS;

  useEffect(() => {
    if (activeTarget === null || cents === null) return;
    const next: StringStatus = inTune ? 'in-tune' : 'out';
    setStringStatus((prev) =>
      prev[activeTarget.stringNumber] === next
        ? prev
        : { ...prev, [activeTarget.stringNumber]: next },
    );
  }, [activeTarget, cents, inTune]);

  const tunedCount = targets.filter(
    (target) =>
      target.stringNumber === activeTarget?.stringNumber
        ? inTune
        : stringStatus[target.stringNumber] === 'in-tune',
  ).length;

  let instruction = 'Pluck a string';
  let instructionColor = COLORS.neutral;
  let direction: 'up' | 'down' | null = null;

  if (error) {
    instruction = 'Microphone unavailable';
    instructionColor = COLORS.outOfTune;
  } else if (!listening) {
    instruction = 'Tap Start listening';
  } else if (frequency === null) {
    instruction = 'Pluck a string';
  } else if (activeTarget === null) {
    instruction = 'Listening…';
  } else if (inTune) {
    instruction = `${activeTarget.note}${activeTarget.octave} is in tune`;
    instructionColor = COLORS.inTune;
  } else if (cents !== null && cents > 0) {
    instruction = 'Tune down';
    instructionColor = COLORS.outOfTune;
    direction = 'down';
  } else {
    instruction = 'Tune up';
    instructionColor = COLORS.outOfTune;
    direction = 'up';
  }

  const noteColor = inTune ? COLORS.inTune : frequency === null ? COLORS.neutral : COLORS.outOfTune;
  const markerPercent = cents === null ? 50 : 50 + Math.max(-50, Math.min(50, cents));
  const markerLeft: `${number}%` = `${markerPercent}%`;

  const displayNote = activeTarget
    ? `${activeTarget.note}${activeTarget.octave}`
    : detected
      ? `${detected.note}${detected.octave}`
      : '—';

  const glyphStrings = targets.map((target) => {
    const isActive = target.stringNumber === activeTarget?.stringNumber;
    return {
      stringNumber: target.stringNumber,
      status: (isActive ? (inTune ? 'in-tune' : 'out') : stringStatus[target.stringNumber] ?? 'unknown') as StringStatus,
    };
  });

  const statusColor = (status: StringStatus) =>
    status === 'in-tune' ? COLORS.inTune : status === 'out' ? COLORS.outOfTune : COLORS.muted;

  function renderStringChip(target: (typeof targets)[number], status: StringStatus) {
    const isActive = target.stringNumber === activeTarget?.stringNumber;
    const color = statusColor(status);
    return (
      <TouchableOpacity
        key={target.stringNumber}
        style={[styles.stringChip, { borderColor: color }, isActive && styles.stringChipActive]}
        onPress={() =>
          setManualString(manualString === target.stringNumber ? null : target.stringNumber)
        }
      >
        <Text style={[styles.stringChipNumber, { color }]}>{target.stringNumber}</Text>
        <Text style={[styles.stringChipNote, { color }]}>
          {target.note}
          {target.octave}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.tuningSelector}>
        {builtInTunings.map((tuning) => (
          <TouchableOpacity
            key={tuning.id}
            style={[
              styles.tuningButton,
              selectedTuning.id === tuning.id && styles.tuningButtonActive,
            ]}
            onPress={() => setSelectedTuning(tuning)}
          >
            <Text
              style={[
                styles.tuningButtonText,
                selectedTuning.id === tuning.id && styles.tuningButtonTextActive,
              ]}
            >
              {tuning.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.guitarStage}>
        <View style={styles.sideStrings}>
          <View style={styles.sideColumn}>
            {targets.filter((target) => target.stringNumber >= 4).reverse().map((target) => {
              const status = target.stringNumber === activeTarget?.stringNumber
                ? (inTune ? 'in-tune' : 'out')
                : stringStatus[target.stringNumber] ?? 'unknown';
              return renderStringChip(target, status as StringStatus);
            })}
          </View>
          <View style={styles.guitarArea}>
            <GuitarGlyph strings={glyphStrings} />
          </View>
          <View style={styles.sideColumn}>
            {targets.filter((target) => target.stringNumber <= 3).map((target) => {
              const status = target.stringNumber === activeTarget?.stringNumber
                ? (inTune ? 'in-tune' : 'out')
                : stringStatus[target.stringNumber] ?? 'unknown';
              return renderStringChip(target, status as StringStatus);
            })}
          </View>
        </View>
      </View>

      <View style={styles.readout}>
        <View style={[styles.centsBubble, { borderColor: noteColor }]}>
          <Text style={[styles.centsText, { color: noteColor }]}>
            {cents === null ? '—' : `${cents > 0 ? '+' : ''}${Math.round(cents)}`}
          </Text>
        </View>
        <Text style={styles.noteText}>{displayNote}</Text>
        <View style={styles.instructionRow}>
          <Text style={[styles.arrow, { color: instructionColor, opacity: direction ? 1 : 0 }]}>
            {direction === 'down' ? '↓' : '↑'}
          </Text>
          <Text style={[styles.instruction, { color: instructionColor }]}>{instruction}</Text>
        </View>

        <Text style={styles.deviationText}>
          {cents === null
            ? ' '
            : inTune
              ? 'within 3¢'
              : `${Math.abs(Math.round(cents))}¢ ${cents > 0 ? 'sharp' : 'flat'}`}
        </Text>
        <Text style={styles.detectedText}>
          {frequency !== null ? `${frequency.toFixed(1)} Hz` : ' '}
          {detected && activeTarget && detected.note !== activeTarget.note
            ? ` · heard ${detected.note}${detected.octave}`
            : ''}
        </Text>

        <View style={styles.barContainer}>
          <View style={styles.barTrack} />
          <View style={styles.barTargetZone} />
          <View style={styles.barCenter} />
          {cents !== null && (
            <View style={[styles.barMarker, { left: markerLeft, backgroundColor: noteColor }]} />
          )}
        </View>
      </View>

      <Text style={styles.progressText}>
        {tunedCount}/{targets.length} strings in tune
        {manualString === null ? ' · auto' : ` · manual (string ${manualString})`}
      </Text>
      <TouchableOpacity
        style={[styles.autoButton, manualString === null && styles.autoButtonActive]}
        onPress={() => setManualString(null)}
      >
        <Text style={[styles.autoButtonText, manualString === null && styles.autoButtonTextActive]}>
          Auto tune
        </Text>
      </TouchableOpacity>

      <View style={styles.controls}>
        <View style={styles.a4Container}>
          <Text style={styles.a4Label}>A4 {settings.a4Frequency} Hz</Text>
        </View>

        <TouchableOpacity
          style={[styles.micButton, listening && styles.micButtonListening]}
          onPress={() => (listening ? stop() : start())}
        >
          <Text style={styles.micButtonText}>{listening ? 'Stop' : 'Start listening'}</Text>
        </TouchableOpacity>
      </View>

      {error !== null && <Text style={styles.errorText}>{error}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#111418',
  },
  container: {
    flexGrow: 1,
    padding: 12,
    alignItems: 'center',
  },
  tuningSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tuningButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#252a31',
  },
  tuningButtonActive: {
    backgroundColor: '#1ed19a',
  },
  tuningButtonText: {
    fontSize: 12,
    color: '#b9c0c9',
  },
  tuningButtonTextActive: {
    color: '#101418',
  },
  guitarStage: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  sideStrings: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sideColumn: {
    width: 48,
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 214,
  },
  guitarArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 0,
  },
  readout: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 14,
  },
  centsBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  centsText: {
    fontSize: 20,
    fontWeight: '700',
  },
  noteText: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  arrow: {
    fontSize: 34,
    fontWeight: 'bold',
  },
  instruction: {
    fontSize: 24,
    fontWeight: '700',
  },
  deviationText: {
    fontSize: 15,
    color: '#8e98a5',
    marginTop: 2,
    minHeight: 20,
  },
  detectedText: {
    fontSize: 12,
    color: '#77818d',
    minHeight: 16,
  },
  barContainer: {
    width: '86%',
    height: 24,
    justifyContent: 'center',
    marginTop: 10,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#39414b',
  },
  barTargetZone: {
    position: 'absolute',
    alignSelf: 'center',
    width: '6%',
    height: 12,
    borderRadius: 3,
    backgroundColor: 'rgba(30, 209, 154, 0.35)',
  },
  barCenter: {
    position: 'absolute',
    alignSelf: 'center',
    width: 2,
    height: 18,
    backgroundColor: '#a9b1ba',
  },
  barMarker: {
    position: 'absolute',
    width: 6,
    height: 18,
    borderRadius: 3,
    marginLeft: -3,
  },
  stringsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  stringChip: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#252a31',
    minWidth: 48,
  },
  stringChipActive: {
    backgroundColor: '#35404a',
    transform: [{ scale: 1.08 }],
  },
  stringChipNumber: {
    fontSize: 11,
    fontWeight: '600',
  },
  stringChipNote: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressText: {
    fontSize: 12,
    color: '#8e98a5',
    marginTop: 10,
    textAlign: 'center',
  },
  autoButton: {
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: '#252a31',
    borderWidth: 1,
    borderColor: '#3b4650',
  },
  autoButtonText: {
    fontSize: 12,
    color: '#b9c0c9',
    fontWeight: '700',
  },
  autoButtonActive: {
    backgroundColor: '#1ed19a',
    borderColor: '#1ed19a',
  },
  autoButtonTextActive: {
    color: '#101418',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 14,
  },
  a4Container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  a4Label: {
    fontSize: 14,
    color: '#c0c7d0',
    minWidth: 78,
    textAlign: 'center',
  },
  micButton: {
    backgroundColor: '#1ed19a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  micButtonListening: {
    backgroundColor: '#EF4444',
  },
  micButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    color: '#EF4444',
    textAlign: 'center',
  },
});
