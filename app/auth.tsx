import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';

export default function AuthScreen() {
  const { user, loading, signIn, signUp, confirmEmail, resendEmail, requestReset, completeReset } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [resetStep, setResetStep] = useState<'request' | 'confirm' | null>(null);
  const [resetCode, setResetCode] = useState('');
  const [resetPasswordValue, setResetPasswordValue] = useState('');

  useEffect(() => {
    if (user) router.replace('/(tabs)/lessons');
  }, [user]);

  const submit = async () => {
    setError('');
    if (!email.trim() || password.length < 8) {
      setError('Enter an email and a password of at least 8 characters.');
      return;
    }
    try {
      if (mode === 'login') await signIn(email, password);
      else {
        await signUp(email, password);
        setVerificationEmail(email.trim().toLowerCase());
        setVerificationSent(true);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to connect to the account service.');
    }
  };

  const verify = async () => {
    setError('');
    try {
      await confirmEmail(verificationEmail, verificationCode);
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'Unable to verify email.');
    }
  };

  const resend = async () => {
    setError('');
    try {
      await resendEmail(verificationEmail);
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : 'Unable to resend verification email.');
    }
  };

  const requestPasswordReset = async () => {
    setError('');
    if (!email.trim()) {
      setError('Enter your account email first.');
      return;
    }
    try {
      await requestReset(email);
      setVerificationEmail(email.trim().toLowerCase());
      setResetStep('confirm');
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Unable to request password reset.');
    }
  };

  const confirmPasswordReset = async () => {
    setError('');
    if (!/^\d{6}$/.test(resetCode) || resetPasswordValue.length < 8) {
      setError('Enter the six-digit code and a password of at least 8 characters.');
      return;
    }
    try {
      await completeReset(verificationEmail, resetCode, resetPasswordValue);
      setResetStep(null);
      setResetCode('');
      setResetPasswordValue('');
      setMode('login');
      setPassword('');
      setError('');
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Unable to reset password.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <Text style={styles.logo}>FRETLY</Text>
        <Text style={styles.tagline}>Your guitar practice, in one place.</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>{verificationSent ? 'Check your email' : resetStep ? resetStep === 'request' ? 'Reset your password' : 'Enter reset code' : mode === 'login' ? 'Welcome back' : 'Create your account'}</Text>
        <Text style={styles.subtitle}>{verificationSent ? `Enter the six-digit code sent to ${verificationEmail}.` : resetStep === 'request' ? 'Enter your account email and we’ll send a reset code.' : resetStep === 'confirm' ? `Enter the code sent to ${verificationEmail}, then choose a new password.` : 'Sign in to access your lessons, tuner, songs, and practice progress.'}</Text>
        {verificationSent ? (
          <>
            <TextInput keyboardType="number-pad" placeholder="6-digit verification code" placeholderTextColor="#758596" style={styles.input} value={verificationCode} onChangeText={setVerificationCode} maxLength={6} />
            {!!error && <Text style={styles.error}>{error}</Text>}
            <Pressable style={styles.primaryButton} onPress={verify} disabled={loading}>
              <Text style={styles.primaryText}>{loading ? 'Please wait…' : 'Verify email'}</Text>
            </Pressable>
            <Pressable onPress={resend} disabled={loading}>
              <Text style={styles.resend}>Resend code</Text>
            </Pressable>
          </>
        ) : resetStep === 'confirm' ? (
          <>
            <TextInput keyboardType="number-pad" placeholder="6-digit reset code" placeholderTextColor="#758596" style={styles.input} value={resetCode} onChangeText={setResetCode} maxLength={6} />
            <View style={styles.passwordField}>
              <TextInput autoCapitalize="none" secureTextEntry={!passwordVisible} placeholder="New password" placeholderTextColor="#758596" style={styles.passwordInput} value={resetPasswordValue} onChangeText={setResetPasswordValue} />
              <Pressable accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'} accessibilityRole="button" onPress={() => setPasswordVisible((visible) => !visible)} style={styles.passwordToggle}>
                <Ionicons name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={21} color="#9eafbf" />
              </Pressable>
            </View>
            {!!error && <Text style={styles.error}>{error}</Text>}
            <Pressable style={styles.primaryButton} onPress={confirmPasswordReset} disabled={loading}>
              <Text style={styles.primaryText}>{loading ? 'Please wait…' : 'Reset password'}</Text>
            </Pressable>
            <Pressable onPress={() => { setResetStep('request'); setError(''); }}>
              <Text style={styles.resend}>Send a new code</Text>
            </Pressable>
          </>
        ) : resetStep === 'request' ? (
          <>
            <TextInput autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="Email" placeholderTextColor="#758596" style={styles.input} value={email} onChangeText={setEmail} />
            {!!error && <Text style={styles.error}>{error}</Text>}
            <Pressable style={styles.primaryButton} onPress={requestPasswordReset} disabled={loading}>
              <Text style={styles.primaryText}>{loading ? 'Please wait…' : 'Send reset code'}</Text>
            </Pressable>
            <Pressable onPress={() => { setResetStep(null); setError(''); }}>
              <Text style={styles.resend}>Back to sign in</Text>
            </Pressable>
          </>
        ) : (
          <>
        <View style={styles.switcher}>
          <Pressable style={[styles.switchButton, mode === 'login' && styles.activeSwitch]} onPress={() => { setMode('login'); setError(''); }}>
            <Text style={[styles.switchText, mode === 'login' && styles.activeSwitchText]}>Sign in</Text>
          </Pressable>
          <Pressable style={[styles.switchButton, mode === 'register' && styles.activeSwitch]} onPress={() => { setMode('register'); setError(''); }}>
            <Text style={[styles.switchText, mode === 'register' && styles.activeSwitchText]}>Create account</Text>
          </Pressable>
        </View>
        <TextInput autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="Email" placeholderTextColor="#758596" style={styles.input} value={email} onChangeText={setEmail} />
        <View style={styles.passwordField}>
          <TextInput
            autoCapitalize="none"
            secureTextEntry={!passwordVisible}
            placeholder="Password"
            placeholderTextColor="#758596"
            style={styles.passwordInput}
            value={password}
            onChangeText={setPassword}
          />
          <Pressable
            accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
            onPress={() => setPasswordVisible((visible) => !visible)}
            style={styles.passwordToggle}
          >
            <Ionicons name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={21} color="#9eafbf" />
          </Pressable>
        </View>
        {!!error && <Text style={styles.error}>{error}</Text>}
            <Pressable style={styles.primaryButton} onPress={submit} disabled={loading}>
              <Text style={styles.primaryText}>{loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</Text>
            </Pressable>
            {mode === 'login' && (
              <Pressable onPress={() => { setResetStep('request'); setError(''); }}>
                <Text style={styles.resend}>Forgot password?</Text>
              </Pressable>
            )}
          </>
        )}
      </View>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0e151d', justifyContent: 'center', padding: 22 },
  brand: { marginBottom: 28 },
  logo: { color: '#31c778', fontSize: 16, fontWeight: '900', letterSpacing: 3 },
  tagline: { color: '#fff', fontSize: 28, fontWeight: '900', lineHeight: 34, marginTop: 10 },
  card: { backgroundColor: '#171f29', borderColor: '#273442', borderRadius: 18, borderWidth: 1, padding: 20, gap: 14 },
  title: { color: '#fff', fontSize: 22, fontWeight: '900' },
  subtitle: { color: '#9eafbf', fontSize: 14, lineHeight: 21 },
  switcher: { flexDirection: 'row', backgroundColor: '#0e151d', borderRadius: 10, padding: 4 },
  switchButton: { flex: 1, borderRadius: 8, padding: 11, alignItems: 'center' },
  activeSwitch: { backgroundColor: '#31c778' },
  switchText: { color: '#9eafbf', fontWeight: '700', fontSize: 13 },
  activeSwitchText: { color: '#07120d' },
  input: { backgroundColor: '#0e151d', borderColor: '#334353', borderRadius: 10, borderWidth: 1, color: '#fff', paddingHorizontal: 14, paddingVertical: 13 },
  passwordField: { position: 'relative' },
  passwordInput: { backgroundColor: '#0e151d', borderColor: '#334353', borderRadius: 10, borderWidth: 1, color: '#fff', paddingLeft: 14, paddingRight: 70, paddingVertical: 13 },
  passwordToggle: { padding: 8, position: 'absolute', right: 6, top: 5 },
  error: { color: '#ff8c8c', fontSize: 13 },
  primaryButton: { alignItems: 'center', backgroundColor: '#31c778', borderRadius: 10, padding: 14 },
  primaryText: { color: '#07120d', fontWeight: '900' },
  resend: { color: '#31c778', fontWeight: '800', textAlign: 'center' },
});
