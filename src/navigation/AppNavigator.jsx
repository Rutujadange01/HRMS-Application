import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { AuthContext } from '../context/AuthContext';
import { CustomDrawerOverlay } from '../components/CustomDrawerOverlay';
import { COLORS } from '../constants/theme';
import { Menu, Wand2, LayoutDashboard, Users, Clock, IndianRupee, UserCheck, Calendar } from 'lucide-react-native';

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
import { AdvanceLoanScreen } from '../screens/advance/AdvanceLoanScreen';
import { AssetManagementScreen } from '../screens/assets/AssetManagementScreen';
import { EssDashboardScreen } from '../screens/ess/EssDashboardScreen';
import { ReportsScreen } from '../screens/reports/ReportsScreen';
import { MastersScreen } from '../screens/masters/MastersScreen';
import { CompanyProfileScreen } from '../screens/company/CompanyProfileScreen';

const Stack = createStackNavigator();

// Custom Top Header Component
const CustomHeader = ({ title, navigation, onOpenDrawer }) => (
  <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
    <View style={styles.headerContainer}>
      <TouchableOpacity style={styles.menuBtn} onPress={onOpenDrawer}>
        <Menu size={22} color={COLORS.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <TouchableOpacity style={styles.wizardBtn} onPress={() => navigation.navigate('PayrollWizard')}>
        <Wand2 size={18} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

// Persistent Bottom Navigation Bar Filtered by Role Authorization with Center Floating Menu
// Persistent Bottom Navigation Bar Filtered by Role Authorization
const PersistentBottomBar = ({ activeRoute, onNavigate }) => {
  const { profile } = useContext(AuthContext);
  const role = profile?.role || 'Admin';

  const allTabs = [
    { label: 'Dashboard', route: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'HR', 'Manager', 'Employee'] },
    { label: 'Employees', route: 'EmployeeList', icon: Users, roles: ['Admin', 'HR', 'Manager'] },
    { label: 'Attendance', route: 'DailyAttendance', icon: Clock, roles: ['Admin', 'HR', 'Manager', 'Employee'] },
    { label: 'Payroll', route: 'ProcessPayroll', icon: IndianRupee, roles: ['Admin', 'HR'] },
    { label: 'ESS Portal', route: 'EssDashboard', icon: UserCheck, roles: ['Employee'] },
    { label: 'Leaves', route: 'LeaveManagement', icon: Calendar, roles: ['Manager', 'Employee'] },
  ];

  // Filter tabs for current user role (max 4 tabs)
  const tabs = allTabs.filter(t => t.roles.includes(role)).slice(0, 4);

  return (
    <SafeAreaView style={styles.bottomBarSafeArea}>
      <View style={styles.bottomBarContainer}>
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isFocused = activeRoute === tab.route;

          return (
            <TouchableOpacity
              key={tab.route}
              style={[styles.tabItem, isFocused && styles.tabItemActive]}
              onPress={() => onNavigate(tab.route)}
              activeOpacity={0.7}
            >
              <IconComponent size={20} color={isFocused ? COLORS.primary : COLORS.textSecondary} />
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

// Main Navigation Shell
const MainAppFlowScreen = ({ navigation }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
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
                route.name === 'DailyAttendance' ? 'Attendance & Geo/QR' :
                route.name === 'PayrollWizard' ? 'Payroll Setup Wizard' :
                route.name === 'ProcessPayroll' ? 'Payroll & Payslips' :
                route.name === 'LeaveManagement' ? 'Leave Approvals' :
                route.name === 'AdvanceLoan' ? 'Advance & Loans' :
                route.name === 'AssetManagement' ? 'Asset Management' :
                route.name === 'EssDashboard' ? 'Employee Self Service' :
                route.name === 'Reports' ? 'Reports & Exports' :
                route.name === 'Masters' ? 'Masters Setup' :
                route.name === 'CompanyProfile' ? 'Company Setup' : 'Techno HRMS'
              }
              navigation={navigation}
              onOpenDrawer={() => setDrawerOpen(true)}
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
        <Stack.Screen name="AdvanceLoan" component={AdvanceLoanScreen} />
        <Stack.Screen name="AssetManagement" component={AssetManagementScreen} />
        <Stack.Screen name="EssDashboard" component={EssDashboardScreen} />
        <Stack.Screen name="Reports" component={ReportsScreen} />
        <Stack.Screen name="Masters" component={MastersScreen} />
        <Stack.Screen name="CompanyProfile" component={CompanyProfileScreen} />
      </Stack.Navigator>

      {/* Persistent Bottom Bar (Role Filtered) with Center Floating Menu */}
      <PersistentBottomBar
        activeRoute={currentRoute}
        onNavigate={handleNavigate}
        onOpenDrawer={() => setDrawerOpen(true)}
      />

      {/* Left Drawer Overlay (Role Filtered) */}
      <CustomDrawerOverlay
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        navigation={navigation}
        currentRoute={currentRoute}
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
  menuBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.inputBg,
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
    paddingHorizontal: 6,
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
    fontSize: 11,
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
    paddingHorizontal: 6,
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
