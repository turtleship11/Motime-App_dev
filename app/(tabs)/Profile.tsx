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
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import ParallaxScrollView from '@/components/parallax-scroll-view';

export default function ProfileScreen() {
  const { user, login, logout, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) return null;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('알림', '이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert('로그인 실패', '이메일 또는 비밀번호를 확인해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ 로그인이 안 된 경우 (하단 바가 보이도록 함)
  if (!user) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: '#f9fafb' }}
      >
        {/* 배경 터치 시 키보드 닫기 (absoluteFill로 배경만 덮음) */}
        <Pressable 
          style={StyleSheet.absoluteFill} 
          onPress={Keyboard.dismiss} 
        />
        
        {/* 실제 컨텐츠 (z-index를 주어 Pressable 위로 올림) */}
        <View style={[styles.inner, { zIndex: 10 }]}>
          <View style={styles.header}>
            <Text style={styles.title}>MoTime</Text>
            <Text style={styles.subtitle}>계정에 로그인하여 시작하세요</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>이메일</Text>
            <TextInput
              placeholder="example@email.com"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Text style={styles.label}>비밀번호</Text>
            <TextInput
              placeholder="••••••••"
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
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>로그인</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ✅ 로그인이 된 경우
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#fff', dark: '#000' }}
      headerImage={<View style={{ alignItems: 'center', marginTop: 60 }}><Text style={{ fontSize: 24, fontWeight: 'bold' }}>내 프로필</Text></View>}
    >
      <View style={{ padding: 24 }}>
        <View style={styles.infoBox}>
          <Text style={styles.label}>현재 로그인 계정</Text>
          <Text style={styles.value}>{user.email}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  header: { marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 16, color: '#6b7280', marginTop: 8 },
  inputContainer: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16 },
  button: { backgroundColor: '#2563eb', padding: 18, borderRadius: 12, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#93c5fd' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  infoBox: { backgroundColor: '#f9f9f9', padding: 20, borderRadius: 12, marginBottom: 20 },
  value: { fontSize: 18, fontWeight: '600' },
  logoutButton: { backgroundColor: '#ef4444', padding: 16, borderRadius: 12 },
  logoutText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
});