import { Image } from 'expo-image';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import Calendar from '@/components/calendar';

import { styles } from './indexStyle';
import { useHomeLogic } from './indexLogic'; // 방금 만든 로직 임포트

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // 모든 상태와 함수를 indexLogic에서 가져옵니다.
  const {
    selectedDate, setSelectedDate,
    tasks, categories, weekTasksSummary,
    showInput, setShowInput,
    newTask, setNewTask,
    editingCategory, setEditingCategory,
    categoryNameInput, setCategoryNameInput,
    editingTask, setEditingTask,
    taskTextInput, setTaskTextInput,
    profileQuote, photoURL,
    handleAuthAction, toggleTask, addTask, saveTaskText, saveCategoryName
  } = useHomeLogic(user, logout);

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
        {/* 프로필 카드 섹션 */}
        <View style={styles.profileCard}>
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} 
            onPress={() => router.navigate('/(tabs)/profile')}
          >
            <Image source={{ uri: photoURL || 'https://i.pravatar.cc/150' }} style={styles.profileImage} />
            <View>
              <Text style={styles.profileName}>{user?.displayName || user?.email?.split('@')[0] || 'Guest'}</Text>
              <Text style={styles.profileQuote}>{user ? profileQuote : 'Please login to start.'}</Text>
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
          onSelectDate={(date) => user ? setSelectedDate(date) : router.navigate('/(tabs)/profile')}
          tasksData={weekTasksSummary}
        />

        {/* 카테고리 및 태스크 리스트 */}
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
                <TouchableOpacity 
                  style={[styles.checkbox, task.done && styles.checkboxDone]} 
                  onPress={() => user ? toggleTask(cat, index) : router.navigate('/(tabs)/profile')} 
                />
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
                <TouchableOpacity style={styles.addTaskButton} onPress={() => addTask(cat)}>
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </ParallaxScrollView>
  );
}