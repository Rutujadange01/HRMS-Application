import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { AuthContext } from '../context/AuthContext';
import { HRMSContext } from '../context/HRMSContext';
import { FacePunchModal } from '../components/FacePunchModal';
import { MoreServicesModal } from '../components/MoreServicesModal';
import { COLORS } from '../constants/theme';
import { Menu, Wand2, LayoutDashboard, Users, Clock, IndianRupee, UserCheck, Calendar, Camera, Grid, MoreHorizontal, MoreVertical, Bell } from 'lucide-react-native';

// Auth Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';

// Techno HRMS Screens
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { EmployeeListScreen } from '../screens/employee/EmployeeListScreen';
import { EmployeeDetailScreen } from '../screens/employee/EmployeeDetailScreen';
import { AddEmployeeScreen } from '../screens/employee/AddEmployeeScreen';
import { DailyAttendanceScreen } from '../screens/attendance/DailyAttendanceScreen';
import { PayrollSetupWizardScreen } from '../screens/payroll/PayrollSetupWizardScreen';
import { ProcessPayrollScreen } from '../screens/payroll/ProcessPayrollScreen';
import { LeaveManagementScreen } from '../screens/attendance/LeaveManagementScreen';
import { MissPunchScreen } from '../screens/attendance/MissPunchScreen';
import { AttendanceCorrectionScreen } from '../screens/attendance/AttendanceCorrectionScreen';
import { BulkAttendanceScreen } from '../screens/attendance/BulkAttendanceScreen';
import { AdvanceLoanScreen } from '../screens/advance/AdvanceLoanScreen';
import { ExpenseClaimScreen } from '../screens/expense/ExpenseClaimScreen';
import { AssetManagementScreen } from '../screens/assets/AssetManagementScreen';
import { EssDashboardScreen } from '../screens/ess/EssDashboardScreen';
import { DocumentUploadScreen } from '../screens/ess/DocumentUploadScreen';
import { ReportsScreen } from '../screens/reports/ReportsScreen';
import { MastersScreen } from '../screens/masters/MastersScreen';
import { CompanyProfileScreen } from '../screens/company/CompanyProfileScreen';
import { NotificationHubScreen } from '../screens/notifications/NotificationHubScreen';

const Stack = createStackNavigator();

