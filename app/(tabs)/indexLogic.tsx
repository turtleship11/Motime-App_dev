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
  const defaultCategories = ['Category1', 'Category2'];
  const emptyTasks: Tasks = {
    Category1: [],
    Category2: [],
  };

  /* =======================
     States
  ======================= */
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<Tasks>(emptyTasks);
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [weekTasksSummary, setWeekTasksSummary] =
    useState<Record<string, DaySummary>>({});

  const [showInput, setShowInput] = useState<string | null>(null);
  const [newTask, setNewTask] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryNameInput, setCategoryNameInput] = useState('');
  const [editingTask, setEditingTask] =
    useState<{ category: string; index: number } | null>(null);
  const [taskTextInput, setTaskTextInput] = useState('');

  // Profile
  const [profileQuote, setProfileQuote] = useState(
    'each task shapes who we become.'
  );
  const [photoURL, setPhotoURL] = useState<string | null>(
    user?.photoURL || null
  );

  // Daily Quote
  const [dailyQuote, setDailyQuote] =
    useState<{ text: string; author: string } | null>(null);

  /* =======================
     Daily Quote Logic
  ======================= */
  const getDailyQuote = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const dailyRef = doc(db, 'dailyQuotes', `${user.uid}_${today}`);
    const snap = await getDoc(dailyRef);

    if (snap.exists()) {
      setDailyQuote(snap.data() as any);
      return;
    }

    const quotesSnap = await getDocs(collection(db, 'quote'));
    const quotes = quotesSnap.docs.map(d => d.data()) as {
      text: string;
      author: string;
    }[];

    if (!quotes.length) return;

    const random = quotes[Math.floor(Math.random() * quotes.length)];
    const data = {
      userId: user.uid,
      date: today,
      text: random.text,
      author: random.author,
    };

    await setDoc(dailyRef, data);
    setDailyQuote(data);
  };

  /* =======================
     🔥 Auth 변경 감지 (로그아웃 초기화)
  ======================= */
  useEffect(() => {
    if (!user) {
      setPhotoURL(null);
      setProfileQuote('each task shapes who we become.');
      setDailyQuote(null);
      setTasks(emptyTasks);
      setCategories(defaultCategories);
      setWeekTasksSummary({});
    }
  }, [user]);

  /* =======================
     Firebase Sync
  ======================= */
  useEffect(() => {
    if (!user) return;

    getDailyQuote();

    // Profile
    const unsubscribeProfile = onSnapshot(
      doc(db, 'users', user.uid),
      snap => {
        if (!snap.exists()) return;
        const data = snap.data();
        setPhotoURL(data.photoURL || user.photoURL || null);
        setProfileQuote(
          data.profileQuote || 'each task shapes who we become.'
        );
      }
    );

    // Week summary
    const unsubscribeAll = onSnapshot(
      collection(db, 'users', user.uid, 'days'),
      qs => {
        const summary: Record<string, DaySummary> = {};
        qs.forEach(doc => {
          const data = doc.data();
          const allTasks = Object.values(data.tasks || {}).flat() as Task[];
          const remaining = allTasks.filter(t => !t.done).length;
          summary[doc.id] = {
            remaining,
            isAllDone: allTasks.length > 0 && remaining === 0,
          };
        });
        setWeekTasksSummary(summary);
      }
    );

    // Selected date
    const dateStr = selectedDate.toLocaleDateString('en-CA');
    const docRef = doc(db, 'users', user.uid, 'days', dateStr);

    const unsubscribeDetail = onSnapshot(docRef, async snap => {
      if (!snap.exists()) {
        setTasks(emptyTasks);
        setCategories(defaultCategories);

        await setDoc(
          docRef,
          {
            tasks: emptyTasks,
            categories: defaultCategories,
          },
          { merge: true }
        );
        return;
      }

      const data = snap.data();
      setTasks(data.tasks || emptyTasks);
      setCategories(data.categories || defaultCategories);
    });

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
    await setDoc(
      doc(db, 'users', user.uid, 'days', dateStr),
      { tasks: newTasks, categories: newCategories },
      { merge: true }
    );
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
    const updated = [...(tasks[category] || [])];
    updated[index] = { ...updated[index], done: !updated[index].done };
    const newTasks = { ...tasks, [category]: updated };
    setTasks(newTasks);
    saveToFirebase(newTasks, categories);
  };

  const addTask = (category: string) => {
    if (!newTask.trim()) return;

    const currentTasks = tasks[category] || [];
    const newTasks = {
      ...tasks,
      [category]: [...currentTasks, { title: newTask, done: false }],
    };

    setTasks(newTasks);
    saveToFirebase(newTasks, categories);
    setNewTask('');
    setShowInput(null);
  };

  const saveTaskText = (category: string, index: number) => {
    const text = taskTextInput.trim();
    if (!text) return setEditingTask(null);

    const updated = [...(tasks[category] || [])];
    updated[index] = { ...updated[index], title: text };
    const newTasks = { ...tasks, [category]: updated };
    setTasks(newTasks);
    saveToFirebase(newTasks, categories);
    setEditingTask(null);
  };

  const deleteTask = (category: string, index: number) => {
    const updated = [...(tasks[category] || [])];
    updated.splice(index, 1);
    const newTasks = { ...tasks, [category]: updated };
    setTasks(newTasks);
    saveToFirebase(newTasks, categories);
  };

  const saveCategoryName = (oldName: string) => {
    const newName = categoryNameInput.trim();
    if (!newName || oldName === newName) return setEditingCategory(null);

    const newTasks = { ...tasks };
    newTasks[newName] = newTasks[oldName];
    delete newTasks[oldName];

    const newCats = categories.map(c => (c === oldName ? newName : c));
    setTasks(newTasks);
    setCategories(newCats);
    saveToFirebase(newTasks, newCats);
    setEditingCategory(null);
  };

  return {
    selectedDate,
    setSelectedDate,
    tasks,
    categories,
    weekTasksSummary,
    showInput,
    setShowInput,
    newTask,
    setNewTask,
    editingCategory,
    setEditingCategory,
    categoryNameInput,
    setCategoryNameInput,
    editingTask,
    setEditingTask,
    taskTextInput,
    setTaskTextInput,
    toggleTask,
    addTask,
    saveTaskText,
    saveCategoryName,
    deleteTask,
    handleAuthAction,
    profileQuote,
    photoURL,
    dailyQuote,
  };
}
