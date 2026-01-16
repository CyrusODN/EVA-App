/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
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
} from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { Image } from 'react-native';
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
};

const Home = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<TabName>('patients');
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [showVisitDialog, setShowVisitDialog] = useState<boolean>(false);
  const [visitDialogType, setVisitDialogType] = useState<'patient' | 'meeting' | 'lecture'>('patient');
  const [events, setEvents] = useState<Session[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const resp = await getChatbotServiceToken();
        const raw = resp?.data;
        const payload = raw?.data || raw;
        const svcToken =
          payload?.token ||
          payload?.chatbotToken ||
          payload?.serviceToken;
        if (svcToken) {
          try {
            await AsyncStorage.setItem('chatbot_service_token', String(svcToken));
          } catch (_) { }
        }
      } catch (_) { }
    })();

    loadEvents();
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [])
  );

  const loadEvents = async () => {
    const allSessions = await sessionStorage.getAllSessions();
    setEvents(allSessions);
  };

  const filteredEvents: EventItem[] = events
    .filter((event: EventItem) => {
      if (activeTab === 'patients') return event.type === 'patient';
      if (activeTab === 'meetings') return event.type === 'meeting';
      if (activeTab === 'lectures') return event.type === 'lecture';
      return true;
    })
    .sort((a, b) => {
      // Sort by date in descending order (newest first)
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

  useEffect(() => {
    (async () => {
      try {
        const resp = await getChatbotServiceToken();
        const raw = resp?.data;
        const payload = raw?.data || raw;
        const svcToken =
          payload?.token ||
          payload?.chatbotToken ||
          payload?.serviceToken;
        if (svcToken) {
          try {
            await AsyncStorage.setItem('chatbot_service_token', String(svcToken));
          } catch (_) { }
        }
      } catch (_) { }
    })();
  }, []);

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
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
    switch (tabName) {
      case 'patients':
        return <Users size={16} color={focused ? 'white' : 'black'} />;
      case 'meetings':
        return <BookOpen size={16} color={focused ? 'white' : 'black'} />;
      case 'lectures':
        return <Video size={16} color={focused ? 'white' : 'black'} />;
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
        return <CheckCircle size={16} color="#10b981" />;
      case 'completed':
        return <CheckCircle size={16} color="#10b981" />;
      case 'recorded':
        return <Mic size={16} color="#f59e0b" />;
      case 'new':
        return <Upload size={16} color="#6b7280" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case 'transcribed':
        return '#10b981';
      case 'completed':
        return '#10b981';
      case 'recorded':
        return '#f59e0b';
      case 'new':
        return '#6b7280';
      default:
        return colors.onSurfaceVariant;
    }
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

  const renderEventItem = ({ item }: { item: EventItem }) => (
    <TouchableOpacity
      style={[
        styles.eventItem,
        { borderLeftColor: getStatusColor(item.status), borderLeftWidth: 4 },
      ]}
      onPress={() => handleEventPress(item)}
    >
      <View style={styles.eventHeader}>
        <View style={styles.eventTitleContainer}>
          <Text variant="titleMedium" style={textStyles.titleMedium}>
            {item.title}
          </Text>
          {getStatusIcon(item)}
        </View>
        <Text variant="bodySmall" style={styles.eventDate}>
          {formatEventDate(item.date)}
        </Text>
      </View>

      <View style={styles.eventDetails}>
        {item.duration && (
          <View style={styles.durationContainer}>
            <Clock size={12} color={colors.subText} />
            <Text variant="bodySmall" style={styles.durationText}>
              {item.duration}
            </Text>
          </View>
        )}

        <View style={styles.statusContainer}>
          <Text
            variant="bodySmall"
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status === 'completed' && 'Completed'}
            {item.status === 'transcribed' && 'Transcribed'}
            {item.status === 'recorded' && 'Recorded'}
            {item.status === 'new' && 'New Session'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
    return date.toLocaleDateString('en-US', {
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
    <View style={styles.calendarLegend}>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: '#53A0CD' }]} />
        <Text variant="bodySmall" style={styles.legendText}>
          {t('calendar.patientVisits')}
        </Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
        <Text variant="bodySmall" style={styles.legendText}>
          {t('calendar.meetings')}
        </Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: '#8b5cf6' }]} />
        <Text variant="bodySmall" style={styles.legendText}>
          {t('calendar.lectures')}
        </Text>
      </View>
    </View>
  );

  const renderCalendarView = () => {
    const calendarDays = getCalendarDays();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <View style={styles.calendarContainer}>
        {/* Month Navigation Header */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity
            onPress={() => navigateMonth('prev')}
            style={styles.monthNavButton}
          >
            <ChevronLeft size={24} color={colors.onSurface} />
          </TouchableOpacity>

          <View style={styles.monthYearContainer}>
            <Text
              variant="headlineLarge"
              numberOfLines={1}
            >
              {formatMonthYear(currentMonth)}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => navigateMonth('next')}
            style={styles.monthNavButton}
          >
            <ChevronRight size={24} color={colors.onSurface} />
          </TouchableOpacity>
        </View>

        {/* Week Days Header */}
        <View style={styles.weekDaysContainer}>
          {weekDays.map((day, index) => (
            <View key={index} style={styles.weekDay}>
              <Text variant="bodySmall" style={styles.weekDayText}>
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {calendarDays.map((date, index) => {
            const isSelected = date && isSameDay(date, selectedDate);
            const eventType = date ? getEventTypeForDate(date) : null;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.calendarDay,
                  isSelected && styles.calendarDaySelected,
                ]}
                onPress={() => date && setSelectedDate(date)}
                disabled={!date}
              >
                {date && (
                  <>
                    <Text
                      variant="bodyMedium"
                      style={[
                        styles.calendarDayText,
                        isSelected && styles.calendarDayTextSelected,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                    {eventType && (
                      <View
                        style={[
                          styles.eventIndicator,
                          {
                            backgroundColor:
                              eventType === 'patient'
                                ? '#53A0CD'
                                : eventType === 'meeting'
                                  ? '#10b981'
                                  : '#8b5cf6',
                          },
                        ]}
                      />
                    )}
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {renderCalendarLegend()}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Image
            source={images.logo}
            style={styles.logo}
            resizeMode="contain"
          />

          <TouchableOpacity
            style={styles.calendarButton}
            onPress={() => setShowCalendar(!showCalendar)}
          >
            <Calendar size={20} color={colors.primary} />
          </TouchableOpacity>
        </View> 

        {/* Search Section */}
        <View style={styles.searchSection}>
          <Search size={20} color={colors.onSurfaceVariant} />
          <TextInput
            placeholder={t('common.search')}
            style={styles.searchInput}
            placeholderTextColor="rgba(74, 69, 78, 0.5)"
            onChangeText={setSearchText}
            value={searchText}
          />
        </View>

        {/* Calendar or Tabs Section */}
        {showCalendar ? (
          renderCalendarView()
        ) : (
          <>
            {/* Tabs Section */}
            <View style={styles.tabsContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                {(['patients', 'meetings', 'lectures'] as TabName[]).map(tab => (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.tabButton,
                      activeTab === tab && styles.activeTabButton,
                    ]}
                    onPress={() => setActiveTab(tab)}
                  >
                    <LinearGradient
                      colors={
                        activeTab === tab
                          ? ['#53A0CD', '#44C2AD']
                          : ['transparent', 'transparent']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.tabGradient}
                    >
                      <View style={styles.tabContent}>
                        {getTabIcon(tab, activeTab === tab)}
                        <Text
                          variant="bodyMedium"
                          style={[
                            styles.tabText,
                            activeTab === tab && styles.activeTabText,
                          ]}
                        >
                          {t(`tabs.${tab}`)}
                        </Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* New Button Section */}
            <View style={styles.newButtonSection}>
              <PrimaryButton
                text={getNewButtonText()}
                onPress={handleNewButtonPress}
                iconComponent={Plus}
                width={wp(90)}
              />
            </View>

            {/* Content Section */}
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
          </>
        )}
      </ScrollView>

      {/* Visit Dialog Modal */}
      <VisitDialogModal
        visible={showVisitDialog}
        onClose={() => setShowVisitDialog(false)}
        visitType={visitDialogType}
        onCreateVisit={handleCreateVisit}
      />
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  logo: {
    width: wp(35),
    height: hp(4),
  },
  calendarButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.surfaceVariant,
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d4d4d4',
    borderRadius: 12,
    width: '90%',
    alignSelf: 'center',
    marginVertical: hp(1),
  },
  searchInput: {
    width: '100%',
    paddingHorizontal: wp(3),
  },
  calendarContainer: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
    paddingHorizontal: wp(2),
  },
  monthNavButton: {
    padding: wp(2),
    minWidth: 40,
  },
  monthYearContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(2),
  },
  monthYearText: {
    color: colors.onSurface,
    fontWeight: '600',
    fontSize: hp(2.5),
    textAlign: 'center',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(1),
    marginBottom: hp(1),
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    color: colors.onSurfaceVariant,
    fontSize: hp(1.5),
    fontWeight: '500',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: wp(1),
    marginBottom: hp(3),
  },
  calendarDay: {
    width: wp(12),
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(1),
    position: 'relative',
  },
  calendarDaySelected: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  calendarDayText: {
    color: colors.onSurface,
    fontSize: hp(1.8),
  },
  calendarDayTextSelected: {
    color: '#1976D2',
    fontWeight: '600',
  },
  eventIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: wp(2),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 10,
    marginRight: 6,
  },
  legendText: {
    color: colors.onSurfaceVariant,
  },
  tabsContainer: {
    marginVertical: hp(1),
    width: '90%',
    alignSelf: 'center',
  },
  tabButton: {
    borderRadius: 8,
    width: '30%',
    backgroundColor: '#f5f5f5',
  },
  activeTabButton: {},
  tabGradient: {
    borderRadius: 10,
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
    color: colors.onSurfaceVariant,
  },
  activeTabText: {
    color: 'white',
    fontWeight: '600',
  },
  newButtonSection: {
    paddingHorizontal: wp(5),
    marginVertical: hp(1),
    alignItems: 'center',
  },
  contentSection: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(5),
  },
  eventsList: {
    paddingVertical: hp(1),
  },
  eventItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: 12,
    marginBottom: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  eventTitle: {
    color: colors.onSurface,
    fontWeight: '500',
    marginRight: wp(2),
  },
  eventDate: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
  },
  eventDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    marginLeft: 6,
    color: colors.onSurfaceVariant,
    fontSize: 12,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(10),
  },
  emptyText: {
    color: colors.onSurfaceVariant,
    marginTop: hp(2),
    textAlign: 'center',
  },
});
