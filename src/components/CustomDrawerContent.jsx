import React, { useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { AuthContext } from '../context/AuthContext';
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
  ChevronRight
} from 'lucide-react-native';

export const CustomDrawerContent = (props) => {
  const { user, profile, logout } = useContext(AuthContext);

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, route: 'Dashboard' },
    { label: 'Employees Directory', icon: Users, route: 'EmployeeList' },
    { label: 'Attendance & Geo/QR', icon: Clock, route: 'DailyAttendance' },
    { label: 'Payroll & Payslips', icon: IndianRupee, route: 'ProcessPayroll' },
    { label: 'Payroll Setup Wizard', icon: Wand2, route: 'PayrollWizard' },
    { label: 'Leave Management', icon: Calendar, route: 'LeaveManagement' },
    { label: 'Advance & Loans', icon: CreditCard, route: 'AdvanceLoan' },
    { label: 'Asset Management', icon: Package, route: 'AssetManagement' },
    { label: 'Employee Self Service', icon: UserCheck, route: 'EssDashboard' },
    { label: 'Reports & Exports', icon: FileSpreadsheet, route: 'Reports' },
    { label: 'Masters Setup', icon: Settings, route: 'Masters' },
  ];

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.container}>
      {/* Header Profile Section */}
      <View style={styles.profileSection}>
        <Image 
          source={{ uri: profile?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' }} 
          style={styles.avatar} 
        />
        <View style={styles.profileInfo}>
          <Text style={styles.userName}>{profile?.name || 'Sarah Jenkins'}</Text>
          <Text style={styles.userRole}>{profile?.role || 'Admin'} • Techno HRMS</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Menu Options */}
      <View style={styles.menuContainer}>
        <Text style={styles.sectionHeader}>MAIN NAVIGATION</Text>
        {menuItems.map((item, index) => {
          const IconComp = item.icon;
          const isFocused = props.state.routes[props.state.index]?.name === item.route;

          return (
            <TouchableOpacity
              key={index}
              style={[styles.drawerItem, isFocused && styles.drawerItemActive]}
              onPress={() => props.navigation.navigate(item.route)}
            >
              <View style={styles.itemLeft}>
                <IconComp size={20} color={isFocused ? '#38bdf8' : '#94a3b8'} />
                <Text style={[styles.itemLabel, isFocused && styles.itemLabelActive]}>
                  {item.label}
                </Text>
              </View>
              <ChevronRight size={16} color={isFocused ? '#38bdf8' : '#475569'} />
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.divider} />

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <LogOut size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Sign Out Account</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>Techno HRMS v2.4 • Build 2026</Text>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: 10,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#38bdf8',
  },
  profileInfo: {
    marginLeft: 14,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  userRole: {
    fontSize: 12,
    color: '#38bdf8',
    marginTop: 2,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 12,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    paddingHorizontal: 20,
    marginBottom: 8,
    letterSpacing: 1,
  },
  menuContainer: {
    paddingHorizontal: 12,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 4,
  },
  drawerItemActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemLabel: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
    marginLeft: 12,
  },
  itemLabelActive: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginTop: 10,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  versionText: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
});
