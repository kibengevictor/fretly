import { StatusBar } from 'expo-status-bar';
import { StyleSheet, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Metronome from '../../src/components/Metronome';
import { useProgress } from '../../src/contexts/ProgressContext';

export default function PracticeScreen() {
  const { progress } = useProgress();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Practice Tools</Text>
        <Metronome />
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Your Progress</Text>
          <Text style={styles.stat}>Completed Lessons: {progress.completedLessons.length}</Text>
          <Text style={styles.stat}>Learned Chords: {progress.learnedChords.length}</Text>
          <Text style={styles.stat}>Practice Time: {progress.practiceTimeMinutes} min</Text>
          <Text style={styles.stat}>Current Streak: {progress.currentStreak} days</Text>
        </View>
        <Text style={styles.infoText}>FR-PR-2, FR-PR-3: Streaks and progress tracking</Text>
      </ScrollView>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 8,
    marginTop: 30,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  stat: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
