import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import {
  Search,
  Calendar,
  Users,
  BookOpen,
  Video,
  Clock,
  FileText,
  Mic,
  Upload,
  CheckCircle,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Copy,
  X,
  Edit2,
} from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { Image, Alert } from 'react-native';
import {
  Swipeable,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import PrimaryButton from '../../components/primaryButton';
import VisitDialogModal from '../../components/visitDialogueModal';
import { colors } from '../../constants/colors';
import { images } from '../../constants/images';
import { textStyles } from '../../constants/textStyles';
import EmptyState from '../../components/emptyState';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getChatbotServiceToken } from '../../services/authService';
import { sessionStorage, Session } from '../../utils/sessionStorage';
import { customToast } from '../../utils/toastMessage';
import { useTheme } from '../../constants/theme';
import RemedyLogoFull from '../../components/RemedyLogoFull';

type TabName = 'patients' | 'meetings' | 'lectures';
type EventStatus = 'new' | 'recorded' | 'transcribed' | 'completed';
type EventItem = {
  id: string;
  title: string;
  date: string;
  type: 'patient' | 'meeting' | 'lecture';
  duration: string | null;
  hasRecording: boolean;
  hasTranscription: boolean;
  status: EventStatus;
  generationMode?: 'standard' | 'custom';
  specializationLabel?: string;
  visitTypeLabel?: string;
  customTemplateTitle?: string;
};

