import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { HRMSContext } from '../../context/HRMSContext';
import { COLORS } from '../../constants/theme';
import { 
  UserCheck, 
  Clock, 
  IndianRupee, 
  Calendar, 
  CreditCard, 
  Upload, 
  ChevronRight
} from 'lucide-react-native';

export const EssDashboardScreen = ({ navigation }) => {
  const { profile } = useContext(AuthContext);
  const { clockedIn, toggleClockIn } = useContext(HRMSContext);

  const essActions = [
    { label: 'View Attendance History', icon: Clock, route: 'DailyAttendance' },
    { label: 'View Salary & Payslips', icon: IndianRupee, route: 'ProcessPayroll' },
    { label: 'Apply Leave Request', icon: Calendar, route: 'LeaveManagement' },
    { label: 'Request Salary Advance', icon: CreditCard, route: 'AdvanceLoan' },
    { label: 'Upload Documents (Aadhaar/PAN)', icon: Upload, route: 'EmployeeList' },
    { label: 'My Assigned Assets', icon: UserCheck, route: 'AssetManagement' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile ESS Header */}
      <View style={styles.profileHeader}>
        <Image 
          source={{ uri: profile?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' }} 
          style={styles.avatar} 
        />
        <View style={styles.profileDetails}>
          <Text style={styles.name}>{profile?.name || 'Sarah Jenkins'}</Text>
          <Text style={styles.role}>{profile?.role || 'Admin'} • Employee Self Service (ESS)</Text>
          <Text style={styles.company}>Technosync Innovation</Text>
        </View>
      </View>

      {/* Quick Clock In/Out Hero Action */}
      <View style={styles.clockCard}>
        <Text style={styles.clockTitle}>Quick Attendance Punch</Text>
        <Text style={styles.clockSub}>Status: {clockedIn ? 'Clocked In (Active)' : 'Clocked Out'}</Text>

        <TouchableOpacity 
          style={[styles.clockBtn, clockedIn && styles.clockBtnOut]} 
          onPress={() => toggleClockIn('emp_001', profile?.name || 'Sarah Jenkins')}
        >
          <Clock size={20} color="#ffffff" />
          <Text style={styles.clockBtnText}>{clockedIn ? 'Clock Out Now' : 'Clock In Now'}</Text>
        </TouchableOpacity>
      </View>

      {/* ESS Grid Actions */}
      <Text style={styles.sectionHeader}>Employee Self-Service Tools</Text>

      {essActions.map((item, index) => {
        const IconC = item.icon;
        return (
          <TouchableOpacity 
            key={index} 
            style={styles.essCard} 
            onPress={() => navigation.navigate(item.route)}
          >
            <View style={styles.cardLeft}>
              <View style={styles.iconWrapper}>
                <IconC size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.cardLabel}>{item.label}</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        );
      })}
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
  profileHeader: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  profileDetails: {
    marginLeft: 14,
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  role: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  company: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  clockCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clockTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  clockSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  clockBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  clockBtnOut: {
    backgroundColor: COLORS.danger,
  },
  clockBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 8,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  essCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    backgroundColor: COLORS.activeTabBg,
    padding: 10,
    borderRadius: 12,
    marginRight: 14,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});
