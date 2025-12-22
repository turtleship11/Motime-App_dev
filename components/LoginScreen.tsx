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

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('알림', '이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (error: any) {
      let errorMessage = '로그인 중 오류가 발생했습니다.';
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        errorMessage = '이메일 또는 비밀번호가 일치하지 않습니다.';
      }
      Alert.alert('로그인 실패', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // 1. behavior 설정을 플랫폼별로 최적화 (안드로이드는 보통 undefined가 가장 안정적)
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* 2. Pressable을 배경으로만 사용 (TextInput 위를 덮지 않도록 수정) */}
      <Pressable 
        style={StyleSheet.absoluteFill} 
        onPress={Keyboard.dismiss} 
        accessible={false} 
      />

      {/* 3. 실제 입력 폼 영역 (배경 Pressable 위에 띄움) */}
      <View style={styles.inner} pointerEvents="box-none">
        <View style={styles.header}>
          <Text style={styles.title}>MoTime</Text>
          <Text style={styles.subtitle}>
            계정에 로그인하여 시작하세요
          </Text>
        </View>

        <View style={styles.inputContainer} pointerEvents="box-none">
          <Text style={styles.label}>이메일</Text>
          <TextInput
            placeholder="example@email.com"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#9ca3af"
            // TextInput에 직접적인 포커스 방해 요소 제거
            underlineColorAndroid="transparent"
          />

          <Text style={styles.label}>비밀번호</Text>
          <TextInput
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            placeholderTextColor="#9ca3af"
            underlineColorAndroid="transparent"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>로그인</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  inner: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 24,
    // inner 뷰 자체가 터치 이벤트를 막지 않도록 설정
    zIndex: 1 
  },
  header: { marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 16, color: '#6b7280', marginTop: 8 },
  inputContainer: { marginBottom: 24 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    color: '#111827',
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2, // 안드로이드 그림자
    shadowColor: '#000', // iOS 그림자
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});