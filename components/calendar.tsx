import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface CalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  tasksData: { [dateStr: string]: { remaining: number; isAllDone: boolean } };
}

export default function Calendar({
  selectedDate,
  onSelectDate,
  tasksData = {},
}: CalendarProps) {

  // ✅ 선택된 날짜 기준 월 / 연도
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1;

  // ✅ 선택된 날짜 기준 이번 주 (일~토)
  const getWeekDays = () => {
    const baseDate = new Date(selectedDate);
    const startOfWeek = new Date(baseDate);
    startOfWeek.setDate(baseDate.getDate() - baseDate.getDay());

    return Array.from({ length: 7 }).map((_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });
  };

  const weekDays = getWeekDays();

  return (
    <View>

      {/* 🔹 월 / 연도 헤더 */}
      <View style={styles.monthHeader}>
        <Text style={styles.monthText}>
          {year}년 {month}월
        </Text>
      </View>

      {/* 🔹 주간 캘린더 */}
      <View style={styles.calendarRow}>
        {weekDays.map((date) => {
          const dateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD
          const isSelected = date.toDateString() === selectedDate.toDateString();

          const info = tasksData[dateStr] || {
            remaining: 0,
            isAllDone: false,
          };

          let boxStyle = styles.defaultBox;
          let content = <Text style={styles.badgeText}>{info.remaining}</Text>;

          if (info.isAllDone) {
            boxStyle = styles.doneBox;
            content = <Text style={styles.checkMark}>✓</Text>;
          } else if (info.remaining > 0) {
            boxStyle = isSelected ? styles.selectedBox : styles.pendingBox;
            content = (
              <Text
                style={[
                  styles.badgeText,
                  isSelected && { color: '#fff' },
                ]}
              >
                {info.remaining}
              </Text>
            );
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
              <Text
                style={[
                  styles.dateLabel,
                  isSelected && styles.selectedDateLabel,
                ]}
              >
                {date.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  monthHeader: {
    alignItems: 'flex-start',
    marginBottom: 3,
  },
  monthText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111',
  },

  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
    paddingHorizontal: 5,
  },
  calendarItem: {
    alignItems: 'center',
  },
  calendarBox: {
    width: 32,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  defaultBox: {
    backgroundColor: '#eee',
  },
  pendingBox: {
    backgroundColor: '#61bf84ff',
  },
  selectedBox: {
    backgroundColor: '#1bc084ff',
  },
  doneBox: {
    backgroundColor: '#10913fff',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
  },
  checkMark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  dateLabel: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '600',
  },
  selectedDateLabel: {
    color: '#000',
    fontWeight: '800',
  },
});
