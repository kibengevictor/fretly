import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LessonList from '../../src/components/LessonList';

export default function LessonsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>START WITH THE BASICS</Text>
        <Text style={styles.title}>Chord lessons</Text>
        <Text style={styles.subtitle}>Short, guided lessons to help you make clean chord shapes and change between them.</Text>
        <LessonList />
      </View>
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e151d',
  },
  content: {
    flex: 1,
    padding: 22,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#fff',
    marginTop: 6,
  },
  eyebrow: {
    color: '#31c778',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  subtitle: {
    color: '#9eafbf',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 22,
  },
});