const CustomHeader = ({ title, navigation, showWizard }) => {
  const { profile } = useContext(AuthContext);
  const { employees, leaves, correctionRequests, expenseClaims, missPunches } = useContext(HRMSContext);

  const rawRole = (profile?.role || profile?.Role || 'Employee').toString().trim().toLowerCase();
  const isAdminOrHR = rawRole === 'admin' || rawRole === 'hr';
  const myEmpId = String(profile?.uid || profile?.UserID).toLowerCase().trim();

  // Combine and count pending requests
  let pendingCount = 0;

  const countPending = (list, idField) => {
    return (list || []).filter(item => {
      if (item.status !== 'Pending' && item.Status !== 'Pending') return false;
      const itemEmpId = String(item[idField] || item.employeeId || item.employeeName || item.UserID).toLowerCase().trim();
      
      if (itemEmpId === myEmpId) return false; // Never show own requests in Notification Hub
      
      const reqEmp = (employees || []).find(e => String(e.UserID || e.id || e.UserCode).toLowerCase().trim() === itemEmpId);
      const reqReportingTo = String(reqEmp?.reportingTo || reqEmp?.ReportingTo || '').toLowerCase().trim();
      if (reqReportingTo === myEmpId) return true;

      return false;
    }).length;
  };

  pendingCount += countPending(leaves, 'employeeId');
  pendingCount += countPending(correctionRequests, 'employeeId');
  pendingCount += countPending(expenseClaims, 'employeeId');
  pendingCount += countPending(missPunches, 'employeeId');

  return (
    <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
      <View style={styles.headerContainer}>
        <View style={styles.headerTitleContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>TH</Text>
          </View>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('NotificationHub')}>
            <Bell size={20} color={COLORS.textPrimary} />
            {pendingCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCount > 99 ? '99+' : pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          {showWizard && (
            <TouchableOpacity style={styles.wizardBtn} onPress={() => navigation.navigate('PayrollWizard')}>
              <Wand2 size={18} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

// Persistent Bottom Navigation Bar with Center Punch (Face Detection) Action
const PersistentBottomBar = ({ activeRoute, onNavigate, onOpenPunchModal, onOpenDrawer, onOpenMoreModal }) => {
  return (
    <SafeAreaView style={styles.bottomBarSafeArea}>
      <View style={styles.bottomBarContainer}>
        {/* Dashboard Tab */}
        <TouchableOpacity
          style={[styles.tabItem, activeRoute === 'Dashboard' && styles.tabItemActive]}
          onPress={() => onNavigate('Dashboard')}
          activeOpacity={0.7}
        >
          <LayoutDashboard size={20} color={activeRoute === 'Dashboard' ? COLORS.primary : COLORS.textSecondary} />
          <Text style={[styles.tabLabel, activeRoute === 'Dashboard' && styles.tabLabelActive]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        {/* Punch History Tab */}
        <TouchableOpacity
          style={[styles.tabItem, activeRoute === 'DailyAttendance' && styles.tabItemActive]}
          onPress={() => onNavigate('DailyAttendance')}
          activeOpacity={0.7}
        >
          <Clock size={20} color={activeRoute === 'DailyAttendance' ? COLORS.primary : COLORS.textSecondary} />
          <Text style={[styles.tabLabel, activeRoute === 'DailyAttendance' && styles.tabLabelActive]}>
            History
          </Text>
        </TouchableOpacity>

        {/* Center Punch FAB (Opens Face Verification Camera Modal) */}
        <TouchableOpacity
          style={styles.centerMenuFab}
          onPress={onOpenPunchModal}
          activeOpacity={0.85}
        >
          <View style={styles.centerMenuCircle}>
            <Camera size={24} color="#ffffff" />
          </View>
          <Text style={styles.centerMenuLabel}>Punch</Text>
        </TouchableOpacity>

        {/* ESS Portal Tab */}
        <TouchableOpacity
          style={[styles.tabItem, activeRoute === 'EssDashboard' && styles.tabItemActive]}
          onPress={() => onNavigate('EssDashboard')}
          activeOpacity={0.7}
        >
          <UserCheck size={20} color={activeRoute === 'EssDashboard' ? COLORS.primary : COLORS.textSecondary} />
          <Text style={[styles.tabLabel, activeRoute === 'EssDashboard' && styles.tabLabelActive]}>
            Settings
          </Text>
        </TouchableOpacity>

        {/* More Services Tab */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={onOpenMoreModal}
          activeOpacity={0.7}
        >
          <MoreVertical size={20} color={COLORS.textSecondary} />
          <Text style={styles.tabLabel}>
            More
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Main Navigation Shell
const MainAppFlowScreen = ({ navigation }) => {
  const { profile } = useContext(AuthContext);
  const userRole = (profile?.role || profile?.Role || 'Employee').trim().toLowerCase();
  const isAdminOrHR = userRole === 'admin' || userRole === 'hr';
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreServicesOpen, setMoreServicesOpen] = useState(false);
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const [currentRoute, setCurrentRoute] = useState('Dashboard');

  const handleNavigate = (routeName) => {
    setCurrentRoute(routeName);
    navigation.navigate(routeName);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Stack.Navigator
        screenOptions={({ route }) => ({
          header: () => (
            <CustomHeader
              title={
                route.name === 'Dashboard' ? 'Techno HRMS' :
                  route.name === 'EmployeeList' ? 'Employees Directory' :
                    route.name === 'EmployeeDetail' ? 'Employee Profile' :
                      route.name === 'AddEmployee' ? 'Onboard Employee' :
                        route.name === 'DailyAttendance' ? 'Punch History' :
                          route.name === 'PayrollWizard' ? 'Payroll Setup Wizard' :
                            route.name === 'ProcessPayroll' ? 'Payroll & Payslips' :
                              route.name === 'LeaveManagement' ? 'Leave Approvals' :
                                route.name === 'MissPunchRequest' ? 'Miss Punch Requests' :
                                  route.name === 'AttendanceCorrection' ? 'Attendance Correction' :
                                    route.name === 'BulkAttendance' ? 'Bulk Mark Attendance' :
                                      route.name === 'AdvanceLoan' ? 'Advance & Loans' :
                                        route.name === 'ExpenseClaim' ? 'Expense Claims' :
                                          route.name === 'AssetManagement' ? 'Asset Management' :
                                            route.name === 'EssDashboard' ? 'Employee Self Service' :
                                              route.name === 'Reports' ? 'Reports & Exports' :
                                                route.name === 'Masters' ? 'Masters Setup' :
                                                  route.name === 'CompanyProfile' ? 'Company Setup' : 'Techno HRMS'
              }
              navigation={navigation}
              showWizard={isAdminOrHR}
            />
          ),
        })}
      >
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="EmployeeList" component={EmployeeListScreen} />
        <Stack.Screen name="AddEmployee" component={AddEmployeeScreen} />
        <Stack.Screen name="EmployeeDetail" component={EmployeeDetailScreen} />
        <Stack.Screen name="DailyAttendance" component={DailyAttendanceScreen} />
        <Stack.Screen name="PayrollWizard" component={PayrollSetupWizardScreen} />
        <Stack.Screen name="ProcessPayroll" component={ProcessPayrollScreen} />
        <Stack.Screen name="LeaveManagement" component={LeaveManagementScreen} />
        <Stack.Screen name="MissPunchRequest" component={MissPunchScreen} />
        <Stack.Screen name="AttendanceCorrection" component={AttendanceCorrectionScreen} />
        <Stack.Screen name="BulkAttendance" component={BulkAttendanceScreen} />
        <Stack.Screen name="AdvanceLoan" component={AdvanceLoanScreen} />
        <Stack.Screen name="ExpenseClaim" component={ExpenseClaimScreen} />
        <Stack.Screen name="AssetManagement" component={AssetManagementScreen} />
        <Stack.Screen name="EssDashboard" component={EssDashboardScreen} />
        <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} />
        <Stack.Screen name="Reports" component={ReportsScreen} />
        <Stack.Screen name="Masters" component={MastersScreen} options={{ headerShown: true }} />
        <Stack.Screen name="CompanyProfile" component={CompanyProfileScreen} options={{ headerShown: true }} />
        <Stack.Screen name="NotificationHub" component={NotificationHubScreen} options={{ headerShown: false }} />
      </Stack.Navigator>

      {/* Persistent Bottom Bar with Center Punch (Face Detection) FAB & ... More Tab */}
      <PersistentBottomBar
        activeRoute={currentRoute}
        onNavigate={handleNavigate}
        onOpenPunchModal={() => setFaceModalOpen(true)}
        onOpenDrawer={() => setDrawerOpen(true)}
        onOpenMoreModal={() => setMoreServicesOpen(true)}
      />

      {/* Face Recognition Punch Modal */}
      <FacePunchModal
        visible={faceModalOpen}
        onClose={() => setFaceModalOpen(false)}
      />

      {/* ... More Services Full-Screen Grid Box Modal */}
      <MoreServicesModal
        visible={moreServicesOpen}
        onClose={() => setMoreServicesOpen(false)}
        navigation={navigation}
        onNavigate={handleNavigate}
      />
    </View>
  );
};

export const AppNavigator = () => {
  const { user } = useContext(AuthContext);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="MainFlow" component={MainAppFlowScreen} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  headerSafeArea: {
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerContainer: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  wizardBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.activeTabBg,
  },
  bellBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  bottomBarSafeArea: {
    backgroundColor: COLORS.cardBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  bottomBarContainer: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 12,
  },
  tabItemActive: {
    backgroundColor: COLORS.activeTabBg,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  centerMenuFab: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
    paddingHorizontal: 4,
  },
  centerMenuCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
    borderColor: COLORS.cardBg,
  },
  centerMenuLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
  },
});
