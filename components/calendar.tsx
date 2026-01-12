import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface CalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  tasksData: { [dateStr: string]: { remaining: number; isAllDone: boolean } };
  mode?: 'weekly' | 'monthly'; // 주간/월간 모드
}

export default function Calendar({
  selectedDate,
  onSelectDate,
  tasksData = {},
  mode = 'weekly',
}: CalendarProps) {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth(); // 0~11
  const monthText = month + 1;

  // =======================
  // Weekly Calendar
  // =======================
  if (mode === 'weekly') {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    const weekDays = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });

    return (
      <View>
        <View style={styles.monthHeader}>
          <Text style={styles.monthText}>{year}년 {monthText}월</Text>
        </View>

        <View style={styles.calendarRow}>
          {weekDays.map((date) => {
            const dateStr = date.toISOString().split('T')[0];
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
            }

            return (
              <TouchableOpacity key={date.toISOString()} style={styles.calendarItem} onPress={() => onSelectDate(date)}>
                <View style={[styles.calendarBox, boxStyle]}>{content}</View>
                <Text style={[styles.dateLabel, isSelected && styles.selectedDateLabel]}>{date.getDate()}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  // =======================
  // Monthly Calendar
  // =======================
  const lastDay = new Date(year, month + 1, 0).getDate();
  const firstDayWeek = new Date(year, month, 1).getDay(); // 0=일~6=토

  const days: (Date | null)[] = Array(firstDayWeek).fill(null); // 빈 칸
  for (let i = 1; i <= lastDay; i++) days.push(new Date(year, month, i));

  const rows: (Date | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));

  return (
    <View>
      {/* 월/연도 */}
      <Text style={styles.header}>{year} / {monthText} Month</Text>

      {/* 요일 */}
      <View style={styles.weekRow}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <Text key={d} style={[styles.weekDay, d === 'Sun' ? { color: '#ef4444' } : {}]}>{d}</Text>
        ))}
      </View>

      {/* 날짜 */}
      {rows.map((week, idx) => (
        <View key={idx} style={styles.weekRow}>
          {week.map((date, i) => {
            if (!date) return <View key={i} style={styles.dayCell} />;

            const dateStr = date.toISOString().split('T')[0];
            const info = tasksData[dateStr] || { remaining: 0, isAllDone: false };
            const isSelected = date.toDateString() === selectedDate.toDateString();

            let bgColor = '#eee';
            if (info.isAllDone) bgColor = '#10913fff';
            else if (info.remaining > 0) bgColor = isSelected ? '#1bc084ff' : '#79dc9eff';

            const textColor = info.isAllDone || (info.remaining > 0 && isSelected) ? '#fff' : '#111';

            return (
              <TouchableOpacity key={i} style={[styles.dayCell, { backgroundColor: bgColor }]} onPress={() => onSelectDate(date)}>
                <Text style={{ color: textColor }}>{date.getDate()}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  monthHeader: { alignItems: 'flex-start', marginBottom: 3 },
  monthText: { fontSize: 12, fontWeight: '800', color: '#111' },

  calendarRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10, paddingHorizontal: 5 },
  calendarItem: { alignItems: 'center' },
  calendarBox: { width: 32, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  defaultBox: { backgroundColor: '#eee' },
  pendingBox: { backgroundColor: '#79dc9eff' },
  selectedBox: { backgroundColor: '#1bc084ff' },
  doneBox: { backgroundColor: '#10913fff' },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#333' },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: '900' },
  dateLabel: { fontSize: 12, color: '#9ca3af', fontWeight: '600' },
  selectedDateLabel: { color: '#000', fontWeight: '800' },

  // Monthly
  header: { fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  weekDay: { flex: 1, textAlign: 'center', fontWeight: '600' },
  dayCell: { flex: 1, aspectRatio: 1, margin: 2, justifyContent: 'center', alignItems: 'center', borderRadius: 4 },
});
