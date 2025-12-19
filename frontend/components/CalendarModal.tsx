import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const DAY_WIDTH = (width - Spacing.md * 4) / 7;

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onSelectPeriod?: (startDate: Date, endDate: Date) => void;
  allowPeriodSelection?: boolean;
}

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export function CalendarModal({
  visible,
  onClose,
  selectedDate,
  onSelectDate,
  onSelectPeriod,
  allowPeriodSelection = true,
}: CalendarModalProps) {
  const insets = useSafeAreaInsets();
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  const [selectionMode, setSelectionMode] = useState<'single' | 'period'>('single');
  const [periodStart, setPeriodStart] = useState<Date | null>(null);
  const [periodEnd, setPeriodEnd] = useState<Date | null>(null);

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of month (0 = Sunday, we want Monday = 0)
    const firstDay = new Date(year, month, 1);
    let startDayIndex = firstDay.getDay() - 1;
    if (startDayIndex < 0) startDayIndex = 6; // Sunday becomes 6
    
    // Days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Days from previous month
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    const days: { date: Date; isCurrentMonth: boolean; isToday: boolean }[] = [];
    
    // Previous month days
    for (let i = startDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
        isToday: false,
      });
    }
    
    // Current month days
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday:
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear(),
      });
    }
    
    // Next month days to complete the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        isToday: false,
      });
    }
    
    return days;
  }, [currentMonth]);

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDayPress = (date: Date) => {
    if (selectionMode === 'single') {
      onSelectDate(date);
      onClose();
    } else {
      // Period selection
      if (!periodStart || (periodStart && periodEnd)) {
        setPeriodStart(date);
        setPeriodEnd(null);
      } else {
        if (date < periodStart) {
          setPeriodEnd(periodStart);
          setPeriodStart(date);
        } else {
          setPeriodEnd(date);
        }
      }
    }
  };

  const handleConfirmPeriod = () => {
    if (periodStart && periodEnd && onSelectPeriod) {
      onSelectPeriod(periodStart, periodEnd);
      onClose();
    }
  };

  const isDateSelected = (date: Date) => {
    if (selectionMode === 'single') {
      return (
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear()
      );
    }
    return false;
  };

  const isDateInPeriod = (date: Date) => {
    if (!periodStart) return false;
    if (!periodEnd) {
      return (
        date.getDate() === periodStart.getDate() &&
        date.getMonth() === periodStart.getMonth() &&
        date.getFullYear() === periodStart.getFullYear()
      );
    }
    return date >= periodStart && date <= periodEnd;
  };

  const isPeriodStart = (date: Date) => {
    if (!periodStart) return false;
    return (
      date.getDate() === periodStart.getDate() &&
      date.getMonth() === periodStart.getMonth() &&
      date.getFullYear() === periodStart.getFullYear()
    );
  };

  const isPeriodEnd = (date: Date) => {
    if (!periodEnd) return false;
    return (
      date.getDate() === periodEnd.getDate() &&
      date.getMonth() === periodEnd.getMonth() &&
      date.getFullYear() === periodEnd.getFullYear()
    );
  };

  const handleSelectToday = () => {
    const today = new Date();
    onSelectDate(today);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { paddingBottom: insets.bottom + Spacing.md }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Sélectionner une date</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Mode Selection */}
          {allowPeriodSelection && (
            <View style={styles.modeSelector}>
              <TouchableOpacity
                style={[styles.modeBtn, selectionMode === 'single' && styles.modeBtnActive]}
                onPress={() => {
                  setSelectionMode('single');
                  setPeriodStart(null);
                  setPeriodEnd(null);
                }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={selectionMode === 'single' ? Colors.white : Colors.primary}
                />
                <Text style={[styles.modeBtnText, selectionMode === 'single' && styles.modeBtnTextActive]}>
                  Jour
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, selectionMode === 'period' && styles.modeBtnActive]}
                onPress={() => setSelectionMode('period')}
              >
                <Ionicons
                  name="calendar-number-outline"
                  size={18}
                  color={selectionMode === 'period' ? Colors.white : Colors.primary}
                />
                <Text style={[styles.modeBtnText, selectionMode === 'period' && styles.modeBtnTextActive]}>
                  Période
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={goToPreviousMonth} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {MONTHS_FR[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Days Header */}
          <View style={styles.daysHeader}>
            {DAYS_FR.map((day, index) => (
              <Text key={index} style={styles.dayHeaderText}>{day}</Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((day, index) => {
              const isSelected = isDateSelected(day.date);
              const inPeriod = selectionMode === 'period' && isDateInPeriod(day.date);
              const isStart = isPeriodStart(day.date);
              const isEnd = isPeriodEnd(day.date);

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    !day.isCurrentMonth && styles.dayCellInactive,
                    (isSelected || isStart || isEnd) && styles.dayCellSelected,
                    inPeriod && !isStart && !isEnd && styles.dayCellInPeriod,
                    day.isToday && styles.dayCellToday,
                  ]}
                  onPress={() => handleDayPress(day.date)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayText,
                      !day.isCurrentMonth && styles.dayTextInactive,
                      (isSelected || isStart || isEnd) && styles.dayTextSelected,
                      inPeriod && !isStart && !isEnd && styles.dayTextInPeriod,
                      day.isToday && styles.dayTextToday,
                    ]}
                  >
                    {day.date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Period Summary */}
          {selectionMode === 'period' && periodStart && (
            <View style={styles.periodSummary}>
              <Text style={styles.periodText}>
                {periodStart.toLocaleDateString('fr-FR')}
                {periodEnd ? ` → ${periodEnd.toLocaleDateString('fr-FR')}` : ' → ...'}
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.todayBtn} onPress={handleSelectToday}>
              <Text style={styles.todayBtnText}>Aujourd'hui</Text>
            </TouchableOpacity>

            {selectionMode === 'period' && periodStart && periodEnd && (
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmPeriod}>
                <Text style={styles.confirmBtnText}>Confirmer</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 4,
    marginBottom: Spacing.md,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: 10,
    gap: Spacing.xs,
  },
  modeBtnActive: {
    backgroundColor: Colors.primary,
  },
  modeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  modeBtnTextActive: {
    color: Colors.white,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  navBtn: {
    padding: Spacing.sm,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  daysHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  dayHeaderText: {
    width: DAY_WIDTH,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: DAY_WIDTH,
    height: DAY_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: DAY_WIDTH / 2,
  },
  dayCellInactive: {
    opacity: 0.3,
  },
  dayCellSelected: {
    backgroundColor: Colors.primary,
  },
  dayCellInPeriod: {
    backgroundColor: Colors.primary + '20',
    borderRadius: 0,
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  dayTextInactive: {
    color: Colors.textLight,
  },
  dayTextSelected: {
    color: Colors.white,
    fontWeight: '700',
  },
  dayTextInPeriod: {
    color: Colors.primary,
    fontWeight: '600',
  },
  dayTextToday: {
    color: Colors.primary,
    fontWeight: '700',
  },
  periodSummary: {
    backgroundColor: Colors.primary + '10',
    padding: Spacing.md,
    borderRadius: 12,
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  periodText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  todayBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  todayBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  confirmBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: 20,
    backgroundColor: Colors.primary,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
});
