import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import ParallaxScrollView from '@/components/parallax-scroll-view';

export default function HomeScreen() {
  const [tasks, setTasks] = useState({
    Study: [
      { title: 'Hive projects', done: true },
      { title: 'Personal project', done: true },
      { title: 'Read book', done: false },
    ],
    Practice: [
      { title: 'Dance', done: true },
      { title: 'Pull-up', done: false },
    ],
  });

  const [categories, setCategories] = useState(['Study', 'Practice']);
  const [showInput, setShowInput] = useState(null);
  const [newTask, setNewTask] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryNameInput, setCategoryNameInput] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [taskTextInput, setTaskTextInput] = useState('');

  const toggleTask = (category, index) => {
    setTasks(prev => {
      const updated = [...prev[category]];
      updated[index] = { ...updated[index], done: !updated[index].done };
      return { ...prev, [category]: updated };
    });
  };

  const addTask = (category) => {
    if (!newTask.trim()) return;
    setTasks(prev => ({
      ...prev,
      [category]: [...(prev[category] || []), { title: newTask, done: false }],
    }));
    setNewTask('');
    setShowInput(null);
  };

  const saveCategoryName = (oldName) => {
    const newName = (categoryNameInput || '').trim();
    if (!newName) return;
    setTasks(prev => {
      const updated = { ...prev };
      updated[newName] = updated[oldName] || [];
      delete updated[oldName];
      return updated;
    });
    setCategories(prev => prev.map(c => (c === oldName ? newName : c)));
    setEditingCategory(null);
    setCategoryNameInput('');
  };

  const saveTaskText = (category, index) => {
    const newText = taskTextInput.trim();
    if (!newText) return;
    setTasks(prev => {
      const updated = [...prev[category]];
      updated[index] = { ...updated[index], title: newText };
      return { ...prev, [category]: updated };
    });
    setEditingTask(null);
    setTaskTextInput('');
  };

  const allTasks = Object.values(tasks).flat();
  const completedTasks = allTasks.filter(task => task.done).length;
  const remainingTasks = allTasks.length - completedTasks;

  const getCalendarStyle = () => {
    let style = { backgroundColor: '#ddd' };
    let content = <Text style={styles.badgeText}>{remainingTasks}</Text>;
    if (completedTasks > 0 && remainingTasks === 0) {
      style = styles.calendarDone;
      content = <Text style={styles.checkMark}>✓</Text>;
    } else if (completedTasks > 0 && remainingTasks > 0) {
      style = { backgroundColor: '#22c55e' };
    }
    return { style, content };
  };

  const { style: calendarStyle, content: calendarContent } = getCalendarStyle();

  return (
    <ParallaxScrollView
     style={{ backgroundColor: '#fff' }}
      headerBackgroundColor={{ light: '#ffffff', dark: '#ffffff' }}
      headerImage={
      <View style={[styles.headerWrapper, { backgroundColor: '#fff' }]}>
        <Text style={styles.headerTitle}>MoTime</Text>
        <Text style={styles.headerSubtitle}>
          "Get motivated and manage your time with Motime."
        </Text>
      </View>
      }
    >
      <ScrollView
        style={{ backgroundColor: '#fff' }}
        contentContainerStyle={[styles.container, { backgroundColor: '#fff', flexGrow: 1 }]}
      >
        <View style={styles.profileCard}>
          <Image source={{ uri: 'https://i.pravatar.cc/150' }} style={styles.profileImage} />
          <View>
            <Text style={styles.profileName}>Motime User</Text>
            <Text style={styles.profileQuote}>each task shapes who we become.</Text>
          </View>
        </View>

        <View style={styles.calendarRow}>
          {[13, 14, 15, 16, 17, 18, 19].map(day => (
            <View key={day} style={styles.calendarItem}>
              {day === 16 ? (
                <View style={[styles.calendarBox, calendarStyle]}>
                  {calendarContent}
                </View>
              ) : (
                <View style={[styles.calendarBox, styles.calendarPending]} />
              )}
              <Text style={styles.dayText}>{day}</Text>
            </View>
          ))}
        </View>

        {categories.map(cat => (
          <View key={cat} style={{ marginBottom: 24 }}>
            <View style={styles.categoryHeader}>
              {editingCategory === cat ? (
                <TextInput
                  value={categoryNameInput}
                  onChangeText={setCategoryNameInput}
                  onSubmitEditing={() => saveCategoryName(cat)}
                  style={styles.categoryInput}
                  autoFocus
                />
              ) : (
                <TouchableOpacity onPress={() => { setEditingCategory(cat); setCategoryNameInput(cat); }}>
                  <Text style={styles.categoryTitle}>{cat}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowInput(cat)} style={styles.addCircle}>
                <Text style={styles.addPlus}>+</Text>
              </TouchableOpacity>
            </View>

            {tasks[cat]?.map((task, index) => (
              <View key={index} style={styles.taskRow}>
                <TouchableOpacity
                  style={[styles.checkbox, task.done && styles.checkboxDone]}
                  onPress={() => toggleTask(cat, index)}
                />
                {editingTask?.category === cat && editingTask?.index === index ? (
                  <TextInput
                    value={taskTextInput}
                    onChangeText={setTaskTextInput}
                    onSubmitEditing={() => saveTaskText(cat, index)}
                    style={styles.taskInput}
                    autoFocus
                  />
                ) : (
                  <TouchableOpacity
                    onPress={() => { setEditingTask({ category: cat, index }); setTaskTextInput(task.title); }}
                  >
                    <Text style={[styles.taskText, task.done && styles.taskDone]}>{task.title}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {showInput === cat && (
              <View style={styles.addTaskRow}>
                <TextInput
                  placeholder="새 할 일 입력"
                  value={newTask}
                  onChangeText={setNewTask}
                  style={styles.input}
                />
                <TouchableOpacity style={styles.addTaskButton} onPress={() => addTask(cat)}>
                  <Text style={styles.addButtonText}>추가</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerWrapper: { marginTop: 50, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '600' },
  headerSubtitle: { fontSize: 12, color: '#777' },
  container: { padding: 20 },
  profileCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  profileImage: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  profileName: { fontSize: 18, fontWeight: '600' },
  profileQuote: { fontSize: 13, color: '#888' },
  calendarRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 },
  calendarItem: { alignItems: 'center' },
  calendarBox: { width: 32, height: 28, borderRadius: 6, backgroundColor: '#ddd', marginBottom: 6, alignItems: 'center', justifyContent: 'center' },
  calendarPending: { backgroundColor: '#ddd' },
  calendarDone: { backgroundColor: '#16a34a' },
  checkMark: { color: '#fff', fontSize: 16, fontWeight: '700' },
  badgeText: { color: '#333', fontSize: 12, fontWeight: '600' },
  dayText: { fontSize: 14, marginTop: 2 },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  categoryTitle: { fontSize: 16, fontWeight: '600' },
  categoryInput: { fontSize: 16, fontWeight: '600', borderBottomWidth: 1 },
  addCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' },
  addPlus: { fontSize: 20 },
  taskRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: '#aaa', marginRight: 10 },
  checkboxDone: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  taskText: { fontSize: 14 },
  taskDone: { textDecorationLine: 'line-through', color: '#999' },
  taskInput: { fontSize: 14, borderBottomWidth: 1, flex: 1 },
  addTaskRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 10, height: 40 },
  addTaskButton: { marginLeft: 10, backgroundColor: '#515151ff', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  addButtonText: { color: '#fff', fontSize: 14 },
});
