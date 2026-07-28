import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { HRMSContext } from '../../context/HRMSContext';
import { StatCard } from '../../components/StatCard';
import { AttendanceBadge } from '../../components/AttendanceBadge';
import { BirthdayAnnouncementCard } from '../../components/BirthdayAnnouncementCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { COLORS } from '../../constants/theme';
import { Users, Clock, Calendar, LogOut, UserCheck, AlertCircle, IndianRupee, CreditCard, FileText, Receipt } from 'lucide-react-native';

export const EmployeeDashboardScreen = ({ navigation }) => {
  const { profile, logout } = useContext(AuthContext);
  const { company, employees, attendanceLogs, leaves, clockedIn, toggleClockIn, lastClockInTime } = useContext(HRMSContext);

  const todayStr = new Date().toISOString().split('T')[0];

  // Logged-in User Identification Credentials
  const profUid = (profile?.uid || profile?.UserID || profile?.id || '').trim().toLowerCase();
  const profName = (profile?.name || profile?.FullName || '').trim().toLowerCase();
  const profEmail = (profile?.email || profile?.Email || '').trim().toLowerCase();

  // Employee Personal Logs
  const myPersonalLogs = (attendanceLogs || []).filter(l => {
    const lUid = (l.UserID || l.employeeId || '').trim().toLowerCase();
    const lName = (l.UserName || l.employeeName || '').trim().toLowerCase();
    const lEmail = (l.email || l.Email || '').trim().toLowerCase();
    return (profUid && lUid === profUid) || (profName && lName === profName) || (profEmail && lEmail === profEmail);
  });

  const myTodayLog = myPersonalLogs.find(l => {
    const lDate = l.date || l.PostingDate || (l.CreatedOn ? l.CreatedOn.split('T')[0] : '');
    return lDate === todayStr;
  });

  const myPresentCount = myPersonalLogs.filter(l => l.status && l.status.toLowerCase().includes('present')).length;
  const myLateCount = myPersonalLogs.filter(l => l.status && l.status.toLowerCase().includes('late')).length;
  const myUserLeaves = (leaves || []).filter(l => {
    const lUid = (l.UserID || l.employeeId || '').trim().toLowerCase();
    const lName = (l.employeeName || l.UserName || '').trim().toLowerCase();
    return (profUid && lUid === profUid) || (profName && lName === profName);
  });

  const handleQuickClock = () => {
    toggleClockIn(
      profile?.uid || profile?.UserID || profile?.UserCode || 'emp_001',
      profile?.name || profile?.FullName || profile?.Username || 'Employee',
      'Office - HQ',
      clockedIn ? 'Clocked out from dashboard' : 'Clocked in from dashboard'
    );
  };

  const currentEmpRecord = React.useMemo(() => {
    if (!employees || employees.length === 0) return null;
    return employees.find(e => {
      const eUid = (e.id || e.UserID || e.UserCode || '').trim().toLowerCase();
      const eEmail = (e.Email || e.email || '').trim().toLowerCase();
      const eName = (e.FullName || e.name || e.Username || '').trim().toLowerCase();
      return (profUid && eUid === profUid) || (profEmail && eEmail === profEmail) || (profName && eName === profName);
    });
  }, [employees, profUid, profEmail, profName]);

  const userNameStr = profile?.name || profile?.FullName || currentEmpRecord?.FullName || currentEmpRecord?.name || 'Employee';
  const userPhotoUri = profile?.UPhoto || currentEmpRecord?.UPhoto || profile?.avatar || currentEmpRecord?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userNameStr)}&background=F15E8C&color=fff`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header Profile Banner */}
      <View style={styles.topHeader}>
        <View style={styles.profileSection}>
          <Image
            source={{ uri: userPhotoUri }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.welcomeLabel}>Welcome back,</Text>
            <Text style={styles.userName}>{profile?.name || profile?.FullName || 'Employee'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>Employee Portal • {company?.name || 'Technosync Innovation'}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <LogOut size={18} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      {/* Clock-In Widget Card */}
      <View style={styles.clockCard}>
        <View style={styles.clockHeader}>
          <View>
            <Text style={styles.clockTitle}>Attendance Status</Text>
            <Text style={styles.clockSub}>
              {clockedIn ? `Clocked in at ${lastClockInTime || '09:00 AM'}` : 'You are currently clocked out'}
            </Text>
          </View>
          <AttendanceBadge status={clockedIn ? 'Present' : 'Absent'} />
        </View>

        <PrimaryButton
          title={clockedIn ? 'Clock Out Now' : 'Clock In Now'}
          onPress={handleQuickClock}
          variant={clockedIn ? 'danger' : 'primary'}
          icon={Clock}
          style={styles.clockActionBtn}
        />
      </View>

      {/* My Personal Metrics Overview */}
      <Text style={styles.sectionTitle}>My Attendance & Shift Summary</Text>
      <View style={styles.statsGrid}>
        <StatCard
          title="Today In-Time"
          value={myTodayLog?.clockIn || (clockedIn ? (lastClockInTime || '09:00 AM') : '--:--')}
          subtitle={clockedIn ? "Active Session" : "Clocked Out"}
          color={COLORS.primary}
          icon={Clock}
        />
        <StatCard
          title="Present Days"
          value={`${myPresentCount} Days`}
          subtitle="This Month"
          color={COLORS.success}
          icon={UserCheck}
        />
        <StatCard
          title="Late Marks"
          value={`${myLateCount} Marks`}
          subtitle="This Month"
          color={COLORS.secondary}
          icon={AlertCircle}
        />
        <StatCard
          title="Work Duration"
          value={myTodayLog?.workHrs ? myTodayLog.workHrs.replace(' (In Progress)', '') : (clockedIn ? 'In Progress' : '0 hrs')}
          subtitle={clockedIn ? "Session Active" : (myTodayLog?.location || 'Office HQ')}
          color="#8b5cf6"
          icon={Clock}
        />
      </View>

      {/* Quick Employee Portal Tiles */}
      <Text style={styles.sectionTitle}>Employee Quick Services</Text>
      <View style={styles.quickGrid}>
        <TouchableOpacity style={styles.quickTile} onPress={() => navigation.navigate('DailyAttendance')}>
          <View style={[styles.tileIcon, { backgroundColor: 'rgba(253, 172, 100, 0.15)' }]}>
            <Clock size={22} color={COLORS.secondary} />
          </View>
          <Text style={styles.tileTitle}>Attendance Calendar</Text>
          <Text style={styles.tileSub}>View my punch history & shifts</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickTile} onPress={() => navigation.navigate('ProcessPayroll')}>
          <View style={[styles.tileIcon, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
            <IndianRupee size={22} color={COLORS.success} />
          </View>
          <Text style={styles.tileTitle}>My Payslips</Text>
          <Text style={styles.tileSub}>View salary slip & breakdown</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickTile} onPress={() => navigation.navigate('LeaveManagement')}>
          <View style={[styles.tileIcon, { backgroundColor: 'rgba(241, 94, 140, 0.12)' }]}>
            <Calendar size={22} color={COLORS.primary} />
          </View>
          <Text style={styles.tileTitle}>Apply Leave</Text>
          <Text style={styles.tileSub}>Request casual/paid leave</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickTile} onPress={() => navigation.navigate('MissPunchRequest')}>
          <View style={[styles.tileIcon, { backgroundColor: 'rgba(241, 94, 140, 0.12)' }]}>
            <Clock size={22} color={COLORS.primary} />
          </View>
          <Text style={styles.tileTitle}>Miss Punch Request</Text>
          <Text style={styles.tileSub}>Request missed clock in/out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickTile} onPress={() => navigation.navigate('AttendanceCorrection')}>
          <View style={[styles.tileIcon, { backgroundColor: 'rgba(253, 172, 100, 0.15)' }]}>
            <Clock size={22} color={COLORS.secondary} />
          </View>
          <Text style={styles.tileTitle}>Attendance Correction</Text>
          <Text style={styles.tileSub}>Correct punch time discrepancies</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickTile} onPress={() => navigation.navigate('AdvanceLoan')}>
          <View style={[styles.tileIcon, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
            <CreditCard size={22} color="#8b5cf6" />
          </View>
          <Text style={styles.tileTitle}>Advance & Loans</Text>
          <Text style={styles.tileSub}>Request salary advance</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickTile} onPress={() => navigation.navigate('ExpenseClaim')}>
          <View style={[styles.tileIcon, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
            <Receipt size={22} color={COLORS.success} />
          </View>
          <Text style={styles.tileTitle}>Expense Claims</Text>
          <Text style={styles.tileSub}>Reimbursements & claims</Text>
        </TouchableOpacity>
      </View>

      {/* My Personal Punch Stream */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Recent Activity</Text>
        <TouchableOpacity onPress={() => navigation.navigate('DailyAttendance')}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {myPersonalLogs.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No punch history recorded yet. Use 'Clock In Now' above to start your shift!</Text>
        </View>
      ) : (
        myPersonalLogs.slice(0, 4).map((log, index) => (
          <View key={log.PunchID ? `${log.PunchID}_${index}` : `${log.id || 'att'}_${index}`} style={styles.logCard}>
            <View style={styles.logLeft}>
              <Text style={styles.logEmpName}>{log.date || log.PostingDate || 'Today'}</Text>
              <Text style={styles.logMeta}>{log.location || log.Location || 'Office HQ'} • IN: {log.clockIn || log.Time || '--:--'} • OUT: {log.clockOut || '--:--'}</Text>
            </View>
            <AttendanceBadge status={log.status || 'Present'} />
          </View>
        ))
      )}

      {/* Birthday Announcement Card at the bottom */}
      <BirthdayAnnouncementCard employees={employees} profile={profile} />
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  welcomeLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  roleBadge: {
    backgroundColor: 'rgba(241, 94, 140, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clockCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  clockTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  clockSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  clockActionBtn: {
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 10,
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  quickTile: {
    width: '48%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  tileTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  tileSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  logCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logLeft: {
    gap: 2,
    flex: 1,
  },
  logEmpName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  logMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  emptyCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
