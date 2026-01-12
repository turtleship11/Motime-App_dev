import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Platform,
  TextInput,
  ScrollView,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import LoginScreen from '../LoginScreen';
import SignupPage from '../SignupPage';
import Calendar from '@/components/calendar'; // 통합 달력

import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDoc, getDocs, collection } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db } from '@/firebase/firebase';

export default function ProfileScreen() {
  const { user, logout, isLoading, refreshUser } = useAuth();
  const storage = getStorage();

  // 🔹 프로필
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profileQuote, setProfileQuote] = useState('');
  const [editingQuote, setEditingQuote] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // 🔹 Monthly Performance
  const [showMonthlyCalendar, setShowMonthlyCalendar] = useState(false);
  const [monthlyTasksData, setMonthlyTasksData] = useState<Record<string, { remaining: number; isAllDone: boolean }>>({});
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDateTasks, setSelectedDateTasks] = useState<Record<string, { title: string; done: boolean }[]> | null>(null);

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

  const displayName = user.displayName || user.email?.split('@')[0] || 'User';

  // 📸 사진 선택 + 업로드
  const pickAndUploadImage = async () => {
    try {
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
          await setDoc(doc(db, 'users', user.uid), { photoURL: downloadURL }, { merge: true });
          await refreshUser();
          Alert.alert('Profile photo updated!');
        };
        input.click();
        return;
      }

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return Alert.alert('Permission required');

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
      await setDoc(doc(db, 'users', user.uid), { photoURL: downloadURL }, { merge: true });
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
      await setDoc(doc(db, 'users', user.uid), { profileQuote }, { merge: true });
      setEditingQuote(false);
      Alert.alert('Quote updated!');
    } catch (error) {
      console.error(error);
      Alert.alert('Failed to update quote');
    }
  };

  // 🔹 월간 태스크 가져오기
  const fetchMonthlyTasks = async (monthDate: Date) => {
    if (!user) return;
    const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

    const snap = await getDocs(collection(db, 'users', user.uid, 'days'));
    const monthlyData: Record<string, { remaining: number; isAllDone: boolean }> = {};

    snap.docs.forEach(doc => {
      const data = doc.data();
      const date = new Date(doc.id);
      if (date >= start && date <= end) {
        const allTasks = Object.values(data.tasks || {}).flat() as { title: string; done: boolean }[];
        const remaining = allTasks.filter(t => !t.done).length;
        monthlyData[doc.id] = {
          remaining,
          isAllDone: allTasks.length > 0 && remaining === 0,
        };
      }
    });

    setMonthlyTasksData(monthlyData);
  };

  // 🔹 선택 날짜 클릭 시 하루 기록 확인
  const handleDatePress = async (date: Date) => {
    if (!user) return;
    const dateStr = date.toISOString().split('T')[0];
    const docSnap = await getDoc(doc(db, 'users', user.uid, 'days', dateStr));
    if (docSnap.exists()) {
      setSelectedDateTasks(docSnap.data().tasks || {});
    } else {
      setSelectedDateTasks({});
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#fff', dark: '#000' }}
      headerImage={
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{displayName}&apos;s Profile</Text>
        </View>
      }
    >
      <ScrollView contentContainerStyle={{ paddingVertical: 24,paddingHorizontal: 20, alignItems: 'center' }}>
        <View style={{ width: '100%', maxWidth: 600, alignItems: 'center' }}>
          {/* 🔹 프로필 사진 */}
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

          {/* 🔹 Current Account */}
          <View style={styles.infoBox}>
            <Text style={styles.label}>Current Account</Text>
            <Text style={styles.value}>{user.email}</Text>
          </View>

          {/* 🔹 Profile Quote */}
          <View style={styles.infoBox}>
            <Text style={styles.label}>Profile Quote</Text>
            {editingQuote ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  style={[styles.value, { flex: 1, borderBottomWidth: 1, borderColor: '#ccc' }]}
                  value={profileQuote}
                  onChangeText={setProfileQuote}
                />
                <TouchableOpacity onPress={saveQuote} style={{ marginLeft: 12 }}>
                  <Text style={{ color: '#10b981', fontWeight: 'bold' }}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.value, { flex: 1 }]}>{profileQuote || 'Tap to set your quote'}</Text>
                <TouchableOpacity onPress={() => setEditingQuote(true)} style={{ marginLeft: 12 }}>
                  <Text style={{ color: '#3b82f6', fontWeight: 'bold' }}>Edit</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* 🔹 Monthly Performance 버튼 */}
          <View style={styles.infoBox}>
            <TouchableOpacity
              onPress={() => {
                setShowMonthlyCalendar(!showMonthlyCalendar);
                fetchMonthlyTasks(selectedMonth);
                setSelectedDateTasks(null);
              }}
              style={{ padding : 12,backgroundColor: '#3b82f6', borderRadius: 8, width: '100%' }}
            >
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>
                {showMonthlyCalendar ? 'Hide Monthly Calendar' : 'Show Monthly Calendar'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 🔹 월간 달력 */}
          {showMonthlyCalendar && (
            <View style={{ marginBottom: 24, width: '100%' }}>
              <Calendar
                selectedDate={selectedMonth}
                onSelectDate={handleDatePress}
                tasksData={monthlyTasksData}
                mode="monthly"
              />
            </View>
          )}

          {/* 🔹 선택 날짜 태스크 */}
          {selectedDateTasks && (
            <View style={{ marginBottom: 24, width: '100%' }}>
              <Text style={{ fontWeight: '700', marginBottom: 8 }}>Tasks for selected date:</Text>
              {Object.keys(selectedDateTasks).length === 0 && (
                <Text style={{ color: '#6b7280' }}>No tasks for this date.</Text>
              )}
              {Object.entries(selectedDateTasks).map(([cat, tasks]) => (
                <View key={cat} style={{ marginBottom: 12 }}>
                  <Text style={{ fontWeight: '600', marginBottom: 4 }}>{cat}</Text>
                  {tasks.map((task, idx) => (
                    <Text
                      key={idx}
                      style={{
                        marginLeft: 12,
                        textDecorationLine: task.done ? 'line-through' : 'none',
                      }}
                    >
                      • {task.title} {task.done ? '✓' : ''}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* 🔹 로그아웃 버튼 */}
          <TouchableOpacity onPress={logout} style={[styles.logoutButton, { width: '100%' }]}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  header: { width: '100%', height: 100, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  profileSection: { alignItems: 'center', marginBottom: 24 },
  profileImage: { width: 90, height: 90, borderRadius: 45 },
  changeText: { marginTop: 8, fontSize: 10, color: '#6b7280', textAlign: 'center' },
  infoBox: { backgroundColor: '#f9f9f9', padding: 20, borderRadius: 12, marginBottom: 20, width: '100%' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  value: { fontSize: 18, fontWeight: '600' },
  logoutButton: { backgroundColor: '#ef4444', padding: 16, borderRadius: 12 },
  logoutText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
});
