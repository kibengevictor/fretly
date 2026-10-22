import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { useProgress } from '../../src/contexts/ProgressContext';

export default function AccountScreen() {
  const { user, loading, signIn, signUp, signOut } = useAuth();
  const { progress } = useProgress();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (!email.trim() || password.length < 8) {
      setError('Enter an email and a password of at least 8 characters.');
      return;
    }
    try {
      if (mode === 'login') await signIn(email, password);
      else await signUp(email, password);
      setPassword('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to connect to the account service.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>YOUR PROGRESS</Text>
        <Text style={styles.title}>Account</Text>
        {user ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>SIGNED IN AS</Text>
              <Text style={styles.email}>{user.email}</Text>
              <Text style={styles.role}>{user.role === 'admin' ? 'Administrator' : 'Guitar learner'}</Text>
            </View>
            <View style={styles.stats}>
              <Stat label="Lessons" value={progress.completedLessons.length} />
              <Stat label="Songs" value={progress.practicedSongs.length} />
              <Stat label="Minutes" value={progress.practiceTimeMinutes} />
            </View>
            <Text style={styles.sync}>Your progress is synced to your account.</Text>
            <Pressable style={styles.secondaryButton} onPress={signOut}>
              <Text style={styles.secondaryText}>Sign out</Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.subtitle}>Sign in to keep your lessons, songs, and practice history across devices.</Text>
            <View style={styles.switcher}>
              <Pressable style={[styles.switchButton, mode === 'login' && styles.activeSwitch]} onPress={() => { setMode('login'); setError(''); }}>
                <Text style={[styles.switchText, mode === 'login' && styles.activeSwitchText]}>Sign in</Text>
              </Pressable>
              <Pressable style={[styles.switchButton, mode === 'register' && styles.activeSwitch]} onPress={() => { setMode('register'); setError(''); }}>
                <Text style={[styles.switchText, mode === 'register' && styles.activeSwitchText]}>Create account</Text>
              </Pressable>
            </View>
            <TextInput autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="Email" placeholderTextColor="#758596" style={styles.input} value={email} onChangeText={setEmail} />
            <TextInput autoCapitalize="none" secureTextEntry placeholder="Password" placeholderTextColor="#758596" style={styles.input} value={password} onChangeText={setPassword} />
            {!!error && <Text style={styles.error}>{error}</Text>}
            <Pressable style={styles.primaryButton} onPress={submit} disabled={loading}>
              <Text style={styles.primaryText}>{loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0e151d' },
  content: { padding: 22, gap: 18 },
  eyebrow: { color: '#31c778', fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: '#fff', fontSize: 30, fontWeight: '900', marginTop: -10 },
  card: { backgroundColor: '#171f29', borderColor: '#273442', borderRadius: 18, borderWidth: 1, padding: 20, gap: 14 },
  cardLabel: { color: '#7f91a3', fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  email: { color: '#fff', fontSize: 20, fontWeight: '800' },
  role: { color: '#9eafbf', fontSize: 14 },
  subtitle: { color: '#9eafbf', fontSize: 15, lineHeight: 22 },
  switcher: { flexDirection: 'row', backgroundColor: '#0e151d', borderRadius: 10, padding: 4 },
  switchButton: { flex: 1, borderRadius: 8, padding: 11, alignItems: 'center' },
  activeSwitch: { backgroundColor: '#31c778' },
  switchText: { color: '#9eafbf', fontWeight: '700', fontSize: 13 },
  activeSwitchText: { color: '#07120d' },
  input: { backgroundColor: '#0e151d', borderColor: '#334353', borderRadius: 10, borderWidth: 1, color: '#fff', paddingHorizontal: 14, paddingVertical: 13 },
  error: { color: '#ff8c8c', fontSize: 13 },
  primaryButton: { alignItems: 'center', backgroundColor: '#31c778', borderRadius: 10, padding: 14 },
  primaryText: { color: '#07120d', fontWeight: '900' },
  secondaryButton: { alignItems: 'center', borderColor: '#405160', borderRadius: 10, borderWidth: 1, padding: 14 },
  secondaryText: { color: '#fff', fontWeight: '800' },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { backgroundColor: '#171f29', borderRadius: 14, flex: 1, padding: 14 },
  statValue: { color: '#31c778', fontSize: 24, fontWeight: '900' },
  statLabel: { color: '#9eafbf', fontSize: 12, marginTop: 3 },
  sync: { color: '#8fa2b4', fontSize: 13, textAlign: 'center' },
});
