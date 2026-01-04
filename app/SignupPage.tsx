import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

type Props = {
  onBack: () => void; // 🔥 로그인 화면으로 돌아가기
};

export default function SignupPage({ onBack }: Props) {
  const { signup, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async () => {
    if (!email || !password) {
      if (Platform.OS === 'web') {
        window.alert('Please enter both email and password');
      } else {
        Alert.alert('Notice', 'Please enter both email and password.');
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(email, password);

      // 🔥 회원가입 후 자동 로그인 방지
      await logout();

      if (Platform.OS === 'web') {
        window.alert('Account created! Please log in.');
      } else {
        Alert.alert('Success', 'Account created! Please log in.');
      }

      // ✅ ProfileScreen 안에서 LoginScreen으로 복귀
      onBack();
    } catch (error: any) {
      let errorMessage = 'Signup failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert('Signup Failed', errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSignup}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>
          {isSubmitting ? 'Loading...' : 'Sign Up'}
        </Text>
      </TouchableOpacity>

      {/* 🔹 로그인 화면으로 돌아가기 */}
      <TouchableOpacity onPress={onBack} style={{ marginTop: 16 }}>
        <Text style={{ textAlign: 'center', color: '#3b82f6' }}>
          Back to Login
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
