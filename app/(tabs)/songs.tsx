import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SongList from '../../src/components/SongList';

export default function SongsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>PLAY WHAT YOU KNOW</Text>
        <Text style={styles.title}>Song library</Text>
        <Text style={styles.subtitle}>Find a song, slow it down, and practise the chord changes at your pace.</Text>
        <SongList />
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
    marginBottom: 18,
  },
});