const Home = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const { colors: themeColors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabName>('patients');
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [showVisitDialog, setShowVisitDialog] = useState<boolean>(false);
  const [visitDialogType, setVisitDialogType] = useState<
    'patient' | 'meeting' | 'lecture'
  >('patient');
  const [events, setEvents] = useState<Session[]>([]);
  const [selectionMode, setSelectionMode] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    (async () => {
      try {
        const resp = await getChatbotServiceToken();
        const raw = resp?.data;
        const payload = raw?.data || raw;
        const svcToken =
          payload?.token || payload?.chatbotToken || payload?.serviceToken;
        if (svcToken) {
          try {
            await AsyncStorage.setItem(
              'chatbot_service_token',
              String(svcToken),
            );
          } catch (_) {}
        }
      } catch (_) {}
    })();

    loadEvents();
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      loadEvents();
      // Scroll to hide search bar on mount/focus if user hasn't interacted
      // Using a small timeout to ensure layout is ready
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: hp(7.5), animated: false });
      }, 100);
    }, []),
  );

  const loadEvents = async () => {
    const allSessions = await sessionStorage.getAllSessions();
    setEvents(allSessions);
  };

  const filteredEvents: EventItem[] = events.filter((event: EventItem) => {
    if (activeTab === 'patients') return event.type === 'patient';
    if (activeTab === 'meetings') return event.type === 'meeting';
    if (activeTab === 'lectures') return event.type === 'lecture';
    return true;
  });

  useEffect(() => {
    (async () => {
      try {
        const resp = await getChatbotServiceToken();
        const raw = resp?.data;
        const payload = raw?.data || raw;
        const svcToken =
          payload?.token || payload?.chatbotToken || payload?.serviceToken;
        if (svcToken) {
          try {
            await AsyncStorage.setItem(
              'chatbot_service_token',
              String(svcToken),
            );
          } catch (_) {}
        }
      } catch (_) {}
    })();
  }, []);

  const formatEventDate = (dateString: string) => {
    const locale = i18n.language || 'en-US';
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
    });
  };

  const toSessionType = (tab: TabName): 'patient' | 'meeting' | 'lecture' => {
    switch (tab) {
      case 'patients':
        return 'patient';
      case 'meetings':
        return 'meeting';
      case 'lectures':
      default:
        return 'lecture';
    }
  };

  const getTabIcon = (tabName: TabName, focused: boolean): React.ReactNode => {
    const activeColor = themeColors.accentPrimary;
    const inactiveColor = isDark ? themeColors.textMuted : '#A6A6A6';
    
    switch (tabName) {
      case 'patients':
        return <Users size={16} color={focused ? activeColor : inactiveColor} />;
      case 'meetings':
        return <BookOpen size={16} color={focused ? activeColor : inactiveColor} />;
      case 'lectures':
        return <Video size={16} color={focused ? activeColor : inactiveColor} />;
      default:
        return null;
    }
  };

  const getNewButtonText = () => {
    switch (activeTab) {
      case 'patients':
        return t('buttons.newVisit');
      case 'meetings':
        return t('buttons.newMeeting');
      case 'lectures':
        return t('buttons.newLecture');
      default:
        return t('buttons.newVisit');
    }
  };

  const getStatusIcon = (event: EventItem): React.ReactNode => {
    switch (event.status) {
      case 'transcribed':
        return <CheckCircle size={16} color={themeColors.accentPrimary} />;
      case 'completed':
        return <CheckCircle size={16} color={isDark ? '#2D8B96' : '#2D8B96'} />;
      case 'recorded':
        return <Mic size={16} color={isDark ? '#86D4DE' : '#86D4DE'} />;
      case 'new':
        return <Upload size={16} color={isDark ? themeColors.textMuted : "#C7C7CC"} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case 'transcribed':
        return themeColors.accentPrimary; // Brand primary - light turquoise
      case 'completed':
        return '#2D8B96'; // Brand dark - deep turquoise
      case 'recorded':
        return '#86D4DE'; // Brand light - pale turquoise
      case 'new':
        return isDark ? themeColors.textMuted : '#C7C7CC'; // Neutral gray
      default:
        return themeColors.textSecondary;
    }
  };

  const getEventDescriptor = (event: EventItem) => {
    if (event.generationMode === 'custom' && event.customTemplateTitle) {
      return `Custom • ${event.customTemplateTitle}`;
    }
    if (event.generationMode === 'standard') {
      if (event.specializationLabel && event.visitTypeLabel) {
        return `${event.specializationLabel} • ${event.visitTypeLabel}`;
      }
      if (event.specializationLabel || event.visitTypeLabel) {
        return [event.specializationLabel, event.visitTypeLabel]
          .filter(Boolean)
          .join(' • ');
      }
    }
    return null;
  };

  const handleNewButtonPress = () => {
    setVisitDialogType(toSessionType(activeTab));
    setShowVisitDialog(true);
  };

  const handleCreateVisit = async (visitName: string) => {
    await sessionStorage.createSession(visitName, visitDialogType);
    setShowVisitDialog(false);

    // Refresh events list to show the new session
    await loadEvents();

    // Show toast notification
    customToast('success', t('common.success'), `${visitName} created`);
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedItems(new Set());
    if (selectionMode) {
      // Exiting selection mode
      setShowCalendar(false);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    if (
      selectedItems.size === filteredEvents.length &&
      filteredEvents.length > 0
    ) {
      // Deselect all
      setSelectedItems(new Set());
    } else {
      // Select all
      setSelectedItems(new Set(filteredEvents.map((e) => e.id)));
    }
  };

  const handleBulkDelete = () => {
    const count = selectedItems.size;
    Alert.alert(
      i18n.language === 'pl' ? 'Potwierdź usunięcie' : 'Confirm Delete',
      i18n.language === 'pl'
        ? `Czy na pewno chcesz usunąć ${count} ${
            count === 1 ? 'element' : count < 5 ? 'elementy' : 'elementów'
          }?`
        : `Are you sure you want to delete ${count} item${
            count === 1 ? '' : 's'
          }?`,
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            // Capture selected IDs before clearing
            const idsToDelete = Array.from(selectedItems);

            try {
              // Clear selection mode immediately for better UX
              setSelectionMode(false);
              setSelectedItems(new Set());

              // Delete all selected sessions in one operation (avoids race conditions)
              await sessionStorage.deleteSessions(idsToDelete);

              // Reload events to update UI
              await loadEvents();

              // Show success message
              customToast(
                'success',
                t('common.success'),
                i18n.language === 'pl'
                  ? `Usunięto ${count} ${
                      count === 1
                        ? 'element'
                        : count < 5
                        ? 'elementy'
                        : 'elementów'
                    }`
                  : `${count} item${count === 1 ? '' : 's'} deleted`,
              );
            } catch (error) {
              customToast(
                'error',
                t('common.error'),
                i18n.language === 'pl'
                  ? 'Nie udało się usunąć elementów'
                  : 'Failed to delete items',
              );
              // Re-enable selection mode on error
              setSelectionMode(true);
            }
          },
        },
      ],
    );
  };

  const handleLongPress = (itemId: string) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedItems(new Set([itemId]));
    }
  };

  const handleEventPress = (event: EventItem) => {
    if (event.status === 'transcribed' || event.status === 'completed') {
      navigation.navigate('transcriptionCompleted', {
        sessionData: event,
        sessionType: event.type,
      });
    } else {
      navigation.navigate('session', {
        sessionData: event,
        sessionType: event.type,
      });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await sessionStorage.deleteSession(eventId);
      await loadEvents();
      customToast('success', t('common.success'), 'Visit deleted');
    } catch (error) {
      customToast('error', t('common.error'), 'Failed to delete visit');
    }
  };

  const handleSearchSimilar = (eventTitle: string) => {
    setSearchText(eventTitle);
  };

  const renderRightActions = (eventId: string) => (
    <View style={styles.swipeActionsContainer}>
      <TouchableOpacity
        style={[styles.swipeActionDelete, { backgroundColor: themeColors.error }]}
        onPress={() => handleDeleteEvent(eventId)}
        activeOpacity={0.8}
      >
        <Trash2 size={20} color="#FFFFFF" strokeWidth={2} />
        <Text style={styles.swipeActionText}>{t('common.delete')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLeftActions = (eventTitle: string) => (
    <View style={styles.swipeActionsContainer}>
      <TouchableOpacity
        style={[styles.swipeActionSearch, { backgroundColor: themeColors.accentPrimary }]}
        onPress={() => handleSearchSimilar(eventTitle)}
        activeOpacity={0.8}
      >
        <Copy size={20} color="#FFFFFF" strokeWidth={2} />
        <Text style={styles.swipeActionText}>{t('actions.find')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSelectionBar = () => {
    if (!selectionMode) return null;

    const allSelected = selectedItems.size === filteredEvents.length && filteredEvents.length > 0;
    const hasSelection = selectedItems.size > 0;

    return (
      <View style={[styles.selectionBar, { 
        backgroundColor: isDark ? themeColors.layer2 : '#FFFFFF',
        borderBottomColor: isDark ? themeColors.borderSubtle : '#E2E8F0',
        shadowColor: isDark ? '#000' : '#000'
      }]}>
        <TouchableOpacity onPress={toggleSelectionMode}>
          <Text style={[styles.selectionBarCancel, { color: themeColors.accentPrimary }]}>{t('common.cancel')}</Text>
        </TouchableOpacity>

        <View style={styles.selectionBarCenter}>
          <Text style={[styles.selectionBarCount, { color: themeColors.textPrimary }]}>
            {selectedItems.size} {t('common.selected')}
          </Text>
        </View>

        <View style={styles.selectionBarActions}>
          {/* Show Select All/Deselect when nothing selected, Delete when items selected */}
          {!hasSelection ? (
            <TouchableOpacity onPress={selectAll}>
              <Text style={[styles.selectionBarActionText, { color: themeColors.accentPrimary }]}>
                {t('common.selectAll')}
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              {filteredEvents.length > 1 && (
                <TouchableOpacity onPress={selectAll}>
                  <Text style={[styles.selectionBarActionTextSecondary, { color: themeColors.accentPrimary }]}>
                    {allSelected ? t('common.deselectAll') : t('common.selectAll')}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleBulkDelete}
                style={[styles.deleteButton, { backgroundColor: themeColors.error }]}
              >
                <Trash2 size={16} strokeWidth={2} color={themeColors.textPrimary} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  const renderEventItem = ({ item }: { item: EventItem }) => {
    const eventDescriptor = getEventDescriptor(item);
    const isSelected = selectedItems.has(item.id);
    
    return (
      <Swipeable
        renderRightActions={() => selectionMode ? null : renderRightActions(item.id)}
        renderLeftActions={() => selectionMode ? null : renderLeftActions(item.title)}
        overshootRight={false}
        overshootLeft={false}
        friction={4}
        leftThreshold={80}
        rightThreshold={80}
        enabled={!selectionMode}
        enableTrackpadTwoFingerGesture={false}
        hitSlop={{ top: 0, bottom: 0, left: -50, right: -50 }}
      >
        <TouchableOpacity
          style={[
            styles.eventItem,
            { backgroundColor: isDark ? themeColors.layer2 : '#FFFFFF', shadowColor: themeColors.shadowColor },
            isSelected && [styles.eventItemSelected, { backgroundColor: isDark ? 'rgba(70, 183, 198, 0.1)' : '#F0F9FA', borderColor: themeColors.accentPrimary }]
          ]}
          onPress={() => {
            if (selectionMode) {
              toggleItemSelection(item.id);
            } else {
              handleEventPress(item);
            }
          }}
          onLongPress={() => handleLongPress(item.id)}
          delayLongPress={400}
          activeOpacity={0.7}
        >
        <View style={styles.eventRow}>
          {/* Checkbox in selection mode */}
          {selectionMode && (
            <View style={styles.checkboxContainer}>
              <View style={[
                styles.checkbox,
                { backgroundColor: isDark ? 'transparent' : '#FFFFFF', borderColor: isDark ? themeColors.borderStrong : '#CBD5E1' },
                isSelected && [styles.checkboxSelected, { backgroundColor: isDark ? 'transparent' : '#F0F9FA', borderColor: themeColors.accentPrimary }]
              ]}>
                {isSelected && (
                  <CheckCircle size={20} color={themeColors.accentPrimary} fill={themeColors.accentPrimary} />
                )}
              </View>
            </View>
          )}

          {/* Left: Title + Date/Duration */}
          <View style={styles.eventLeftContent}>
            <Text variant="titleMedium" style={[styles.eventTitle, { color: themeColors.textPrimary }]}>
              {item.title}
            </Text>
            <View style={styles.eventMetaRow}>
              <Text variant="bodySmall" style={[styles.eventDate, { color: themeColors.textSecondary }]}>
                {formatEventDate(item.date)}
              </Text>
              {item.duration && (
                <>
                  <Text style={[styles.metaSeparator, { color: isDark ? themeColors.borderStrong : '#CBD5E1' }]}> · </Text>
                  <Text variant="bodySmall" style={[styles.durationText, { color: themeColors.textSecondary }]}>
                    {item.duration}
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Right: Status indicator */}
          {!selectionMode && (
            <View style={styles.eventRightContent}>
              <View style={[
                styles.statusBadge,
                item.status === 'completed' && [styles.statusBadgeCompleted, { backgroundColor: isDark ? 'rgba(45, 139, 150, 0.2)' : 'rgba(45, 139, 150, 0.1)' }],
                item.status === 'transcribed' && [styles.statusBadgeTranscribed, { backgroundColor: isDark ? 'rgba(70, 183, 198, 0.2)' : 'rgba(70, 183, 198, 0.1)' }],
                item.status === 'recorded' && [styles.statusBadgeRecorded, { backgroundColor: isDark ? 'rgba(122, 203, 214, 0.2)' : 'rgba(122, 203, 214, 0.1)' }],
                item.status === 'new' && [styles.statusBadgeNew, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(148, 163, 184, 0.08)' }],
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: getStatusColor(item.status) }
                ]}>
                {eventDescriptor ||
                  (item.status === 'completed' && t('status.completed')) ||
                  (item.status === 'transcribed' && t('status.transcribed')) ||
                  (item.status === 'recorded' && t('status.recorded')) ||
                  (item.status === 'new' && t('status.new'))}
                </Text>
              </View>
            </View>
          )}
        </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentMonth(newDate);
  };

  const formatMonthYear = (date: Date) => {
    const locale = i18n.language || 'en-US';
    return date.toLocaleDateString(locale, {
      month: 'long',
      year: 'numeric',
    });
  };

  const isSameDay = (date1: Date | null, date2: Date | null) => {
    if (!date1 || !date2) return false;
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const getEventTypeForDate = (date: Date | null) => {
    if (!date) return null;
    const dateString = date.toISOString().split('T')[0];
    const event = events.find((e: EventItem) => {
      const eventDate = new Date(e.date).toISOString().split('T')[0];
      return eventDate === dateString;
    });
    return event ? event.type : null;
  };

  const renderCalendarLegend = () => (
    <View style={[styles.calendarLegend, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC' }]}>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: '#46B7C6' }]} />
        <Text variant="bodySmall" style={[styles.legendText, { color: themeColors.textSecondary }]}>
          {t('calendar.patientVisits')}
        </Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: '#7C3AED' }]} />
        <Text variant="bodySmall" style={[styles.legendText, { color: themeColors.textSecondary }]}>
          {t('calendar.meetings')}
        </Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: '#FB923C' }]} />
        <Text variant="bodySmall" style={[styles.legendText, { color: themeColors.textSecondary }]}>
          {t('calendar.lectures')}
        </Text>
      </View>
    </View>
  );

  const renderCalendarView = () => {
    const calendarDays = getCalendarDays();
    const weekDays = [
      t('calendar.weekDays.sun'),
      t('calendar.weekDays.mon'),
      t('calendar.weekDays.tue'),
      t('calendar.weekDays.wed'),
      t('calendar.weekDays.thu'),
      t('calendar.weekDays.fri'),
      t('calendar.weekDays.sat')
    ];
    const today = new Date();
    const isToday = (date: Date | null) => {
      if (!date) return false;
      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    };

    return (
      <View style={[styles.calendarContainer, { backgroundColor: isDark ? themeColors.layer2 : '#FFFFFF', shadowColor: themeColors.shadowColor }]}>
        {/* Month Navigation Header - Premium Style */}
        <View style={styles.calendarHeader}>
          <View style={styles.monthYearContainer}>
            <Text style={[styles.monthYearText, { color: themeColors.textPrimary }]}>
              {formatMonthYear(currentMonth)}
            </Text>
          </View>
          
          <View style={styles.monthNavButtons}>
            <TouchableOpacity
              onPress={() => navigateMonth('prev')}
              style={[styles.monthNavButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC' }]}
              activeOpacity={0.6}
            >
              <ChevronLeft size={20} color={isDark ? themeColors.textSecondary : "#64748B"} strokeWidth={2} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigateMonth('next')}
              style={[styles.monthNavButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC' }]}
              activeOpacity={0.6}
            >
              <ChevronRight size={20} color={isDark ? themeColors.textSecondary : "#64748B"} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Week Days Header - Minimal */}
        <View style={styles.weekDaysContainer}>
          {weekDays.map((day, index) => (
            <View key={index} style={styles.weekDay}>
              <Text style={[styles.weekDayText, { color: themeColors.textMuted }]}>
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid - Clean & Spacious */}
        <View style={styles.calendarGrid}>
          {calendarDays.map((date, index) => {
            const isSelected = date && isSameDay(date, selectedDate);
            const isTodayDate = date && isToday(date);
            const eventType = date ? getEventTypeForDate(date) : null;
            const hasEvent = !!eventType;

            // Event background colors (subtle)
            const getEventBackground = () => {
              if (isSelected) return undefined;
              if (!hasEvent) return undefined;
              return eventType === 'patient'
                ? (isDark ? 'rgba(70, 183, 198, 0.15)' : 'rgba(70, 183, 198, 0.08)')
                : eventType === 'meeting'
                ? (isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.08)')
                : (isDark ? 'rgba(251, 146, 60, 0.15)' : 'rgba(251, 146, 60, 0.08)');
            };

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.calendarDay,
                  hasEvent && !isSelected && { backgroundColor: getEventBackground() },
                  isSelected && [styles.calendarDaySelected, { backgroundColor: themeColors.accentPrimary }],
                  isTodayDate && !isSelected && [styles.calendarDayToday, { backgroundColor: isDark ? 'rgba(70, 183, 198, 0.1)' : '#F0F9FA', borderColor: themeColors.accentPrimary }],
                ]}
                onPress={() => date && setSelectedDate(date)}
                disabled={!date}
                activeOpacity={0.7}
              >
                {date && (
                  <View style={styles.calendarDayContent}>
                    <Text
                      style={[
                        styles.calendarDayText,
                        { color: themeColors.textPrimary },
                        isSelected && [styles.calendarDayTextSelected, { color: isDark ? '#000' : '#FFFFFF' }],
                        isTodayDate && !isSelected && [styles.calendarDayTextToday, { color: themeColors.accentPrimary }],
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {renderCalendarLegend()}

        {/* Events for Selected Date */}
        {selectedDate && (
          <View style={[styles.selectedDateEvents, { borderTopColor: isDark ? themeColors.borderSubtle : '#F1F5F9' }]}>
            <Text style={[styles.selectedDateTitle, { color: themeColors.textPrimary }]}>
              {selectedDate.toLocaleDateString(i18n.language || 'en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
            <View style={styles.selectedDateEventsList}>
              {events
                .filter(event => {
                  const eventDate = new Date(event.date).toISOString().split('T')[0];
                  const selDate = selectedDate.toISOString().split('T')[0];
                  return eventDate === selDate;
                })
                .map(event => (
                  <TouchableOpacity
                    key={event.id}
                    style={[styles.calendarEventItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC' }]}
                    onPress={() => handleEventPress(event)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.calendarEventDot,
                      {
                        backgroundColor:
                          event.type === 'patient'
                            ? '#46B7C6'
                            : event.type === 'meeting'
                            ? '#7C3AED'
                            : '#FB923C',
                      },
                    ]} />
                    <Text style={[styles.calendarEventTitle, { color: themeColors.textPrimary }]}>{event.title}</Text>
                    {event.duration && (
                      <Text style={[styles.calendarEventTime, { color: themeColors.textSecondary }]}>{event.duration}</Text>
                    )}
                  </TouchableOpacity>
                ))}
            {events.filter(event => {
                const eventDate = new Date(event.date).toISOString().split('T')[0];
                const selDate = selectedDate.toISOString().split('T')[0];
                return eventDate === selDate;
              }).length === 0 && (
                <Text style={[styles.noEventsText, { color: themeColors.textMuted }]}>{t('calendar.noEventsOnDay')}</Text>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.mainContainer, { backgroundColor: themeColors.canvas }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.canvas} />
        <SafeAreaView style={[styles.container, { backgroundColor: themeColors.canvas }]}>
          {/* Header Section */}
          <View style={[styles.header, { backgroundColor: themeColors.canvas }]}>
            <View style={styles.headerLeft}>
              <RemedyLogoFull width={wp(40)} height={hp(4.5)} />
              <View style={[styles.headerSeparator, { backgroundColor: isDark ? themeColors.borderNormal : '#D1D1D6' }]} />
              <Text variant="headlineLarge" style={[styles.mioText, { color: themeColors.textPrimary }]}>
                EVA
              </Text>
            </View>

            <View style={styles.headerActions}>
              {!showCalendar && (
                <TouchableOpacity
                  style={[styles.headerButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC' }]}
                  onPress={toggleSelectionMode}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Edit2 
                    size={22} 
                    color={selectionMode ? themeColors.error : themeColors.accentPrimary} 
                    strokeWidth={1.5} 
                  />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC' }]}
                onPress={() => {
                  setShowCalendar(!showCalendar);
                  if (selectionMode) {
                    toggleSelectionMode();
                  }
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showCalendar ? (
                  <X size={22} color={themeColors.accentPrimary} strokeWidth={2} />
                ) : (
                  <Calendar size={22} color={themeColors.accentPrimary} strokeWidth={1.5} />
                )}
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.headerDivider, { backgroundColor: isDark ? themeColors.borderSubtle : '#E2E8F0' }]} />

          {/* Sticky Tabs Section (outside ScrollView) */}
          {!showCalendar && (
            <View style={[styles.stickyTabsWrapper, { backgroundColor: themeColors.canvas }]}>
              <View style={styles.tabsContainer}>
                <View style={styles.tabsRow}>
                  {(['patients', 'meetings', 'lectures'] as TabName[]).map(tab => (
                    <TouchableOpacity
                      key={tab}
                      style={[
                        styles.tabButton,
                        activeTab === tab && [styles.activeTabButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF', shadowColor: themeColors.shadowColor }],
                      ]}
                      onPress={() => setActiveTab(tab)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.tabContent}>
                        {getTabIcon(tab, activeTab === tab)}
                        <Text
                          variant="bodyMedium"
                          style={[
                            styles.tabText,
                            { color: activeTab === tab ? themeColors.accentPrimary : (isDark ? themeColors.textMuted : '#94A3B8') },
                            activeTab === tab && styles.activeTabText,
                          ]}
                        >
                          {t(`tabs.${tab}`)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingView}
          >
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentOffset={{ x: 0, y: hp(7.5) }} // Hide search bar by default (Search Height + Margins)
            >
          {/* Search Section */}
          <View style={[styles.searchSection, { 
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
            borderColor: isDark ? themeColors.borderSubtle : '#E2E8F0'
          }]}>
            <Search size={18} color={themeColors.textMuted} />
            <TextInput
              placeholder={t('common.search')}
              style={[styles.searchInput, { color: themeColors.textPrimary }]}
              placeholderTextColor={themeColors.textMuted}
              onChangeText={setSearchText}
              value={searchText}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Selection Bar - appears in selection mode */}
          {renderSelectionBar()}

          {/* Calendar or Content Section */}
          {showCalendar ? (
            renderCalendarView()
          ) : (
            <View style={styles.contentSection}>
              {filteredEvents.length > 0 ? (
                <FlatList
                  data={filteredEvents}
                  renderItem={renderEventItem}
                  keyExtractor={item => item.id}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.eventsList}
                />
              ) : (
                <EmptyState
                  icon={FileText}
                  iconSize={48}
                  iconColor={colors.surfaceDisabled}
                  message={t('messages.noRecords')}
                />
              )}
            </View>
          )}
            </ScrollView>
          </KeyboardAvoidingView>

          {/* Fixed Floating Action Button - Outside ScrollView */}
          {!showCalendar && (
            <View style={styles.fabContainer}>
              <TouchableOpacity
                style={styles.fab}
                onPress={handleNewButtonPress}
                activeOpacity={0.85}
              >
                <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          )}

          {/* Visit Dialog Modal */}
          <VisitDialogModal
            visible={showVisitDialog}
            onClose={() => setShowVisitDialog(false)}
            visitType={visitDialogType}
            onCreateVisit={handleCreateVisit}
          />
        </SafeAreaView>
      </View>
    </GestureHandlerRootView>
  );
};

export default Home;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: hp(20), // Ensure enough space to scroll search bar out of view
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2.5),
    backgroundColor: '#F8FAFC',
    marginBottom: 0,
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: wp(5),
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSeparator: {
    width: 1,
    height: 24,
    backgroundColor: '#D1D1D6',
    marginHorizontal: wp(3.5),
  },
  mioText: {
    fontSize: 20,
    lineHeight: 25,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Light' : 'sans-serif-light',
    fontWeight: '300',
    letterSpacing: 6, // Proportional to smaller font size (20 vs 40 on login)
  },
  logo: {
    width: wp(40),
    height: hp(4.5),
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    padding: 8,
    borderRadius: 10,
    borderWidth: 0,
    backgroundColor: '#F8FAFC',
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    width: '90%',
    alignSelf: 'center',
    marginTop: hp(1.5),
    marginBottom: hp(1),
    backgroundColor: '#FFFFFF',
    height: hp(5),
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: wp(3),
    fontSize: 15,
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
    letterSpacing: -0.2,
  },
  calendarContainer: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    backgroundColor: '#FFFFFF',
    marginHorizontal: wp(4),
    marginTop: hp(1),
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2.5),
    paddingHorizontal: wp(2),
  },
  monthNavButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthNavButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearContainer: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  monthYearText: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontSize: 22,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'System',
    letterSpacing: -0.6,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(1),
    marginBottom: hp(1.5),
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
    letterSpacing: 0.5,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: wp(0.5),
    marginBottom: hp(2),
  },
  calendarDay: {
    width: wp(11.5),
    height: wp(11.5),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(1),
    borderRadius: 12,
    position: 'relative',
  },
  calendarDayContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDaySelected: {
    backgroundColor: '#46B7C6',
  },
  calendarDayToday: {
    backgroundColor: '#F0F9FA',
    borderWidth: 1,
    borderColor: '#46B7C6',
  },
  calendarDayText: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'System',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Bold' : 'System',
  },
  calendarDayTextToday: {
    color: '#46B7C6',
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Bold' : 'System',
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: wp(2),
    paddingVertical: hp(1.5),
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    marginTop: hp(1),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'System',
  },

  // Selected Date Events Section
  selectedDateEvents: {
    marginTop: hp(2),
    paddingTop: hp(2),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  selectedDateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: hp(1.5),
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  selectedDateEventsList: {
    gap: 8,
  },
  calendarEventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    gap: 10,
  },
  calendarEventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  calendarEventTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'System',
  },
  calendarEventTime: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  noEventsText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: hp(2),
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  tabsContainer: {
    marginTop: hp(1),
    marginBottom: 0,
    width: '90%',
    alignSelf: 'center',
  },
  stickyTabsWrapper: {
    backgroundColor: '#F8FAFC',
    zIndex: 10,
    paddingBottom: hp(1),
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabButton: {
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  tabContent: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    marginLeft: 6,
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'System',
    letterSpacing: -0.2,
  },
  activeTabText: {
    color: '#46B7C6',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  contentSection: {
    paddingHorizontal: 0,
    paddingTop: hp(0.5),
    paddingBottom: hp(5),
  },
  eventsList: {
    paddingVertical: 0,
  },
  eventItem: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: wp(5),
    minHeight: 64,
    marginHorizontal: wp(4),
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  eventRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventLeftContent: {
    flex: 1,
    marginRight: wp(3),
  },
  eventTitle: {
    color: '#1A1A1A',
    fontWeight: '600',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventDate: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  metaSeparator: {
    color: '#CBD5E1',
    fontSize: 12,
    marginHorizontal: 4,
  },
  durationText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  eventRightContent: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  // New Status Badge Styles - Linear Style (Subtle)
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeCompleted: {
    backgroundColor: 'rgba(45, 139, 150, 0.1)',
  },
  statusBadgeTranscribed: {
    backgroundColor: 'rgba(70, 183, 198, 0.1)',
  },
  statusBadgeRecorded: {
    backgroundColor: 'rgba(122, 203, 214, 0.1)',
  },
  statusBadgeNew: {
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'System',
    letterSpacing: -0.1,
  },
  statusTextCompleted: {
    color: '#2D8B96',
  },
  statusTextTranscribed: {
    color: '#46B7C6',
  },
  statusTextRecorded: {
    color: '#5CB3C1',
  },
  statusTextNew: {
    color: '#64748B',
  },

  // Old styles kept for compatibility
  statusBadgeCompact: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusTextCompact: {
    fontSize: 12,
    color: '#86868b',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },

  // Floating Action Button - Circular (Things 3 Premium)
  fabContainer: {
    position: 'absolute',
    bottom: hp(14),
    right: wp(6),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
  },
  fab: {
    backgroundColor: '#46B7C6',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#46B7C6',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Light' : 'System',
    lineHeight: 32,
  },

  // Swipe Actions - Premium Style
  swipeActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginVertical: 4,
  },
  swipeActionDelete: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    marginRight: wp(4),
  },
  swipeActionSearch: {
    backgroundColor: '#46B7C6',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    marginLeft: wp(4),
  },
  swipeActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },

  // Selection Mode Styles
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.2),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginTop: hp(1),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  selectionBarCancel: {
    color: '#46B7C6',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  selectionBarCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: wp(2),
  },
  selectionBarCount: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'System',
  },
  selectionBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectionBarActionText: {
    color: '#46B7C6',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  selectionBarActionTextSecondary: {
    color: '#46B7C6',
    fontSize: 13,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'System',
  },
  selectionBarButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  selectionBarButtonText: {
    color: '#46B7C6',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EF4444',
  },
  deleteButtonDisabled: {
    backgroundColor: '#CBD5E1',
    opacity: 0.5,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  checkboxContainer: {
    marginRight: 12,
    justifyContent: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSelected: {
    borderColor: '#46B7C6',
    backgroundColor: '#F0F9FA',
  },
  eventItemSelected: {
    backgroundColor: '#F0F9FA',
    borderWidth: 1,
    borderColor: '#46B7C6',
  },
});
