import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface CalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  tasksData: { [dateStr: string]: { remaining: number; isAllDone: boolean } };
}

export default function Calendar({ selectedDate, onSelectDate, tasksData = {} }: CalendarProps) {
  // 이번 주(일~토) 날짜 계산
  const getWeekDays = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    
    return Array.from({ length: 7 }).map((_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });
  };

  const weekDays = getWeekDays();

  return (
    <View style={styles.calendarRow}>
      {weekDays.map((date) => {
        const dateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD 포맷
        const isSelected = date.toDateString() === selectedDate.toDateString();
        
        const info = tasksData[dateStr] || { remaining: 0, isAllDone: false };

        let boxStyle = styles.defaultBox;
        let content = <Text style={styles.badgeText}>{info.remaining}</Text>;

        if (info.isAllDone) {
          boxStyle = styles.doneBox;
          content = <Text style={styles.checkMark}>✓</Text>;
        } else if (info.remaining > 0) {
          boxStyle = isSelected ? styles.selectedBox : styles.pendingBox;
          content = <Text style={[styles.badgeText, isSelected && { color: '#fff' }]}>{info.remaining}</Text>;
        } else {
            // 남은게 0이고 완료된 것도 없는 초기 상태
            content = <Text style={styles.badgeText}>0</Text>;
        }

        return (
          <TouchableOpacity 
            key={date.toISOString()} 
            style={styles.calendarItem}
            onPress={() => onSelectDate(date)}
          >
            <View style={[styles.calendarBox, boxStyle]}>
              {content}
            </View>
            <Text style={[styles.dateLabel, isSelected && styles.selectedDateLabel]}>
              {date.getDate()}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  calendarRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 15, paddingHorizontal: 5 },
  calendarItem: { alignItems: 'center' },
  calendarBox: { width: 32, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  defaultBox: { backgroundColor: '#eee' }, 
  pendingBox: { backgroundColor: '#61bf84ff' }, 
  selectedBox: { backgroundColor: '#1bc084ff' }, 
  doneBox: { backgroundColor: '#10913fff' }, 
  badgeText: { fontSize: 12, fontWeight: '700', color: '#333' },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: '900' },
  dateLabel: { fontSize: 14, color: '#9ca3af', fontWeight: '600' },
  selectedDateLabel: { color: '#000', fontWeight: '800' }
});