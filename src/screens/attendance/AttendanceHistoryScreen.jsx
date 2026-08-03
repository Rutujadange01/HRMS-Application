import React, { useContext, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { HRMSContext } from '../../context/HRMSContext';
import { AuthContext } from '../../context/AuthContext';
import { AttendanceBadge } from '../../components/AttendanceBadge';
import { COLORS } from '../../constants/theme';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, PieChart, ArrowLeft } from 'lucide-react-native';

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const parseWorkHrsToMinutes = (log) => {
  if (log.workHrs && typeof log.workHrs === 'string' && log.workHrs !== 'In Progress' && log.workHrs !== '0 hrs') {
    const hrsMatch = log.workHrs.match(/(\d+)\s*hrs?/i);
    const minsMatch = log.workHrs.match(/(\d+)\s*mins?/i);
    let h = hrsMatch ? parseInt(hrsMatch[1], 10) : 0;
    let m = minsMatch ? parseInt(minsMatch[1], 10) : 0;
    if (h > 0 || m > 0) return h * 60 + m;
  }

  const cIn = log.clockIn && log.clockIn !== '--:--' ? log.clockIn : (log.Type === 'In' ? log.Time : null);
  const cOut = log.clockOut && log.clockOut !== '--:--' ? log.clockOut : (log.Type === 'Out' ? log.Time : null);

  if (cIn && cOut && cIn !== cOut) {
    try {
      const parse = (tStr) => {
        const isPM = /PM/i.test(tStr);
        const isAM = /AM/i.test(tStr);
        const clean = tStr.replace(/(AM|PM)/i, '').trim();
        const parts = clean.split(':');
        let hour = parseInt(parts[0], 10) || 0;
        const minute = parseInt(parts[1], 10) || 0;
        if (isPM && hour < 12) hour += 12;
        if (isAM && hour === 12) hour = 0;
        return hour * 60 + minute;
      };
      const diff = parse(cOut) - parse(cIn);
      return diff > 0 ? diff : 0;
    } catch (e) {
      return 0;
    }
  }
  return 0;
};

