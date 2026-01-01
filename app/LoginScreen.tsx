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
import { useRouter } from 'expo-router';
import SignupPage from './SignupPage';
import { useNavigation } from '@react-navigation/native'; // 🔹 navigation import

export default function LoginScreen() {
  const { login, user, isLoading } = useAuth();
  const router = useRouter();
  const navigation = useNavigation<any>(); // 🔹 navigation 객체
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoLoginDone, setAutoLoginDone] = useState(false);
  const [skipAutoLogin, setSkipAutoLogin] = useState(false);

  useEffect(() => {
    const loadStoredUser = async () => {
      if (skipAutoLogin) return;
      const storedEmail = await AsyncStorage.getItem('userEmail');
      const storedPassword = await AsyncStorage.getItem('userPassword');
      if (storedEmail && storedPassword) {
        // 자동 로그인 구현 시 handleLogin 호출 가능
      }
      setAutoLoginDone(true);
    };
    loadStoredUser();
  }, [skipAutoLogin]);

  const handleLogin = async () => {
    if (!email || !password) {
      if (Platform.OS === 'web') {
        window.alert('Please enter both email and password.');
      } else {
        Alert.alert('Notice', 'Please enter both email and password.');
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      await AsyncStorage.setItem('userEmail', email);
      await AsyncStorage.setItem('userPassword', password);
    } catch (error: any) {
      let errorMessage = 'Login failed. Please try again.';
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        errorMessage = 'Email or password is incorrect.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert('Login Failed', errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !autoLoginDone) return <ActivityIndicator style={{ flex: 1 }} />;

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
            placeholder="example@email.com"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#9ca3af"
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            placeholderTextColor="#9ca3af"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isSubmitting}
        >
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
        </TouchableOpacity>

        {/* 🔹 Sign Up 버튼 클릭 시 SignupPage로 이동 */}
        <TouchableOpacity
          style={[styles.button, styles.signupButton, isSubmitting && styles.buttonDisabled]}
          onPress={() => router.push('/SignupPage')}
          disabled={isSubmitting}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  inner: { flex: 1, justifyContent: 'center', padding: 24, zIndex: 1 },
  title: { fontSize: 32, fontWeight: '800', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6b7280', marginBottom: 24 },
  inputContainer: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16, color: '#111827' },
  button: { backgroundColor: '#2563eb', padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  signupButton: { backgroundColor: '#10b981' },
  buttonDisabled: { backgroundColor: '#93c5fd' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
