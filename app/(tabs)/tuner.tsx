import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Tuner from '../../src/components/Tuner';

export default function TunerScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Tuner />
      </View>
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111418',
  },
  content: {
    flex: 1,
  },
});