const calculateWorkHours = (inTimeStr, outTimeStr) => {
  if (!inTimeStr || inTimeStr === '--:--' || !outTimeStr || outTimeStr === '--:--') {
    return 'In Progress';
  }
  try {
    const parse = (tStr) => {
      const isPM = /PM/i.test(tStr);
      const isAM = /AM/i.test(tStr);
      const clean = tStr.replace(/(AM|PM)/i, '').trim();
      const parts = clean.split(':');
      let h = parseInt(parts[0], 10) || 0;
      const m = parseInt(parts[1], 10) || 0;
      if (isPM && h < 12) h += 12;
      if (isAM && h === 12) h = 0;
      return h * 60 + m;
    };
    const inMins = parse(inTimeStr);
    const outMins = parse(outTimeStr);
    let diff = outMins - inMins;
    if (diff < 0) diff += 24 * 60;
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hrs} hrs ${mins} mins`;
  } catch (e) {
    return '8 hrs 00 mins';
  }
};

export const AttendanceHistoryScreen = ({ navigation }) => {
  const { profile, user } = useContext(AuthContext);
  const { attendanceLogs, leaves } = useContext(HRMSContext);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [monthIndex, setMonthIndex] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  const currentMonthTitle = `${MONTH_NAMES[monthIndex]} ${year}`;

  const handlePrevMonth = () => {
    if (monthIndex === 0) {
      setMonthIndex(11);
      setYear(prev => prev - 1);
    } else {
      setMonthIndex(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (monthIndex === 11) {
      setMonthIndex(0);
      setYear(prev => prev + 1);
    } else {
      setMonthIndex(prev => prev + 1);
    }
  };

  // Filter logs exclusively for current logged-in user
  const userAttendanceLogs = useMemo(() => {
    if (!attendanceLogs || attendanceLogs.length === 0) return [];
    
    return attendanceLogs.filter(log => {
      const logUserId = (log.UserID || log.employeeId || '').trim().toLowerCase();
      const logUserName = (log.UserName || log.employeeName || '').trim().toLowerCase();
      const logEmail = (log.email || log.Email || '').trim().toLowerCase();

      const profUid = (profile?.uid || profile?.UserID || profile?.id || user?.uid || user?.id || '').trim().toLowerCase();
      const profName = (profile?.name || profile?.FullName || user?.displayName || '').trim().toLowerCase();
      const profEmail = (profile?.email || profile?.Email || '').trim().toLowerCase();
      const profUser = (profile?.username || profile?.Username || '').trim().toLowerCase();

      const isUidMatch = profUid && logUserId && logUserId === profUid;
      const isNameMatch = profName && logUserName && logUserName === profName;
      const isEmailMatch = profEmail && logEmail && logEmail === profEmail;
      const isUsernameMatch = profUser && logUserId && logUserId.includes(profUser);

      return isUidMatch || isNameMatch || isEmailMatch || isUsernameMatch;
    });
  }, [attendanceLogs, profile, user]);

  // Generate calendar grid strictly reflecting real Firebase data per day
  const calendarGrid = useMemo(() => {
    const totalDays = new Date(year, monthIndex + 1, 0).getDate();
    const firstDayIndex = new Date(year, monthIndex, 1).getDay(); // 0 = Sunday
    const prevMonthDays = new Date(year, monthIndex, 0).getDate();

    const days = [];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Current month days calculation
    for (let d = 1; d <= totalDays; d++) {
      const monthStr = String(monthIndex + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateKey = `${year}-${monthStr}-${dayStr}`;

      const dateObj = new Date(year, monthIndex, d);
      const isSunday = dateObj.getDay() === 0;

      // Find real logged-in user attendance records in Firebase for dateKey
      const dayLogs = userAttendanceLogs.filter(l => {
        const lDate = l.date || l.PostingDate || (l.CreatedOn ? l.CreatedOn.split('T')[0] : '');
        return lDate === dateKey;
      });

      // Find leave record in Firebase for dateKey
      const leave = (leaves || []).find(l => {
        const isUserMatch = (profile?.uid && (l.userId === profile.uid || l.UserID === profile.uid)) ||
                            (profile?.name && (l.employeeName === profile.name || l.FullName === profile.name));
        return isUserMatch && l.appliedOn === dateKey && l.status === 'Approved';
      });

      let status = 'No Punch';
      let dotColor = null;
      let bg = 'transparent';
      let clockIn = '--:--';
      let clockOut = '--:--';
      let workHrs = '0 hrs';
      let location = 'No Record';
      let method = 'No Punch Record Found';
      let hasRealFirebaseLog = false;

      if (dayLogs.length > 0) {
        // REAL FIREBASE ATTENDANCE PUNCH FOUND (FIFO Pairing)
        hasRealFirebaseLog = true;
        
        // Sort dayLogs chronologically by CreatedOn or Time
        const sortedLogs = [...dayLogs].sort((a, b) => {
          const timeA = a.CreatedOn || `${a.date || a.PostingDate} ${a.Time || '00:00'}`;
          const timeB = b.CreatedOn || `${b.date || b.PostingDate} ${b.Time || '00:00'}`;
          return timeA.localeCompare(timeB);
        });

        const mainLog = sortedLogs[sortedLogs.length - 1];

        // Earliest IN log (FIFO First-In)
        const inLog = sortedLogs.find(l => (l.clockIn && l.clockIn !== '--:--') || l.Type === 'In' || l.type === 'in') || sortedLogs[0];
        
        // Latest OUT log (FIFO Last-Out)
        const outLog = sortedLogs.slice().reverse().find(l => (l.clockOut && l.clockOut !== '--:--') || l.Type === 'Out' || l.type === 'out') || mainLog;

        clockIn = inLog.clockIn && inLog.clockIn !== '--:--' ? inLog.clockIn : (inLog.Time || '--:--');
        
        if (outLog.clockOut && outLog.clockOut !== '--:--') {
          clockOut = outLog.clockOut;
        } else if ((outLog.Type === 'Out' || outLog.type === 'out') && outLog.Time && outLog.Time !== clockIn) {
          clockOut = outLog.Time;
        } else {
          clockOut = '--:--';
        }

        // Calculate total work hours across all sessions for the day by summing each row document
        let totalMins = 0;
        let hasOpenSession = false;

        sortedLogs.forEach(l => {
          const mins = parseWorkHrsToMinutes(l);
          totalMins += mins;
          if (!l.clockOut || l.clockOut === '--:--') {
            hasOpenSession = true;
          }
        });

        if (totalMins > 0) {
          const hrs = Math.floor(totalMins / 60);
          const mins = totalMins % 60;
          workHrs = `${hrs} hrs ${mins} mins` + (hasOpenSession ? ' (In Progress)' : '');
        } else if (hasOpenSession) {
          workHrs = 'In Progress';
        } else if (clockIn !== '--:--' && clockOut !== '--:--') {
          workHrs = calculateWorkHours(clockIn, clockOut);
        } else {
          workHrs = mainLog.workHrs || 'In Progress';
        }

        if (isSunday) {
          status = 'Present (Week Off)';
        } else {
          status = mainLog.status || 'Present';
        }

        dotColor = status.toLowerCase().includes('late') ? '#f97316' : '#22c55e';
        bg = status.toLowerCase().includes('late') ? '#fff7ed' : '#f0fdf4';
        location = mainLog.Location || mainLog.location || inLog.Location || 'Office HQ';
        method = mainLog.notes || mainLog.method || 'Mobile Punch';
      } else if (leave) {
        status = 'On Leave';
        dotColor = '#a855f7';
        bg = '#faf5ff';
        method = `Approved Leave (${leave.type || 'Casual'})`;
      } else if (isSunday) {
        status = 'Week Off / Off Duty';
        dotColor = null;
        bg = 'transparent';
        method = 'Weekly Off (Sunday)';
      } else if (dateKey > todayStr) {
        status = 'Upcoming';
        dotColor = null;
        bg = 'transparent';
        method = 'Upcoming Date';
      } else {
        // NO PUNCH FOR THIS DATE
        status = 'No Punch';
        dotColor = null;
        bg = 'transparent';
        method = 'No Punch Record Found';
      }

      days.push({
        day: d,
        dateKey,
        isCurrentMonth: true,
        status,
        dotColor,
        bg,
        clockIn,
        clockOut,
        workHrs,
        location,
        method,
        hasRealFirebaseLog
      });
    }

    // Trailing month padding days
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        day: i,
        isCurrentMonth: false
      });
    }

    return days;
  }, [year, monthIndex, userAttendanceLogs, leaves, profile]);

  // Dynamic monthly stats reflecting ONLY real Firebase records
  const monthlyStats = useMemo(() => {
    const currentMonthDays = calendarGrid.filter(d => d.isCurrentMonth);
    const firebasePunchesCount = currentMonthDays.filter(d => d.hasRealFirebaseLog).length;
    const noPunchCount = currentMonthDays.filter(d => d.status === 'No Punch').length;
    const weekOffCount = currentMonthDays.filter(d => d.status === 'Week Off' || d.status === 'On Leave').length;

    return {
      total: currentMonthDays.length,
      realPunches: firebasePunchesCount,
      noPunch: noPunchCount,
      weekOffs: weekOffCount
    };
  }, [calendarGrid]);

  const selectedDetails = useMemo(() => {
    return calendarGrid.find(d => d.isCurrentMonth && d.day === selectedDay);
  }, [calendarGrid, selectedDay]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Banner */}
      <View style={styles.calendarBanner}>
        <View style={styles.bannerNavRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.bannerTitle}>My Attendance History</Text>
              <Text style={styles.bannerSub}>{profile?.name || 'Logged-In User'} • {currentMonthTitle}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.bannerCalendarIconBox}>
            <CalendarIcon size={20} color="#ff6b81" />
          </View>
        </View>
      </View>

      {/* Empty Records Alert Banner */}
      {userAttendanceLogs.length === 0 && (
        <View style={styles.emptyFirebaseCard}>
          <Text style={styles.emptyFirebaseText}>
            ℹ️ Attendance history is currently empty. Clock-in from app to record live attendance logs.
          </Text>
        </View>
      )}

      {/* Dynamic Month Selector Controls */}
      <View style={styles.monthControlRow}>
        <TouchableOpacity style={styles.monthArrowBtn} onPress={handlePrevMonth}>
          <ChevronLeft size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
        
        <Text style={styles.monthTitleText}>{currentMonthTitle}</Text>

        <TouchableOpacity style={styles.monthArrowBtn} onPress={handleNextMonth}>
          <ChevronRight size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Calendar Card Grid */}
      <View style={styles.calendarCard}>
        {/* Weekday Header Row */}
        <View style={styles.weekdayRow}>
          <Text style={[styles.weekdayText, { color: '#ff6b81' }]}>S</Text>
          <Text style={styles.weekdayText}>M</Text>
          <Text style={styles.weekdayText}>T</Text>
          <Text style={styles.weekdayText}>W</Text>
          <Text style={styles.weekdayText}>T</Text>
          <Text style={styles.weekdayText}>F</Text>
          <Text style={[styles.weekdayText, { color: '#0284c7' }]}>S</Text>
        </View>

        {/* Calendar Days Grid */}
        <View style={styles.daysGrid}>
          {calendarGrid.map((item, idx) => {
            const isSelected = item.isCurrentMonth && item.day === selectedDay;

            return (
              <TouchableOpacity
                key={idx}
                disabled={!item.isCurrentMonth}
                onPress={() => item.isCurrentMonth && setSelectedDay(item.day)}
                style={[
                  styles.dayCell,
                  item.isCurrentMonth && item.bg ? { backgroundColor: item.bg } : styles.paddedDayCell,
                  isSelected && styles.selectedDayCell
                ]}
              >
                <View style={[styles.dayNumCircle, isSelected && styles.selectedNumCircle]}>
                  <Text style={[
                    styles.dayText,
                    !item.isCurrentMonth && styles.paddedDayText,
                    isSelected && styles.selectedDayText
                  ]}>
                    {item.day}
                  </Text>
                </View>

                {item.isCurrentMonth && item.dotColor && !isSelected && (
                  <View style={[styles.statusDot, { backgroundColor: item.dotColor }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Dynamic Monthly Stats strictly matching Firebase Data */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { borderColor: COLORS.success }]}>
          <Text style={[styles.statNum, { color: COLORS.success }]}>{monthlyStats.realPunches}</Text>
          <Text style={styles.statLabel}>Total Punches</Text>
        </View>

        <View style={[styles.statBox, { borderColor: '#94a3b8' }]}>
          <Text style={[styles.statNum, { color: '#64748b' }]}>{monthlyStats.noPunch}</Text>
          <Text style={styles.statLabel}>No Punch</Text>
        </View>

        <View style={[styles.statBox, { borderColor: '#f97316' }]}>
          <Text style={[styles.statNum, { color: '#f97316' }]}>{monthlyStats.weekOffs}</Text>
          <Text style={styles.statLabel}>Off / Leave</Text>
        </View>
      </View>

      {/* Selected Day Punch Details */}
      <View style={styles.overviewCard}>
        <View style={styles.overviewHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <PieChart size={20} color="#ff6b81" />
            <Text style={styles.overviewTitle}>Punch Details</Text>
          </View>

          <View style={styles.daysPill}>
            <Text style={styles.daysPillText}>{monthlyStats.total} Days in Month</Text>
          </View>
        </View>

        {selectedDetails && (
          <View style={styles.selectedLogCard}>
            <View style={styles.selectedLogHeader}>
              <View>
                <Text style={styles.selectedDateText}>📅 {MONTH_NAMES[monthIndex]} {selectedDetails.day}, {year}</Text>
                <Text style={styles.selectedUserText}>{profile?.name || 'Logged-In User'}</Text>
              </View>
              <AttendanceBadge status={selectedDetails.status} />
            </View>

            <View style={styles.punchGrid}>
              <View style={styles.punchBox}>
                <Text style={styles.punchLabel}>Punch In</Text>
                <Text style={styles.punchValue}>{selectedDetails.clockIn}</Text>
              </View>

              <View style={styles.punchBox}>
                <Text style={styles.punchLabel}>Punch Out</Text>
                <Text style={styles.punchValue}>{selectedDetails.clockOut}</Text>
              </View>

              <View style={styles.punchBox}>
                <Text style={styles.punchLabel}>Work Hours</Text>
                <Text style={styles.punchValue}>{selectedDetails.workHrs}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Work Location:</Text>
              <Text style={styles.infoValue}>{selectedDetails.location}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Verification Method:</Text>
              <Text style={styles.infoValue}>{selectedDetails.method}</Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  calendarBanner: {
    backgroundColor: '#ff6b81',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#ff6b81',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerBackIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  bannerSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    marginTop: 2,
  },
  bannerCalendarIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  monthArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  monthTitleText: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  calendarCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  weekdayText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textSecondary,
    width: 38,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: 38,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 3,
  },
  paddedDayCell: {
    backgroundColor: 'transparent',
  },
  selectedDayCell: {
    backgroundColor: '#ff6b81',
  },
  dayNumCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedNumCircle: {
    backgroundColor: '#ffffff',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  paddedDayText: {
    color: COLORS.textSecondary,
    opacity: 0.4,
  },
  selectedDayText: {
    color: '#ff6b81',
    fontWeight: '800',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  statNum: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginTop: 2,
  },
  overviewCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  daysPill: {
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  daysPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  selectedLogCard: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  selectedDateText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  selectedUserText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  punchGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  punchBox: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  punchLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  punchValue: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyFirebaseCard: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyFirebaseText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
});
