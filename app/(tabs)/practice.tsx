import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Metronome from '../../src/components/Metronome';
import { useProgress } from '../../src/contexts/ProgressContext';

const routine = [
  { minutes: 5, title: 'Warm up', description: 'Play each open string slowly. Focus on relaxed shoulders and an even sound.' },
  { minutes: 10, title: 'Chord shapes', description: 'Form Em, Am, E, A, and D. Strum each chord one string at a time.' },
  { minutes: 10, title: 'Chord changes', description: 'Use four beats per chord. Change only when the metronome gives you the next count.' },
  { minutes: 5, title: 'Song run-through', description: 'Choose one song and play it slowly without stopping to fix every small mistake.' },
];

export default function PracticeScreen() {
  const { progress, addPracticeTime } = useProgress();
  const [seconds, setSeconds] = useState(0);
  const [isSessionRunning, setIsSessionRunning] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (!isSessionRunning) return;
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [isSessionRunning]);

  const elapsed = useMemo(() => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`, [seconds]);
  const finishSession = () => {
    if (seconds >= 60) addPracticeTime(Math.floor(seconds / 60));
    setIsSessionRunning(false);
    setSeconds(0);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>BUILD THE HABIT</Text>
        <Text style={styles.title}>Practice</Text>
        <Text style={styles.subtitle}>A focused routine is better than playing randomly. Start a session and work through each block.</Text>

        <View style={styles.sessionCard}>
          <View>
            <Text style={styles.cardLabel}>CURRENT SESSION</Text>
            <Text style={styles.timer}>{elapsed}</Text>
          </View>
          <Pressable style={[styles.sessionButton, isSessionRunning && styles.finishButton]} onPress={isSessionRunning ? finishSession : () => setIsSessionRunning(true)}>
            <Text style={styles.sessionButtonText}>{isSessionRunning ? 'Finish' : 'Start session'}</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>30-minute routine</Text>
        {routine.map((step, index) => {
          const complete = completedSteps.includes(index);
          return (
            <Pressable key={step.title} style={[styles.routineCard, complete && styles.routineComplete]} onPress={() => setCompletedSteps((current) => complete ? current.filter((item) => item !== index) : [...current, index])}>
              <View style={[styles.stepCircle, complete && styles.stepCircleComplete]}><Text style={styles.stepNumber}>{complete ? '✓' : index + 1}</Text></View>
              <View style={styles.routineCopy}><View style={styles.routineHeading}><Text style={styles.routineTitle}>{step.title}</Text><Text style={styles.minutes}>{step.minutes} min</Text></View><Text style={styles.routineDescription}>{step.description}</Text></View>
            </Pressable>
          );
        })}

        <Text style={styles.sectionTitle}>Tools</Text>
        <Metronome />

        <View style={styles.progressCard}>
          <Text style={styles.cardLabel}>YOUR PROGRESS</Text>
          <View style={styles.statsRow}>
            <View><Text style={styles.statValue}>{progress.practiceTimeMinutes}</Text><Text style={styles.statLabel}>minutes</Text></View>
            <View><Text style={styles.statValue}>{progress.learnedChords.length}</Text><Text style={styles.statLabel}>chords learned</Text></View>
            <View><Text style={styles.statValue}>{progress.practicedSongs.length}</Text><Text style={styles.statLabel}>songs practised</Text></View>
          </View>
        </View>
      </ScrollView>
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0e151d' },
  content: { padding: 22, paddingBottom: 40 },
  eyebrow: { color: '#31c778', fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: '#fff', fontSize: 30, fontWeight: '900', marginTop: 6 },
  subtitle: { color: '#9eafbf', fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 22 },
  sessionCard: { backgroundColor: '#1e2d25', borderRadius: 16, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  cardLabel: { color: '#31c778', fontSize: 11, letterSpacing: 1.2, fontWeight: '800' },
  timer: { color: '#fff', fontSize: 34, fontWeight: '900', marginTop: 4 },
  sessionButton: { backgroundColor: '#31c778', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
  finishButton: { backgroundColor: '#f5c76b' },
  sessionButtonText: { color: '#07130d', fontWeight: '900' },
  sectionTitle: { color: '#fff', fontSize: 19, fontWeight: '900', marginBottom: 12, marginTop: 2 },
  routineCard: { flexDirection: 'row', backgroundColor: '#17202b', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#263544' },
  routineComplete: { borderColor: '#31c778', backgroundColor: '#182b24' },
  stepCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#273746', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  stepCircleComplete: { backgroundColor: '#31c778' },
  stepNumber: { color: '#d7e3eb', fontWeight: '900' },
  routineCopy: { flex: 1 },
  routineHeading: { flexDirection: 'row', justifyContent: 'space-between' },
  routineTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  minutes: { color: '#31c778', fontSize: 12, fontWeight: '800' },
  routineDescription: { color: '#9eafbf', fontSize: 13, lineHeight: 19, marginTop: 4 },
  progressCard: { backgroundColor: '#17202b', borderRadius: 16, padding: 18, marginTop: 2 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  statValue: { color: '#fff', fontSize: 25, fontWeight: '900' },
  statLabel: { color: '#8494a6', fontSize: 11, marginTop: 3 },
});
