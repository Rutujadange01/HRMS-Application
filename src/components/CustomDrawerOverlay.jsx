import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { COLORS } from '../constants/theme';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  IndianRupee, 
  Calendar, 
  CreditCard, 
  Package, 
  UserCheck, 
  FileSpreadsheet, 
  Settings, 
  Wand2, 
  LogOut,
  ChevronRight,
  ChevronDown,
  X,
  Building2,
  FolderTree,
  UserPlus,
  Receipt
} from 'lucide-react-native';

export const CustomDrawerOverlay = ({ visible, onClose, navigation, currentRoute }) => {
  const { profile, logout } = useContext(AuthContext);
  const userRole = (profile?.role || profile?.Role || 'Admin').trim();

  const menuStructure = [
    {
      id: 'dashboard',
      mainModule: 'Core Dashboard & ESS',
      icon: LayoutDashboard,
      roles: ['Admin', 'HR', 'Manager', 'Employee'],
      subModules: [
        { label: userRole === 'Employee' ? 'Employee Dashboard' : 'Admin Dashboard', icon: LayoutDashboard, route: 'Dashboard', roles: ['Admin', 'HR', 'Manager', 'Employee'] },
        { label: 'Employee Self Service', icon: UserCheck, route: 'EssDashboard', roles: ['Admin', 'HR', 'Manager', 'Employee'] },
      ]
    },
    {
      id: 'workforce',
      mainModule: 'Workforce & HR',
      icon: Users,
      roles: ['Admin', 'HR', 'Manager'],
      subModules: [
        { label: 'Employees Directory', icon: Users, route: 'EmployeeList', roles: ['Admin', 'HR', 'Manager'] },
        { label: 'Onboard New Employee', icon: UserPlus, route: 'AddEmployee', roles: ['Admin', 'HR'] },
      ]
    },
    {
      id: 'attendance',
      mainModule: 'Attendance & Leave',
      icon: Clock,
      roles: ['Admin', 'HR', 'Manager', 'Employee'],
      subModules: [
        { label: 'Attendance & Geo/QR', icon: Clock, route: 'DailyAttendance', roles: ['Admin', 'HR', 'Manager', 'Employee'] },
        { label: 'Leave Management', icon: Calendar, route: 'LeaveManagement', roles: ['Admin', 'HR', 'Manager', 'Employee'] },
        { label: 'Miss Punch Requests', icon: Clock, route: 'MissPunchRequest', roles: ['Admin', 'HR', 'Manager', 'Employee'] },
        { label: 'Attendance Correction', icon: Clock, route: 'AttendanceCorrection', roles: ['Admin', 'HR', 'Manager', 'Employee'] },
        { label: 'Bulk Mark Attendance', icon: Users, route: 'BulkAttendance', roles: ['Admin', 'HR', 'Manager'] },
      ]
    },
    {
      id: 'payroll',
      mainModule: 'Payroll & Finance',
      icon: IndianRupee,
      roles: ['Admin', 'HR', 'Manager', 'Employee'],
      subModules: [
        { label: 'Payroll & Payslips', icon: IndianRupee, route: 'ProcessPayroll', roles: ['Admin', 'HR'] },
        { label: 'Payroll Setup Wizard', icon: Wand2, route: 'PayrollWizard', roles: ['Admin', 'HR'] },
        { label: 'Advance & Loans', icon: CreditCard, route: 'AdvanceLoan', roles: ['Admin', 'HR', 'Manager', 'Employee'] },
        { label: 'Expense Claims', icon: Receipt, route: 'ExpenseClaim', roles: ['Admin', 'HR', 'Manager', 'Employee'] },
      ]
    },
    {
      id: 'assets',
      mainModule: 'Asset Management',
      icon: Package,
      roles: ['Admin', 'HR', 'Employee'],
      subModules: [
        { label: 'Company Assets', icon: Package, route: 'AssetManagement', roles: ['Admin', 'HR', 'Employee'] },
      ]
    },
    {
      id: 'reports',
      mainModule: 'Reports & Analytics',
      icon: FileSpreadsheet,
      roles: ['Admin', 'HR', 'Manager'],
      subModules: [
        { label: 'Reports & Exports', icon: FileSpreadsheet, route: 'Reports', roles: ['Admin', 'HR', 'Manager'] },
      ]
    },
    {
      id: 'settings',
      mainModule: 'Company & Masters',
      icon: Building2,
      roles: ['Admin'],
      subModules: [
        { label: 'Company Setup & GPS', icon: Building2, route: 'CompanyProfile', roles: ['Admin'] },
        { label: 'Masters Setup', icon: Settings, route: 'Masters', roles: ['Admin'] },
      ]
    }
  ];

  const [expanded, setExpanded] = useState({
    dashboard: true,
    workforce: true,
    attendance: true,
    payroll: true,
    assets: true,
    reports: true,
    settings: true
  });

  useEffect(() => {
    menuStructure.forEach(mod => {
      if (mod.subModules.some(sub => sub.route === currentRoute)) {
        setExpanded(prev => ({ ...prev, [mod.id]: true }));
      }
    });
  }, [currentRoute]);

  const toggleModule = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleNavigate = (route) => {
    onClose();
    navigation.navigate(route);
  };

  const normalizedUserRole = userRole.toLowerCase();

  const authorizedModules = menuStructure
    .filter(mod => mod.roles.some(r => r.toLowerCase() === normalizedUserRole))
    .map(mod => ({
      ...mod,
      subModules: mod.subModules.filter(sub => sub.roles.some(r => r.toLowerCase() === normalizedUserRole))
    }))
    .filter(mod => mod.subModules.length > 0);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlayBg}>
        <SafeAreaView style={styles.drawerContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.drawerHeader}>
              <View style={styles.profileSection}>
                <Image 
                  source={{ uri: profile?.UPhoto || profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'User')}&background=F15E8C&color=fff` }} 
                  style={styles.avatar} 
                />
                <View style={styles.profileInfo}>
                  <Text style={styles.userName}>{profile?.name || 'Sarah Jenkins'}</Text>
                  <View style={styles.roleBadge}>
                    <Text style={styles.userRole}>{userRole.toUpperCase()} • TECHNO HRMS</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <X size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.menuContainer}>
              <Text style={styles.sectionHeader}>MAIN MODULES</Text>

              {authorizedModules.map((mainMod) => {
                const MainIcon = mainMod.icon;
                const isExpanded = expanded[mainMod.id];
                const hasActiveSub = mainMod.subModules.some(s => s.route === currentRoute);

                return (
                  <View key={mainMod.id} style={styles.moduleWrapper}>
                    <TouchableOpacity
                      style={[styles.mainModuleHeader, hasActiveSub && styles.mainModuleHeaderActive]}
                      onPress={() => toggleModule(mainMod.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.mainModuleLeft}>
                        <View style={[styles.mainIconContainer, hasActiveSub && styles.mainIconContainerActive]}>
                          <MainIcon size={18} color={hasActiveSub ? COLORS.white : COLORS.primary} />
                        </View>
                        <Text style={[styles.mainModuleTitle, hasActiveSub && styles.mainModuleTitleActive]}>
                          {mainMod.mainModule}
                        </Text>
                      </View>
                      <View style={styles.mainModuleRight}>
                        {isExpanded ? (
                          <ChevronDown size={16} color={COLORS.textSecondary} />
                        ) : (
                          <ChevronRight size={16} color={COLORS.textSecondary} />
                        )}
                      </View>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.subModulesContainer}>
                        {mainMod.subModules.map((subItem, sIdx) => {
                          const SubIcon = subItem.icon;
                          const isSubFocused = currentRoute === subItem.route;

                          return (
                            <TouchableOpacity
                              key={sIdx}
                              style={[styles.subModuleItem, isSubFocused && styles.subModuleItemActive]}
                              onPress={() => handleNavigate(subItem.route)}
                              activeOpacity={0.7}
                            >
                              <View style={styles.subItemLeft}>
                                <View style={[styles.subBullet, isSubFocused && styles.subBulletActive]} />
                                <SubIcon size={16} color={isSubFocused ? COLORS.primary : COLORS.textSecondary} />
                                <Text style={[styles.subModuleLabel, isSubFocused && styles.subModuleLabelActive]}>
                                  {subItem.label}
                                </Text>
                              </View>
                              {isSubFocused && (
                                <View style={styles.activePill}>
                                  <Text style={styles.activePillText}>Active</Text>
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <LogOut size={18} color={COLORS.danger} />
              <Text style={styles.logoutText}>Sign Out Account</Text>
            </TouchableOpacity>

            <Text style={styles.versionText}>Techno HRMS v2.5 • Main & Sub Modules</Text>
          </ScrollView>
        </SafeAreaView>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayBg: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
  },
  drawerContainer: {
    width: 300,
    backgroundColor: COLORS.cardBg,
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  scrollContent: {
    paddingVertical: 14,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  profileInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  roleBadge: {
    marginTop: 2,
  },
  userRole: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: COLORS.inputBg,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    paddingHorizontal: 16,
    marginBottom: 10,
    letterSpacing: 1,
  },
  menuContainer: {
    paddingHorizontal: 10,
  },
  moduleWrapper: {
    marginBottom: 6,
  },
  mainModuleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: COLORS.inputBg || '#f8fafc',
  },
  mainModuleHeaderActive: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  mainModuleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mainIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  mainIconContainerActive: {
    backgroundColor: COLORS.primary,
  },
  mainModuleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  mainModuleTitleActive: {
    color: COLORS.primary,
  },
  mainModuleRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subCountBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 6,
  },
  subCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  subModulesContainer: {
    paddingLeft: 22,
    paddingTop: 4,
  },
  subModuleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginVertical: 2,
  },
  subModuleItemActive: {
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  subItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#cbd5e1',
    marginRight: 10,
  },
  subBulletActive: {
    backgroundColor: COLORS.primary,
  },
  subModuleLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  subModuleLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  activePill: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803d',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.danger,
    marginLeft: 10,
  },
  versionText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 6,
  },
});
