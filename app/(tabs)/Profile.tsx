import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, Platform } from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import LoginScreen from '../LoginScreen';

import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebase';

export default function ProfileScreen() {
  const { user, logout, isLoading } = useAuth();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(user?.photoURL || null);
  const storage = getStorage();

  // 초기 로딩
  if (isLoading) return null;

  // 로그인 안 된 경우
  if (!user) {
    return (
      <View style={{ flex: 1 }}>
        <LoginScreen />
      </View>
    );
  }

  // 📸 사진 선택 + 업로드 (웹 / 모바일)
  const pickAndUploadImage = async () => {
    try {
      // 🌐 WEB
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';

        input.onchange = async () => {
          if (!input.files || !input.files[0]) return;
          const file = input.files[0];
          const storageRef = ref(storage, `Profile_photo/${user.uid}`);

          await uploadBytes(storageRef, file);

          const downloadURL = await getDownloadURL(storageRef);
          setProfilePhoto(downloadURL); // 즉시 UI 반영
          await setDoc(doc(db, 'users', user.uid), { photoURL: downloadURL }, { merge: true });

          Alert.alert('Profile photo updated!');
        };

        input.click();
        return;
      }

      // 📱 MOBILE (iOS / Android)
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5, // 이미지 압축
      });

      if (result.canceled) return;

      const uri = result.assets[0].uri;
      const response = await fetch(uri);
      const blob = await response.blob(); 

      const storageRef = ref(storage, `Profile_photo/${user.uid}`);
      await uploadBytes(storageRef, blob);

      const downloadURL = await getDownloadURL(storageRef);
      setProfilePhoto(downloadURL); // 즉시 UI 반영
      await setDoc(doc(db, 'users', user.uid), { photoURL: downloadURL }, { merge: true });

      Alert.alert('Profile photo updated!');
    } catch (error) {
      console.error(error);
      Alert.alert('Upload failed');
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#fff', dark: '#000' }}
      headerImage={
        <View style={styles.header}>
          <TouchableOpacity onPress={pickAndUploadImage}>
            <Image
              source={{ uri: profilePhoto || 'https://i.pravatar.cc/150' }}
              style={styles.profileImage}
            />
            <Text style={styles.changeText}>Tap to change photo</Text>
          </TouchableOpacity>
        </View>
      }
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
  header: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  changeText: {
    marginTop: 6,
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 12,
  },
  logoutText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
