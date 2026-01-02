import { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import { db } from '@/firebase/firebase'; 
import { doc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import { useRouter } from 'expo-router';

// 타입 정의
export type Task = { title: string; done: boolean };
export type Tasks = { [category: string]: Task[] };
export type DaySummary = { remaining: number; isAllDone: boolean };

export function useHomeLogic(user: any, logout: any) {
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
     States
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
     Firebase Real-time Sync
  ======================= */
  useEffect(() => {
    if (!user) return;
    else if(user)
        console.log("파이어베이스에 등록된 내 사진 주소:", user.photoURL);

    // 1. 전체 날짜 요약 감시
    const daysCollectionRef = collection(db, "users", user.uid, "days");
    const unsubscribeAll = onSnapshot(daysCollectionRef, (querySnapshot) => {
      const newSummary: Record<string, DaySummary> = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const allTasks = Object.values(data.tasks || {}).flat() as Task[];
        const remaining = allTasks.filter((t) => !t.done).length;
        const isAllDone = allTasks.length > 0 && remaining === 0;
        newSummary[doc.id] = { remaining, isAllDone };
      });
      setWeekTasksSummary(newSummary);
    });

    // 2. 선택된 날짜 상세 데이터 감시
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

    return () => {
      unsubscribeAll();
      unsubscribeDetail();
    };
  }, [user, selectedDate]);

  /* =======================
     Helper Functions
  ======================= */
  const saveToFirebase = async (newTasks: Tasks, newCategories: string[]) => {
    if (!user) return;
    const dateStr = selectedDate.toLocaleDateString('en-CA');
    const docRef = doc(db, 'users', user.uid, 'days', dateStr);
    try {
      await setDoc(docRef, { tasks: newTasks, categories: newCategories }, { merge: true });
    } catch (e) {
      console.error("Firebase save error:", e);
    }
  };

  const handleAuthAction = async () => {
    if (user) {
      const confirmLogout = Platform.OS === 'web'
        ? window.confirm("Are you sure you want to logout?")
        : await new Promise<boolean>((resolve) =>
            Alert.alert("Logout", "Are you sure you want to logout?", [
              { text: "Cancel", onPress: () => resolve(false) },
              { text: "Logout", onPress: () => resolve(true) }
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
    const newTasks = { ...tasks, [category]: [...(tasks[category] || []), { title: newTask, done: false }] };
    setTasks(newTasks);
    saveToFirebase(newTasks, categories);
    setNewTask('');
    setShowInput(null);
  };

  const saveTaskText = (category: string, index: number) => {
    const newText = taskTextInput.trim();
    if (!newText) { setEditingTask(null); return; }
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

  return {
    selectedDate, setSelectedDate,
    tasks, categories, weekTasksSummary,
    showInput, setShowInput,
    newTask, setNewTask,
    editingCategory, setEditingCategory,
    categoryNameInput, setCategoryNameInput,
    editingTask, setEditingTask,
    taskTextInput, setTaskTextInput,
    handleAuthAction, toggleTask, addTask, saveTaskText, saveCategoryName
  };
}