import React, { useContext } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, SafeAreaView, Image, Platform } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { COLORS } from '../constants/theme';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Clock,
  Calendar,
  IndianRupee,
  Wand2,
  CreditCard,
  Receipt,
  Package,
  FileSpreadsheet,
  Building2,
  Settings,
  UserCheck,
  X,
  ChevronRight,
  Shield,
  LogOut,
  Sparkles
} from 'lucide-react-native';

export const MoreServicesModal = ({ visible, onClose, navigation, onNavigate }) => {
  const { profile, logout } = useContext(AuthContext);

  if (!visible) return null;

  const userRole = (profile?.role || profile?.Role || 'Employee').trim();
  const normalizedUserRole = userRole.toLowerCase();

  const userName = profile?.name || profile?.FullName || profile?.Username || 'Staff Member';
  const userPhoto = profile?.UPhoto || profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=F15E8C&color=fff`;

  const menuSections = [
    {
      id: 'workforce',
      title: 'Workforce & HR Management',
      roles: ['admin', 'hr', 'manager'],
      items: [
        { label: 'Employees Directory', sub: 'View team profiles & details', icon: Users, route: 'EmployeeList', color: '#3b82f6', roles: ['admin', 'hr', 'manager'] },
        { label: 'Onboard New Employee', sub: 'Add new staff to HRMS', icon: UserPlus, route: 'AddEmployee', color: '#10b981', roles: ['admin', 'hr'] },
      ]
    },
    {
      id: 'attendance',
      title: 'Attendance & Leave Approvals',
      roles: ['admin', 'hr', 'manager', 'employee'],
      items: [
        { label: 'Punch History & Logs', sub: 'Daily attendance timeline', icon: Clock, route: 'DailyAttendance', color: '#8b5cf6', roles: ['admin', 'hr', 'manager', 'employee'] },
        { label: 'Leave Management', sub: 'Apply & approve leave requests', icon: Calendar, route: 'LeaveManagement', color: '#f59e0b', roles: ['admin', 'hr', 'manager', 'employee'] },
        { label: 'Miss Punch Requests', sub: 'Regularize missed clock-ins', icon: Clock, route: 'MissPunchRequest', color: '#ef4444', roles: ['admin', 'hr', 'manager', 'employee'] },
        { label: 'Attendance Correction', sub: 'Fix timing discrepancies', icon: Sparkles, route: 'AttendanceCorrection', color: '#06b6d4', roles: ['admin', 'hr', 'manager', 'employee'] },
        { label: 'Bulk Mark Attendance', sub: 'Batch punch team members', icon: Users, route: 'BulkAttendance', color: '#ec4899', roles: ['admin', 'hr', 'manager'] },
      ]
    },
    {
      id: 'payroll',
      title: 'Payroll, Loans & Expenses',
      roles: ['admin', 'hr', 'manager', 'employee'],
      items: [
        { label: 'Payroll & Payslips', sub: 'Process salary & payslips', icon: IndianRupee, route: 'ProcessPayroll', color: '#10b981', roles: ['admin', 'hr'] },
        { label: 'Payroll Setup Wizard', sub: 'Configure salary structures', icon: Wand2, route: 'PayrollWizard', color: '#f59e0b', roles: ['admin', 'hr'] },
        { label: 'Advance & Loans', sub: 'Salary advance requests', icon: CreditCard, route: 'AdvanceLoan', color: '#6366f1', roles: ['admin', 'hr', 'manager', 'employee'] },
        { label: 'Expense Claims', sub: 'Reimbursement requests', icon: Receipt, route: 'ExpenseClaim', color: '#14b8a6', roles: ['admin', 'hr', 'manager', 'employee'] },
      ]
    },
    {
      id: 'assets',
      title: 'Company Assets & Utilities',
      roles: ['admin', 'hr', 'employee'],
      items: [
        { label: 'Asset Management', sub: 'Track laptops & equipment', icon: Package, route: 'AssetManagement', color: '#8b5cf6', roles: ['admin', 'hr', 'employee'] },
        { label: 'Employee Self Service', sub: 'Personal ESS dashboard', icon: UserCheck, route: 'EssDashboard', color: '#f15e8c', roles: ['admin', 'hr', 'manager', 'employee'] },
      ]
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      roles: ['admin', 'hr', 'manager'],
      items: [
        { label: 'Reports & Exports', sub: 'Download Excel & PDF reports', icon: FileSpreadsheet, route: 'Reports', color: '#3b82f6', roles: ['admin', 'hr', 'manager'] },
      ]
    },
    {
      id: 'settings',
      title: 'Company Setup & Master Data',
      roles: ['admin'],
      items: [
        { label: 'Company Setup & GPS', sub: 'Manage branch & geofence', icon: Building2, route: 'CompanyProfile', color: '#64748b', roles: ['admin'] },
        { label: 'Masters Setup', sub: 'Departments, shifts & roles', icon: Settings, route: 'Masters', color: '#475569', roles: ['admin'] },
      ]
    }
  ];

  const handleTilePress = (route) => {
    onClose();
    if (onNavigate) {
      onNavigate(route);
    } else if (navigation) {
      navigation.navigate(route);
    }
  };

  const filteredSections = menuSections
    .filter(sec => sec.roles.includes(normalizedUserRole))
    .map(sec => ({
      ...sec,
      items: sec.items.filter(item => item.roles.includes(normalizedUserRole))
    }))
    .filter(sec => sec.items.length > 0);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlayBg}>
        <SafeAreaView style={styles.modalSafeArea}>
          {/* Top Sticky Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>All HRMS Modules</Text>
              <Text style={styles.headerSubtitle}>Complete Services Grid</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Logged In User Card Box */}
            <View style={styles.userCard}>
              <Image source={{ uri: userPhoto }} style={styles.userAvatar} />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{userName}</Text>
                <View style={styles.roleBadge}>
                  <Shield size={12} color="#ffffff" />
                  <Text style={styles.roleText}>{userRole.toUpperCase()} • TECHNO HRMS</Text>
                </View>
              </View>
            </View>

            {/* Structured Module Card Boxes */}
            {filteredSections.map(section => (
              <View key={section.id} style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={styles.gridRow}>
                  {section.items.map(item => {
                    const ItemIcon = item.icon;
                    return (
                      <TouchableOpacity
                        key={item.route}
                        style={styles.gridCard}
                        onPress={() => handleTilePress(item.route)}
                        activeOpacity={0.75}
                      >
                        <View style={[styles.iconWrapper, { backgroundColor: item.color + '1a' }]}>
                          <ItemIcon size={22} color={item.color} />
                        </View>
                        <View style={styles.cardTextContainer}>
                          <Text style={styles.cardTitle} numberOfLines={1}>{item.label}</Text>
                          <Text style={styles.cardSub} numberOfLines={1}>{item.sub}</Text>
                        </View>
                        <ChevronRight size={16} color={COLORS.textSecondary} style={styles.arrowIcon} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

            {/* Logout Tile */}
            <TouchableOpacity
              style={styles.logoutCard}
              onPress={() => {
                onClose();
                logout();
              }}
              activeOpacity={0.8}
            >
              <View style={styles.logoutIconWrapper}>
                <LogOut size={20} color="#ef4444" />
              </View>
              <Text style={styles.logoutText}>Log Out Account</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayBg: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.inputBg,
    marginRight: 14,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  roleText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gridRow: {
    gap: 10,
  },
  gridCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cardSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  arrowIcon: {
    marginLeft: 6,
  },
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 16,
    borderRadius: 14,
    marginTop: 10,
    gap: 8,
  },
  logoutIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '800',
  },
});
