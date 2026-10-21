import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { lessons } from '../data/lessons';
import { commonChords } from '../data/chords';
import { useProgress } from '../contexts/ProgressContext';
import { Lesson } from '../types';
import ChordDiagram from './ChordDiagram';

export default function LessonList() {
  const { progress, markLessonComplete, markChordLearned } = useProgress();
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const orderedLessons = useMemo(() => [...lessons].sort((a, b) => a.order - b.order), []);
  const getChord = (id: string) => commonChords.find((chord) => chord.id === id);
  const completeLesson = (lesson: Lesson) => {
    markLessonComplete(lesson.id);
    lesson.chordIds.forEach(markChordLearned);
    setSelectedLesson(null);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={orderedLessons}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isCompleted = progress.completedLessons.includes(item.id);
          const isUnlocked = item.prerequisites?.every((p) => progress.completedLessons.includes(p)) ?? true;
          return (
            <Pressable
              style={[styles.lessonItem, isCompleted && styles.lessonItemCompleted, !isUnlocked && styles.lessonItemLocked]}
              onPress={() => isUnlocked && setSelectedLesson(item)}
              disabled={!isUnlocked}
            >
              <View style={styles.lessonHeader}>
                <View style={styles.number}><Text style={styles.numberText}>{item.order}</Text></View>
                <View style={styles.lessonHeading}>
                  <Text style={styles.lessonTitle}>{item.title}</Text>
                  <Text style={styles.lessonContent}>{item.content}</Text>
                </View>
                <Text style={styles.lessonStatus}>{isCompleted ? '✓' : isUnlocked ? '›' : '🔒'}</Text>
              </View>
              <Text style={styles.lessonMeta}>{item.chordIds.map((id) => getChord(id)?.name ?? id).join('  ·  ')}</Text>
              <Text style={styles.actionText}>{isCompleted ? 'Completed' : isUnlocked ? 'Open lesson' : 'Complete the previous lesson first'}</Text>
            </Pressable>
          );
        }}
        keyExtractor={(item) => item.id}
      />

      <Modal visible={selectedLesson !== null} animationType="slide" onRequestClose={() => setSelectedLesson(null)}>
        {selectedLesson && (
          <View style={styles.modal}>
            <ScrollView contentContainerStyle={styles.detailContent}>
              <Pressable onPress={() => setSelectedLesson(null)} style={styles.closeButton}><Text style={styles.closeText}>‹  All lessons</Text></Pressable>
              <Text style={styles.detailKicker}>LESSON {selectedLesson.order}</Text>
              <Text style={styles.detailTitle}>{selectedLesson.title}</Text>
              <Text style={styles.summary}>{selectedLesson.summary}</Text>
              <Text style={styles.sectionTitle}>Chord shapes</Text>
              {selectedLesson.chordIds.map((id) => {
                const chord = getChord(id);
                return chord ? <ChordDiagram key={id} chord={chord} /> : null;
              })}
              <Text style={styles.sectionTitle}>Build the shape</Text>
              <View style={styles.stepsCard}>
                {selectedLesson.steps.map((step, index) => (
                  <View key={step} style={styles.stepRow}>
                    <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{index + 1}</Text></View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.tipCard}>
                <Text style={styles.tipLabel}>Helpful tip</Text>
                <Text style={styles.tipText}>{selectedLesson.practiceTip}</Text>
              </View>
              <View style={styles.audioCard}>
                <Text style={styles.audioIcon}>♪</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.audioTitle}>Listen to the example</Text>
                  <Text style={styles.audioText}>Audio examples will be available with the lesson sound pack.</Text>
                </View>
              </View>
              {selectedLesson.drill && (
                <View style={styles.drillCard}>
                  <View style={styles.drillHeader}>
                    <Text style={styles.sectionTitle}>{selectedLesson.drill.title}</Text>
                    <Text style={styles.tempo}>{selectedLesson.drill.tempo} BPM</Text>
                  </View>
                  <Text style={styles.drillText}>{selectedLesson.drill.description}</Text>
                  <Text style={styles.drillChords}>{selectedLesson.drill.chordIds.map((id) => getChord(id)?.name ?? id).join('  →  ')}</Text>
                </View>
              )}
              <Pressable style={styles.completeButton} onPress={() => completeLesson(selectedLesson)}>
                <Text style={styles.completeButtonText}>{progress.completedLessons.includes(selectedLesson.id) ? 'Done — close lesson' : 'Mark lesson complete'}</Text>
              </Pressable>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingBottom: 24 },
  lessonItem: { backgroundColor: '#17202b', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#263544' },
  lessonItemCompleted: { borderColor: '#31c778' },
  lessonItemLocked: { opacity: 0.55 },
  lessonHeader: { flexDirection: 'row', alignItems: 'center' },
  number: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#273746', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  numberText: { color: '#9eafbf', fontWeight: '800' },
  lessonHeading: { flex: 1 },
  lessonTitle: { color: '#f7fafc', fontSize: 17, fontWeight: '800' },
  lessonContent: { color: '#9eafbf', fontSize: 13, lineHeight: 19, marginTop: 3 },
  lessonStatus: { color: '#31c778', fontSize: 26, marginLeft: 8 },
  lessonMeta: { color: '#d6e1ea', fontSize: 12, fontWeight: '700', marginTop: 14, marginLeft: 46 },
  actionText: { color: '#6f8293', fontSize: 11, marginTop: 10, marginLeft: 46 },
  modal: { flex: 1, backgroundColor: '#0e151d' },
  detailContent: { padding: 22, paddingBottom: 42 },
  closeButton: { marginBottom: 28 },
  closeText: { color: '#31c778', fontSize: 15, fontWeight: '700' },
  detailKicker: { color: '#31c778', fontSize: 12, letterSpacing: 1.5, fontWeight: '800' },
  detailTitle: { color: '#fff', fontSize: 30, fontWeight: '900', marginTop: 8 },
  summary: { color: '#b8c5d2', fontSize: 16, lineHeight: 24, marginTop: 10, marginBottom: 26 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 12 },
  stepsCard: { backgroundColor: '#17202b', borderRadius: 16, padding: 16, marginBottom: 14 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  stepNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#31c778', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  stepNumberText: { color: '#07130d', fontWeight: '800', fontSize: 12 },
  stepText: { color: '#d4dee7', flex: 1, fontSize: 14, lineHeight: 21 },
  tipCard: { backgroundColor: '#1e2d25', borderRadius: 14, padding: 15, marginBottom: 14 },
  tipLabel: { color: '#31c778', fontWeight: '800', marginBottom: 5 },
  tipText: { color: '#c5d9ce', lineHeight: 20 },
  audioCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#17202b', borderRadius: 14, padding: 15, marginBottom: 14, opacity: 0.8 },
  audioIcon: { color: '#31c778', fontSize: 26, marginRight: 13 },
  audioTitle: { color: '#fff', fontWeight: '800', marginBottom: 3 },
  audioText: { color: '#8999a9', fontSize: 12, lineHeight: 17 },
  drillCard: { backgroundColor: '#17202b', borderRadius: 14, padding: 15, marginBottom: 20 },
  drillHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tempo: { color: '#31c778', fontWeight: '800', fontSize: 12 },
  drillText: { color: '#b8c5d2', lineHeight: 20, marginBottom: 12 },
  drillChords: { color: '#fff', fontWeight: '800' },
  completeButton: { backgroundColor: '#31c778', borderRadius: 14, padding: 17, alignItems: 'center', marginTop: 4 },
  completeButtonText: { color: '#07130d', fontSize: 16, fontWeight: '900' },
});
