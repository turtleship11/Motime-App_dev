import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Pressable,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginPage from './LoginPage';

type LoginScreenProps = {
  onSignup: () => void;
};

export default function LoginScreen({ onSignup }: LoginScreenProps) {
  const { login, user, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoLoginDone, setAutoLoginDone] = useState(false);
  const [skipAutoLogin, setSkipAutoLogin] = useState(false);

  useEffect(() => {
    const loadStoredUser = async () => {
      if (skipAutoLogin) return;
      await AsyncStorage.getItem('userEmail');
      await AsyncStorage.getItem('userPassword');
      setAutoLoginDone(true);
    };
    loadStoredUser();
  }, [skipAutoLogin]);

  const handleLogin = async () => {
    if (!email || !password) {
      Platform.OS === 'web'
        ? window.alert('Please enter both email and password.')
        : Alert.alert('Notice', 'Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      await AsyncStorage.setItem('userEmail', email);
      await AsyncStorage.setItem('userPassword', password);
    } catch (error: any) {
      let msg = 'Login failed.';
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        msg = 'Email or password is incorrect.';
      }
      Platform.OS === 'web'
        ? window.alert(msg)
        : Alert.alert('Login Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !autoLoginDone)
    return <ActivityIndicator style={{ flex: 1 }} />;

  if (user) return <LoginPage setSkipAutoLogin={setSkipAutoLogin} />;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={Keyboard.dismiss} />
      <View style={styles.inner}>
        <Text style={styles.title}>MoTime</Text>
        <Text style={styles.subtitle}>Log in to your account</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isSubmitting}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.signupButton]}
          onPress={onSignup}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 24 },
  inputContainer: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  signupButton: { backgroundColor: '#10b981' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700' },
});
