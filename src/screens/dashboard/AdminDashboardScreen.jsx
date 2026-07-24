import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { HRMSContext } from '../../context/HRMSContext';
import { StatCard } from '../../components/StatCard';
import { AttendanceBadge } from '../../components/AttendanceBadge';
import { PrimaryButton } from '../../components/PrimaryButton';
import { COLORS } from '../../constants/theme';
import { Users, Clock, Calendar, Building2, LogOut, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react-native';

export const AdminDashboardScreen = ({ navigation }) => {
  const { profile, logout } = useContext(AuthContext);
  const { company, employees, departments, attendanceLogs, leaves, clockedIn, toggleClockIn, lastClockInTime } = useContext(HRMSContext);

  const userRole = profile?.role || profile?.Role || 'Admin';
  const todayStr = new Date().toISOString().split('T')[0];

  // Admin / Company-wide Stats
  const todayLogs = (attendanceLogs || []).filter(l => {
    const lDate = l.date || l.PostingDate || (l.CreatedOn ? l.CreatedOn.split('T')[0] : '');
    return lDate === todayStr;
  });

  const employeeTodayLogsMap = {};
  todayLogs.forEach(l => {
    const empKey = (l.UserID || l.employeeId || l.employeeName || l.UserName || '').trim().toLowerCase();
    if (!empKey) return;
    if (!employeeTodayLogsMap[empKey]) {
      employeeTodayLogsMap[empKey] = [];
    }
    employeeTodayLogsMap[empKey].push(l);
  });

  let presentTodayCount = 0;
  let lateTodayCount = 0;

  Object.values(employeeTodayLogsMap).forEach(logs => {
    const hasLate = logs.some(l => l.status && l.status.toLowerCase().includes('late'));
    const hasPresent = logs.some(l => l.status && (l.status.toLowerCase().includes('present') || l.clockIn));

    if (hasLate) {
      lateTodayCount++;
    }
    if (hasPresent) {
      presentTodayCount++;
    }
  });

  const presentToday = presentTodayCount;
  const lateToday = lateTodayCount;
  const pendingLeaves = (leaves || []).filter(l => l.status === 'Pending').length;

  const displayLogs = (todayLogs.length > 0 ? todayLogs : (attendanceLogs || []))
    .slice()
    .sort((a, b) => {
      const timeA = a.CreatedOn || `${a.date || a.PostingDate} ${a.Time || '00:00'}`;
      const timeB = b.CreatedOn || `${b.date || b.PostingDate} ${b.Time || '00:00'}`;
      return timeB.localeCompare(timeA);
    })
    .slice(0, 4);

  const handleQuickClock = () => {
    toggleClockIn(
      profile?.uid || profile?.UserID || profile?.UserCode || 'emp_001',
      profile?.name || profile?.FullName || profile?.Username || 'Admin User',
      'Office - HQ',
      clockedIn ? 'Clocked out from dashboard' : 'Clocked in from dashboard'
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header Profile Banner */}
      <View style={styles.topHeader}>
        <View style={styles.profileSection}>
          <Image
            source={{ uri: profile?.avatar || profile?.UPhoto || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.welcomeLabel}>Welcome back,</Text>
            <Text style={styles.userName}>{profile?.name || profile?.FullName || 'Admin User'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{userRole} Management • {company?.name || 'Technosync Innovation'}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
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

      {/* Key HR Metrics Overview Grid */}
      <Text style={styles.sectionTitle}>HR Metrics Overview</Text>
      <View style={styles.statsGrid}>
        <StatCard
          title="Total Workforce"
          value={employees.length.toString()}
          subtitle="Active employees"
          color={COLORS.primary}
          icon={Users}
        />
        <StatCard
          title="Present Today"
          value={presentToday.toString()}
          subtitle={`${lateToday} arrived late`}
          color={COLORS.success}
          icon={UserCheck}
        />
        <StatCard
          title="Pending Leaves"
          value={pendingLeaves.toString()}
          subtitle="Requires approval"
          color={COLORS.secondary}
          icon={Calendar}
        />
        <StatCard
          title="Departments"
          value={(departments ? departments.length : 0).toString()}
          subtitle={`${departments ? departments.length : 0} active ${departments && departments.length === 1 ? 'team' : 'teams'}`}
          color="#8b5cf6"
          icon={Building2}
        />
      </View>

      {/* Quick Action Navigation Grid */}
      <Text style={styles.sectionTitle}>Quick Management Modules</Text>
      <View style={styles.quickGrid}>
        <TouchableOpacity style={styles.quickTile} onPress={() => navigation.navigate('EmployeeList')}>
          <View style={[styles.tileIcon, { backgroundColor: 'rgba(241, 94, 140, 0.12)' }]}>
            <Users size={22} color={COLORS.primary} />
          </View>
          <Text style={styles.tileTitle}>Employee Directory</Text>
          <Text style={styles.tileSub}>Manage staff profiles & roles</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickTile} onPress={() => navigation.navigate('DailyAttendance')}>
          <View style={[styles.tileIcon, { backgroundColor: 'rgba(253, 172, 100, 0.15)' }]}>
            <Clock size={22} color={COLORS.secondary} />
          </View>
          <Text style={styles.tileTitle}>Attendance Log</Text>
          <Text style={styles.tileSub}>Clock history & shifts</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickTile} onPress={() => navigation.navigate('LeaveManagement')}>
          <View style={[styles.tileIcon, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
            <Calendar size={22} color={COLORS.success} />
          </View>
          <Text style={styles.tileTitle}>Leave Approvals</Text>
          <Text style={styles.tileSub}>{pendingLeaves} pending requests</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickTile} onPress={() => navigation.navigate('CompanyProfile')}>
          <View style={[styles.tileIcon, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
            <Building2 size={22} color="#8b5cf6" />
          </View>
          <Text style={styles.tileTitle}>Company Setup</Text>
          <Text style={styles.tileSub}>Org policy & departments</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Attendance Feed */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today's Attendance Stream</Text>
        <TouchableOpacity onPress={() => navigation.navigate('DailyAttendance')}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {displayLogs.map((log, index) => (
        <View key={log.PunchID ? `${log.PunchID}_${index}` : `${log.id || 'att'}_${index}`} style={styles.logCard}>
          <View style={styles.logLeft}>
            <Text style={styles.logEmpName}>{log.employeeName || log.UserName || 'Employee'}</Text>
            <Text style={styles.logMeta}>{log.location || log.Location || 'Office HQ'} • {log.clockIn || log.Time || '--:--'}</Text>
          </View>
          <AttendanceBadge status={log.status || 'Present'} />
        </View>
      ))}
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
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justify: 'center',
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
});
