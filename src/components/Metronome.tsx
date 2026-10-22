import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function Metronome() {
  const [bpm, setBpm] = useState(80);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => setBeat((current) => (current + 1) % 4), 60000 / bpm);
    return () => clearInterval(timer);
  }, [bpm, isPlaying]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>TIMING</Text>
          <Text style={styles.title}>Metronome</Text>
        </View>
        <Text style={styles.bpm}>{bpm} <Text style={styles.unit}>BPM</Text></Text>
      </View>
      <View style={styles.beats}>
        {[0, 1, 2, 3].map((item) => <View key={item} style={[styles.beat, beat === item && isPlaying && styles.beatActive]} />)}
      </View>
      <View style={styles.controls}>
        <Pressable style={styles.adjust} onPress={() => setBpm((value) => Math.max(30, value - 5))}><Text style={styles.adjustText}>−5</Text></Pressable>
        <Pressable style={styles.adjust} onPress={() => setBpm((value) => Math.max(30, value - 1))}><Text style={styles.adjustText}>−1</Text></Pressable>
        <Pressable style={styles.adjust} onPress={() => setBpm((value) => Math.min(240, value + 1))}><Text style={styles.adjustText}>+1</Text></Pressable>
        <Pressable style={styles.adjust} onPress={() => setBpm((value) => Math.min(240, value + 5))}><Text style={styles.adjustText}>+5</Text></Pressable>
      </View>
      <Pressable style={[styles.play, isPlaying && styles.stop]} onPress={() => setIsPlaying((value) => !value)}>
        <Text style={styles.playText}>{isPlaying ? 'Stop metronome' : 'Start metronome'}</Text>
      </Pressable>
      <Text style={styles.hint}>Use a slow tempo first. Increase it only when every chord change is clean.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#17202b', borderRadius: 16, padding: 18, marginBottom: 14 },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  kicker: { color: '#31c778', fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  title: { color: '#fff', fontSize: 21, fontWeight: '900', marginTop: 5 },
  bpm: { color: '#f5c76b', fontSize: 28, fontWeight: '900' },
  unit: { color: '#aebdca', fontSize: 12, fontWeight: '700' },
  beats: { flexDirection: 'row', gap: 8, marginVertical: 18 },
  beat: { flex: 1, height: 5, borderRadius: 3, backgroundColor: '#344556' },
  beatActive: { backgroundColor: '#31c778' },
  controls: { flexDirection: 'row', gap: 8 },
  adjust: { flex: 1, alignItems: 'center', backgroundColor: '#273746', borderRadius: 9, paddingVertical: 10 },
  adjustText: { color: '#fff', fontWeight: '800' },
  play: { alignItems: 'center', backgroundColor: '#31c778', borderRadius: 11, paddingVertical: 13, marginTop: 14 },
  stop: { backgroundColor: '#9b3b42' },
  playText: { color: '#07130d', fontWeight: '900' },
  hint: { color: '#8494a6', fontSize: 12, lineHeight: 18, marginTop: 12 },
});
