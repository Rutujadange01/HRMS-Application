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
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.drawerContainer} edges={['top', 'bottom']}>
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
              {authorizedModules.map((mainMod) => {
                return (
                  <View key={mainMod.id} style={styles.moduleSection}>
                    <Text style={styles.sectionTitle}>{mainMod.mainModule}</Text>
                    <View style={styles.gridContainer}>
                      {mainMod.subModules.map((subItem, sIdx) => {
                        const SubIcon = subItem.icon;
                        const isSubFocused = currentRoute === subItem.route;

                        return (
                          <TouchableOpacity
                            key={sIdx}
                            style={[styles.cardItem, isSubFocused && styles.cardItemActive]}
                            onPress={() => handleNavigate(subItem.route)}
                            activeOpacity={0.7}
                          >
                            <View style={[styles.iconWrapper, isSubFocused && styles.iconWrapperActive]}>
                              <SubIcon size={22} color={isSubFocused ? COLORS.white : COLORS.primary} />
                            </View>
                            <Text style={[styles.cardLabel, isSubFocused && styles.cardLabelActive]} numberOfLines={2}>
                              {subItem.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
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
    </Modal>
  );
};

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
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
    paddingHorizontal: 16,
  },
  moduleSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  cardItem: {
    width: '30%',
    marginHorizontal: '1.5%',
    marginBottom: 12,
    backgroundColor: COLORS.inputBg || '#f8fafc',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardItemActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconWrapperActive: {
    backgroundColor: COLORS.primary,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  cardLabelActive: {
    color: COLORS.primary,
    fontWeight: '800',
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
