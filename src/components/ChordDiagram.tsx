import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Chord } from '../types';

export default function ChordDiagram({ chord }: { chord: Chord }) {
  const voicing = chord.voicings[0];

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.chordName}>{chord.name}</Text>
        <Text style={styles.quality}>{chord.quality}</Text>
      </View>
      <View style={styles.diagramRow}>
        <View style={styles.markers}>
          {voicing.frets.map((fret, index) => (
            <Text key={`${chord.id}-marker-${index}`} style={styles.marker}>{fret === -1 ? 'X' : fret === 0 ? 'O' : ''}</Text>
          ))}
        </View>
        <View style={styles.board}>
          {Array.from({ length: 5 }, (_, fret) => (
            <View key={`fret-${fret}`} style={[styles.fret, { top: fret * 28 }, fret === 0 && styles.nut]} />
          ))}
          {voicing.fingers.map((finger, stringIndex) => (
            <View key={`${chord.id}-string-${stringIndex}`} style={styles.stringColumn}>
              {voicing.frets[stringIndex] > 0 && (
                <View style={[styles.finger, { top: (voicing.frets[stringIndex] - 1) * 28 + 8 }]}>
                  <Text style={styles.fingerText}>{finger}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
      <Text style={styles.caption}>Strings are shown from thickest (left) to thinnest (right).</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#17202b', borderRadius: 16, padding: 16, marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 12 },
  chordName: { color: '#fff', fontSize: 22, fontWeight: '800' },
  quality: { color: '#9caabd', fontSize: 13, textTransform: 'capitalize' },
  diagramRow: { flexDirection: 'row', alignItems: 'flex-start' },
  markers: { width: 24, paddingTop: 7 },
  marker: { color: '#aebdca', fontSize: 13, height: 28, textAlign: 'center', fontWeight: '700' },
  board: { height: 148, flex: 1, maxWidth: 240, position: 'relative', flexDirection: 'row', borderLeftWidth: 2, borderLeftColor: '#dce6ed' },
  fret: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#718092' },
  nut: { top: 0, height: 4, backgroundColor: '#f5c76b' },
  stringColumn: { flex: 1, borderRightWidth: 1, borderRightColor: '#718092', height: '100%', position: 'relative' },
  finger: { position: 'absolute', alignSelf: 'center', left: '50%', marginLeft: -11, width: 22, height: 22, borderRadius: 11, backgroundColor: '#31c778', alignItems: 'center', justifyContent: 'center' },
  fingerText: { color: '#07130d', fontSize: 12, fontWeight: '800' },
  caption: { color: '#8494a6', fontSize: 11, marginTop: 10 },
});
