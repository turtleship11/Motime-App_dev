import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import LoginScreen from '../LoginScreen';
import SignupPage from '../SignupPage';

import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db } from '@/firebase/firebase';

export default function ProfileScreen() {
  const { user, logout, isLoading, refreshUser } = useAuth();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profileQuote, setProfileQuote] = useState<string>('');
  const [editingQuote, setEditingQuote] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const storage = getStorage();

  // 🔄 user 변경 시 프로필 정보 동기화
  
  useEffect(() => {
    setProfilePhoto(user?.photoURL || null);

    const fetchQuote = async () => {
      if (!user) return;
      const docSnap = await getDoc(doc(db, 'users', user.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfileQuote(data.profileQuote || '');
      }
    };

    fetchQuote();
  }, [user]);

  if (isLoading) return null;

  if (!user) {
    return mode === 'login' ? (
      <LoginScreen onSignup={() => setMode('signup')} />
    ) : (
      <SignupPage onBack={() => setMode('login')} />
    );
  }

  const displayName =
    user.displayName || user.email?.split('@')[0] || 'User';

  // 📸 사진 선택 + 업로드
  const pickAndUploadImage = async () => {
    try {
      // WEB
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

          setProfilePhoto(downloadURL);
          await updateProfile(user, { photoURL: downloadURL });
          await setDoc(
            doc(db, 'users', user.uid),
            { photoURL: downloadURL },
            { merge: true }
          );
          await refreshUser();
          Alert.alert('Profile photo updated!');
        };
        input.click();
        return;
      }

      // MOBILE
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted)
        return Alert.alert('Permission required');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (result.canceled) return;

      const uri = result.assets[0].uri;
      const response = await fetch(uri);
      const blob = await response.blob();

      const storageRef = ref(storage, `Profile_photo/${user.uid}`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      setProfilePhoto(downloadURL);
      await updateProfile(user, { photoURL: downloadURL });
      await setDoc(
        doc(db, 'users', user.uid),
        { photoURL: downloadURL },
        { merge: true }
      );
      await refreshUser();
      Alert.alert('Profile photo updated!');
    } catch (error) {
      console.error(error);
      Alert.alert('Upload failed');
    }
  };

  // 📌 profileQuote 저장
  const saveQuote = async () => {
    if (!user) return;
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        { profileQuote },
        { merge: true }
      );
      setEditingQuote(false);
      Alert.alert('Quote updated!');
    } catch (error) {
      console.error(error);
      Alert.alert('Failed to update quote');
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#fff', dark: '#000' }}
      headerImage={
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {displayName}&apos;s Profile
          </Text>
        </View>
      }
    >
      <View style={{ padding: 24 }}>
        {/* 🔹 프로필 사진 (헤더 아님) */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={pickAndUploadImage} style={{ alignItems: 'center' }}>
            <View style={{ width: 100, alignItems: 'center' }}>
              <Image
                source={{ uri: profilePhoto || 'https://i.pravatar.cc/150' }}
                style={styles.profileImage}
              />
              <Text style={styles.changeText}>Tap to change photo</Text>
            </View>
          </TouchableOpacity>

        </View>

        {/* 현재 로그인 계정 */}
        <View style={styles.infoBox}>
          <Text style={styles.label}>Current Account</Text>
          <Text style={styles.value}>{user.email}</Text>
        </View>

        {/* 프로필 문구 편집 */}
        <View style={styles.infoBox}>
          <Text style={styles.label}>Profile Quote</Text>

          {editingQuote ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={[
                  styles.value,
                  { flex: 1, borderBottomWidth: 1, borderColor: '#ccc' },
                ]}
                value={profileQuote}
                onChangeText={setProfileQuote}
              />
              <TouchableOpacity onPress={saveQuote} style={{ marginLeft: 12 }}>
                <Text style={{ color: '#10b981', fontWeight: 'bold' }}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.value, { flex: 1 }]}>
                {profileQuote || 'Tap to set your quote'}
              </Text>
              <TouchableOpacity
                onPress={() => setEditingQuote(true)}
                style={{ marginLeft: 12 }}
              >
                <Text style={{ color: '#3b82f6', fontWeight: 'bold' }}>
                  Edit
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

          
          
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  changeText: {
    marginTop: 8,
    fontSize: 10,
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

