import { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import { db } from '@/firebase/firebase';
import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  getDoc,
  getDocs,
} from 'firebase/firestore';
import { useRouter } from 'expo-router';

/* =======================
   Types
======================= */
export type Task = { title: string; done: boolean };
export type Tasks = { [category: string]: Task[] };
export type DaySummary = { remaining: number; isAllDone: boolean };

export function useHomeLogic(user: any, logout: any) {
  const router = useRouter();

  /* =======================
     Defaults
  ======================= */
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
  const defaultCategories = ['Category1', 'Category2'];

  /* =======================
     States
  ======================= */
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<Tasks>(defaultTasks);
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [weekTasksSummary, setWeekTasksSummary] = useState<Record<string, DaySummary>>({});

  const [showInput, setShowInput] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<string>('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryNameInput, setCategoryNameInput] = useState<string>('');
  const [editingTask, setEditingTask] = useState<{ category: string; index: number } | null>(null);
  const [taskTextInput, setTaskTextInput] = useState<string>('');

  // Profile
  const [profileQuote, setProfileQuote] = useState<string>('each task shapes who we become.');
  const [photoURL, setPhotoURL] = useState<string | null>(user?.photoURL || null);

  // Daily Quote
  const [dailyQuote, setDailyQuote] = useState<{ text: string; author: string } | null>(null);

  /* =======================
     Daily Quote Logic
  ======================= */
  const getDailyQuote = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const dailyDocId = `${user.uid}_${today}`;
      const dailyRef = doc(db, 'dailyQuotes', dailyDocId);

      // 1️⃣ 오늘의 dailyQuote가 이미 존재하는지 확인
      const snap = await getDoc(dailyRef);
      if (snap.exists()) {
        setDailyQuote(snap.data() as any);
        return;
      }

      // 2️⃣ quotes 컬렉션에서 랜덤 명언 가져오기
      const quotesSnap = await getDocs(collection(db, 'quote'));
      const quotes = quotesSnap.docs.map(doc => doc.data()) as { text: string; author: string }[];

      if (quotes.length === 0) return;

      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      const dailyData = {
        userId: user.uid,
        date: today,
        text: randomQuote.text,
        author: randomQuote.author,
      };

      // 3️⃣ dailyQuotes에 저장
      await setDoc(dailyRef, dailyData);

      // 4️⃣ 상태 업데이트
      setDailyQuote(dailyData);

    } catch (error) {
      console.error('Error fetching daily quote:', error);
    }
  };

  /* =======================
     Firebase Real-time Sync
  ======================= */
  useEffect(() => {
    if (!user) return;

    getDailyQuote();

    // 🔹 Profile info
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // 기존 user.photoURL fallback 처리
        setPhotoURL(data.photoURL || user.photoURL || null);
        setProfileQuote(data.profileQuote || 'each task shapes who we become.');
      }
    });

    // 🔹 Week summary
    const daysCollectionRef = collection(db, 'users', user.uid, 'days');
    const unsubscribeAll = onSnapshot(daysCollectionRef, (querySnapshot) => {
      const newSummary: Record<string, DaySummary> = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const allTasks = Object.values(data.tasks || {}).flat() as Task[];
        const remaining = allTasks.filter(t => !t.done).length;
        const isAllDone = allTasks.length > 0 && remaining === 0;
        newSummary[doc.id] = { remaining, isAllDone };
      });
      setWeekTasksSummary(newSummary);
    });

    // 🔹 Selected date detail
    const dateStr = selectedDate.toLocaleDateString('en-CA');
    const docRef = doc(db, 'users', user.uid, 'days', dateStr);
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

    // 🔹 Cleanup
    return () => {
      unsubscribeProfile();
      unsubscribeAll();
      unsubscribeDetail();
    };
  }, [user, selectedDate]);

  /* =======================
     Helpers
  ======================= */
  const saveToFirebase = async (newTasks: Tasks, newCategories: string[]) => {
    if (!user) return;
    const dateStr = selectedDate.toLocaleDateString('en-CA');
    const docRef = doc(db, 'users', user.uid, 'days', dateStr);
    await setDoc(docRef, { tasks: newTasks, categories: newCategories });
  };

  const handleAuthAction = async () => {
    if (user) {
      const confirmLogout =
        Platform.OS === 'web'
          ? window.confirm('Are you sure you want to logout?')
          : await new Promise<boolean>((resolve) =>
              Alert.alert('Logout', 'Are you sure you want to logout?', [
                { text: 'Cancel', onPress: () => resolve(false) },
                { text: 'Logout', onPress: () => resolve(true) },
              ])
            );

      if (confirmLogout) {
        await logout();
        setWeekTasksSummary({});
      }
    } else {
      router.navigate('/(tabs)/profile');
    }
  };

  const toggleTask = (category: string, index: number) => {
    const updated = [...tasks[category]];
    updated[index] = { ...updated[index], done: !updated[index].done };
    const newTasks = { ...tasks, [category]: updated };
    setTasks(newTasks);
    saveToFirebase(newTasks, categories);
  };

  const addTask = (category: string) => {
    if (!newTask.trim()) return;
    const newTasks = {
      ...tasks,
      [category]: [...(tasks[category] || []), { title: newTask, done: false }],
    };
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
  // Task 삭제
  const deleteTask = (category: string, index: number) => {
    if (!tasks[category]) return;
    const updated = [...tasks[category]];
    updated.splice(index, 1); // 해당 인덱스 제거
    const newTasks = { ...tasks, [category]: updated };
    setTasks(newTasks);
    saveToFirebase(newTasks, categories);
  };

  const saveCategoryName = (oldName: string) => {
    const newName = categoryNameInput.trim();
    if (!newName || oldName === newName) {
      setEditingCategory(null);
      return;
    }
    const newTasks = { ...tasks };

    // 1️⃣ tasks 배열은 그대로, key 이름만 바꾸기
    newTasks[newName] = newTasks[oldName];
    delete newTasks[oldName];

    const newCats = categories.map(c => (c === oldName ? newName : c));
    setTasks(newTasks);
    setCategories(newCats);
    saveToFirebase(newTasks, newCats);
    setEditingCategory(null);
  };

  /* =======================
     Return
  ======================= */
  return {
    selectedDate, setSelectedDate,
    tasks, categories, weekTasksSummary,
    showInput, setShowInput,
    newTask, setNewTask,
    editingCategory, setEditingCategory,
    categoryNameInput, setCategoryNameInput,
    editingTask, setEditingTask,
    taskTextInput, setTaskTextInput,
    handleAuthAction, toggleTask, addTask, saveTaskText, saveCategoryName,
    profileQuote, photoURL,
    dailyQuote,deleteTask,
  };
}
