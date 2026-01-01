import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = {
  setSkipAutoLogin?: (value: boolean) => void; // LoginScreen에 알림
};

export default function LoginPage({ setSkipAutoLogin }: Props) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout(); // Firebase 로그아웃
      await AsyncStorage.removeItem('userEmail');
      await AsyncStorage.removeItem('userPassword');

      if (setSkipAutoLogin) setSkipAutoLogin(true);

      // 🔑 웹과 앱 모두에서 알림창 띄우기
      if (Platform.OS === 'web') {
        window.alert('You have been logged out.');
      } else {
        Alert.alert('Notice', 'You have been logged out.');
      }
    } catch (error) {
      console.log('Logout error:', error);
      if (Platform.OS === 'web') {
        window.alert('Logout Failed. Something went wrong.');
      } else {
        Alert.alert('Logout Failed', 'Something went wrong while logging out.');
      }
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>No user logged in.</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#f9fafb' },
  profileImage: { width: 120, height: 120, borderRadius: 60, marginBottom: 24 },
  placeholderImage: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#d1d5db', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  placeholderText: { color: '#6b7280' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 8 },
  value: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  logoutButton: { backgroundColor: '#ef4444', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 12, marginTop: 32 },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  message: { fontSize: 16, color: '#6b7280' },
});
