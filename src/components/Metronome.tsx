import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';

export default function Metronome() {
  const [bpm, setBpm] = useState(120);
  const [timeSignature, setTimeSignature] = useState(4);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Metronome</Text>
      <Text style={styles.bpmText}>{bpm} BPM</Text>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setBpm(Math.max(30, bpm - 5))}
        >
          <Text>-5</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setBpm(Math.max(30, bpm - 1))}
        >
          <Text>-1</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setBpm(Math.min(240, bpm + 1))}
        >
          <Text>+1</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setBpm(Math.min(240, bpm + 5))}
        >
          <Text>+5</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.playButton, isPlaying && styles.playButtonActive]}
        onPress={() => setIsPlaying(!isPlaying)}
      >
        <Text style={styles.playButtonText}>{isPlaying ? 'Stop' : 'Start'}</Text>
      </TouchableOpacity>

      <Text style={styles.infoText}>FR-PR-1: Adjustable tempo 30-240 BPM</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  bpmText: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  controls: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 30,
  },
  controlButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 4,
  },
  playButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  playButtonActive: {
    backgroundColor: '#F44336',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
  },
});
