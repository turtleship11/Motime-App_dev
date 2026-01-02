import { Image } from 'expo-image';
import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import Calendar from '@/components/calendar';

// Firebase 설정
import { db } from '@/firebase/firebase'; 
import { doc, setDoc, onSnapshot, collection } from 'firebase/firestore';

type Task = { title: string; done: boolean };
type Tasks = { [category: string]: Task[] };
type DaySummary = { remaining: number; isAllDone: boolean };

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const defaultTasks: Tasks = {
    Study: [
      { title: 'Hive projects', done: false },
      { title: 'Personal project', done: false },
      { title: 'Read book', done: false },
    ],
    Practice: [
      { title: 'Dance', done: false },
      { title: 'Pull-up', done: false },
    ],
  };
  const defaultCategories = ['Study', 'Practice'];

  /* =======================
     State
  ======================= */
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<Tasks>(defaultTasks);
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [weekTasksSummary, setWeekTasksSummary] = useState<{ [dateStr: string]: DaySummary }>({});

  const [showInput, setShowInput] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<string>('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryNameInput, setCategoryNameInput] = useState<string>('');
  const [editingTask, setEditingTask] = useState<{ category: string; index: number } | null>(null);
  const [taskTextInput, setTaskTextInput] = useState<string>('');

  /* =======================
     Firebase 실시간 데이터 불러오기 (onSnapshot)
  ======================= */
useEffect(() => {
  if (!user) return;

  // 1. 컬렉션 전체를 실시간으로 감시 (이것 하나로 모든 날짜 요약 해결)
  const daysCollectionRef = collection(db, "users", user.uid, "days");
  
  const unsubscribeAll = onSnapshot(daysCollectionRef, (querySnapshot) => {
    const newSummary: Record<string, { remaining: number; isAllDone: boolean }> = {};
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const dateStr = doc.id;
      const allTasks = Object.values(data.tasks || {}).flat();
      const remaining = allTasks.filter((t: any) => !t.done).length;
      const isAllDone = allTasks.length > 0 && remaining === 0;
      
      newSummary[dateStr] = { remaining, isAllDone };
    });
    
    // 캘린더 요약 정보를 즉시 업데이트 (모든 날짜 반영)
    setWeekTasksSummary(newSummary);
  });

  // 2. 현재 선택된 날짜의 상세 내용을 감시
  const dateStr = selectedDate.toLocaleDateString("en-CA");
  const docRef = doc(db, "users", user.uid, "days", dateStr);
  
  const unsubscribeDetail = onSnapshot(docRef, (snap) => {
    if (!snap.exists()) {
      setTasks(defaultTasks);
      setCategories(defaultCategories);
      return;
    }
    const data = snap.data();
    setTasks(data.tasks || defaultTasks);
    setCategories(data.categories || defaultCategories);
  });

  // 클린업: 두 구독 모두 해제
  return () => {
    unsubscribeAll();
    unsubscribeDetail();
  };
}, [user, selectedDate]);

  /* =======================
     Functions
  ======================= */
  const handleAuthAction = async () => {
    if (user) {
      const confirmLogout = Platform.OS === 'web'
        ? window.confirm("Are you sure you want to logout?")
        : await new Promise<boolean>((resolve) =>
            Alert.alert(
              "Logout",
              "Are you sure you want to logout?",
              [
                { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
                { text: "Logout", style: "destructive", onPress: () => resolve(true) }
              ]
            )
          );

      if (confirmLogout) {
        try {
          await logout();
          setTasks(defaultTasks);
          setCategories(defaultCategories);
          setWeekTasksSummary({});
        } catch (error) {
          console.error("Logout failed:", error);
          if (Platform.OS !== 'web') Alert.alert("Error", "Logout failed. Please try again.");
        }
      }
    } else {
      router.navigate('/(tabs)/profile');
    }
  };

  const handleDateSelect = (date: Date) => {
    if (!user) {
      router.navigate('/(tabs)/profile');
      return;
    }
    setSelectedDate(date);
  };

const saveToFirebase = async (newTasks: Tasks, newCategories: string[]) => {
  if (!user) return;

  const dateStr = selectedDate.toLocaleDateString('en-CA');
  const docRef = doc(db, 'users', user.uid, 'days', dateStr);
  try {
    console.log("setDoc 시작");
    await setDoc(docRef, { tasks: newTasks, categories: newCategories }, { merge: true });
    console.log("Firebase 저장 완료:", dateStr);
  } catch (e) {
    console.error("Firebase 저장 실패:", e);
  }

  const allTasks = Object.values(newTasks).flat();
  const remaining = allTasks.filter(t => !t.done).length;
  const isAllDone = allTasks.length > 0 && remaining === 0;

  setWeekTasksSummary(prev => ({
    ...prev,
    [dateStr]: { remaining, isAllDone }
  }));
};


  const toggleTask = (category: string, index: number) => {
    if (!tasks[category]) return;
    const updated = [...tasks[category]];
    updated[index] = { ...updated[index], done: !updated[index].done };
    const newTasks = { ...tasks, [category]: updated };
    setTasks(newTasks);
    saveToFirebase(newTasks, categories);
  };

  const addTask = (category: string) => {
    if (!newTask.trim()) return;
    const newTasks = { ...tasks, [category]: [...(tasks[category] || []), { title: newTask, done: false }] };
    setTasks(newTasks);
    saveToFirebase(newTasks, categories);
    setNewTask('');
    setShowInput(null);
  };

  const saveTaskText = (category: string, index: number) => {
    const newText = taskTextInput.trim();
    if (!newText) {
      setEditingTask(null);
      return;
    }
    const updated = [...tasks[category]];
    updated[index] = { ...updated[index], title: newText };
    const newTasks = { ...tasks, [category]: updated };
    setTasks(newTasks);
    saveToFirebase(newTasks, categories);
    setEditingTask(null);
  };

  const saveCategoryName = (oldName: string) => {
    const newName = categoryNameInput.trim();
    if (!newName || oldName === newName) { setEditingCategory(null); return; }
    const newTasks = { ...tasks };
    newTasks[newName] = newTasks[oldName] || [];
    delete newTasks[oldName];
    const newCats = categories.map(c => (c === oldName ? newName : c));
    setTasks(newTasks);
    setCategories(newCats);
    saveToFirebase(newTasks, newCats);
    setEditingCategory(null);
  };

  /* =======================
     Render
  ======================= */
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#ffffff', dark: '#ffffff' }}
      headerImage={
        <View style={styles.headerWrapper}>
          <Text style={styles.headerTitle}>MoTime</Text>
          <Text style={styles.headerSubtitle}>"Get motivated and manage your time with Motime."</Text>
        </View>
      }
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profileCard}>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} onPress={() => router.navigate('/(tabs)/profile')}>
            <Image source={{ uri: user?.photoURL || 'https://i.pravatar.cc/150' }} style={styles.profileImage} />
            <View>
              <Text style={styles.profileName}>{user?.displayName || user?.email?.split('@')[0] || 'Guest'}</Text>
              <Text style={styles.profileQuote}>{user ? 'each task shapes who we become.' : 'Please login to start.'}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleAuthAction} 
            style={[styles.authButton, user ? styles.logoutVariant : styles.loginVariant]}
          >
            <Text style={[styles.authButtonText, user ? styles.logoutText : styles.loginText]}>
              {user ? 'Logout' : 'Login'}
            </Text>
          </TouchableOpacity>
        </View>

        <Calendar 
          selectedDate={selectedDate} 
          onSelectDate={handleDateSelect}
          tasksData={weekTasksSummary}
        />

        {categories.map(cat => (
          <View key={cat} style={{ marginBottom: 24 }}>
            <View style={styles.categoryHeader}>
              {editingCategory === cat ? (
                <TextInput value={categoryNameInput} onChangeText={setCategoryNameInput} onSubmitEditing={() => saveCategoryName(cat)} style={styles.categoryInput} autoFocus />
              ) : (
                <TouchableOpacity onPress={() => { if(user) { setEditingCategory(cat); setCategoryNameInput(cat); } }}>
                  <Text style={styles.categoryTitle}>{cat}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => user ? setShowInput(cat) : router.navigate('/(tabs)/profile')} style={styles.addCircle}>
                <Text style={styles.addPlus}>+</Text>
              </TouchableOpacity>
            </View>

            {tasks[cat]?.map((task, index) => (
              <View key={index} style={styles.taskRow}>
                <TouchableOpacity style={[styles.checkbox, task.done && styles.checkboxDone]} onPress={() => user ? toggleTask(cat, index) : router.navigate('/(tabs)/profile')} />
                {editingTask?.category === cat && editingTask?.index === index ? (
                  <TextInput 
                    value={taskTextInput} 
                    onChangeText={setTaskTextInput} 
                    onSubmitEditing={() => saveTaskText(cat, index)} 
                    onBlur={() => saveTaskText(cat, index)}
                    style={styles.taskInput} 
                    autoFocus 
                  />
                ) : (
                  <TouchableOpacity onPress={() => { if(user) { setEditingTask({ category: cat, index }); setTaskTextInput(task.title); } }}>
                    <Text style={[styles.taskText, task.done && styles.taskDone]}>{task.title}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {showInput === cat && (
              <View style={styles.addTaskRow}>
                <TextInput placeholder="Add new task" value={newTask} onChangeText={setNewTask} style={styles.input} />
                <TouchableOpacity style={styles.addTaskButton} onPress={() => addTask(cat)}><Text style={styles.addButtonText}>Add</Text></TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerWrapper: { marginTop: 50, paddingHorizontal: 20, alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '600' },
  headerSubtitle: { fontSize: 12, color: '#777' },
  container: { padding: 20, flexGrow: 1 },
  profileCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  profileImage: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  profileName: { fontSize: 18, fontWeight: '600' },
  profileQuote: { fontSize: 13, color: '#888' },

  authButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  authButtonText: { fontSize: 12, fontWeight: '700' },
  logoutVariant: { backgroundColor: '#fee2e2' },
  logoutText: { color: '#ef4444' },
  loginVariant: { backgroundColor: '#e0f2fe' },
  loginText: { color: '#0284c7' },

  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  categoryTitle: { fontSize: 16, fontWeight: '600' },
  categoryInput: { fontSize: 16, fontWeight: '600', borderBottomWidth: 1, borderColor: '#515151', minWidth: 100 },
  addCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' },
  addPlus: { fontSize: 20 },
  taskRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: '#aaa', marginRight: 10 },
  checkboxDone: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  taskText: { fontSize: 14 },
  taskDone: { textDecorationLine: 'line-through', color: '#999' },
  taskInput: { fontSize: 14, borderBottomWidth: 1, flex: 1, borderColor: '#515151' },
  addTaskRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 10, height: 40 },
  addTaskButton: { marginLeft: 10, backgroundColor: '#515151', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  addButtonText: { color: '#fff', fontSize: 14 },
});
