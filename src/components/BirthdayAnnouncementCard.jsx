import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { COLORS } from '../constants/theme';
import { PartyPopper, Sparkles, Heart, Gift, Calendar, Bell } from 'lucide-react-native';

export const BirthdayAnnouncementCard = ({ employees = [], profile = {} }) => {
  const [wished, setWished] = useState({});

  const today = new Date();
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentDay = today.getDate(); // 1-31

  // Filter employees belonging to the same company
  const userCompanyId = (profile?.companyId || profile?.CompanyID || 'comp_01').trim();
  
  const companyEmps = (employees || []).filter(emp => {
    const empComp = (emp.CompanyID || emp.companyId || 'comp_01').trim();
    return !userCompanyId || empComp === userCompanyId || userCompanyId === 'comp_01';
  });

  // Check if today is any employee's birthday
  const birthdayEmployees = companyEmps.filter(emp => {
    const dob = emp.DOB || emp.dob;
    if (!dob) return false;

    const parts = String(dob).split(/[-/]/);
    if (parts.length < 3) return false;

    let month = 0;
    let day = 0;

    if (parts[0].length === 4) {
      // YYYY-MM-DD
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else {
      // MM/DD/YYYY
      month = parseInt(parts[0], 10);
      day = parseInt(parts[1], 10);
    }

    return month === currentMonth && day === currentDay;
  });

  // Find upcoming birthdays in the current month if none today
  const upcomingBirthdays = companyEmps.filter(emp => {
    const dob = emp.DOB || emp.dob;
    if (!dob) return false;
    const parts = String(dob).split(/[-/]/);
    if (parts.length < 3) return false;
    let month = parts[0].length === 4 ? parseInt(parts[1], 10) : parseInt(parts[0], 10);
    let day = parts[0].length === 4 ? parseInt(parts[2], 10) : parseInt(parts[1], 10);

    return month === currentMonth && day > currentDay;
  });

  const handleSendWish = (empName, empId) => {
    setWished(prev => ({ ...prev, [empId]: true }));
    Alert.alert(
      "🎉 Wish Sent!",
      `Your warm Happy Birthday wishes have been delivered to ${empName}! 🎂🎁`
    );
  };

  return (
    <View style={styles.cardContainer}>
      {/* Header Banner */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <PartyPopper size={20} color="#ffffff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Company Birthday Announcement</Text>

            <Text style={styles.headerSub}>
              {birthdayEmployees.length > 0
                ? `🎉 ${birthdayEmployees.length} Team Member${birthdayEmployees.length > 1 ? 's' : ''} Celebrating Today!`
                : 'Company Celebrations & Events'}
            </Text>
          </View>
        </View>

        <Sparkles size={20} color="#f59e0b" />
      </View>

      {/* Main Body */}
      {birthdayEmployees.length > 0 ? (
        <View style={styles.birthdayList}>
          {birthdayEmployees.map((emp, index) => {
            const empId = emp.UserID || emp.id || `emp_${index}`;
            const empName = emp.name || emp.FullName || 'Team Member';
            const empDept = emp.department || emp.Department || 'Operations';
            const empDesig = emp.designation || emp.Designation || 'Employee';
            const empAvatar = emp.avatar || emp.UPhoto || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150';
            const isWished = wished[empId];

            return (
              <View key={empId} style={styles.birthdayItemCard}>
                <View style={styles.bannerRibbon}>
                  <Text style={styles.bannerRibbonText}>🎂 HAPPY BIRTHDAY TODAY! 🎈</Text>
                </View>

                <View style={styles.empRow}>
                  <View style={styles.avatarWrapper}>
                    <Image source={{ uri: empAvatar }} style={styles.empAvatar} />
                    <View style={styles.crownBadge}>
                      <Text style={{ fontSize: 12 }}>👑</Text>
                    </View>
                  </View>

                  <View style={styles.empDetails}>
                    <Text style={styles.empName}>{empName}</Text>
                    <Text style={styles.empRole}>{empDesig}</Text>
                    <Text style={styles.empDept}>{empDept}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.wishBtn, isWished && styles.wishBtnDone]}
                    onPress={() => handleSendWish(empName, empId)}
                    disabled={isWished}
                  >
                    {isWished ? (
                      <>
                        <Heart size={14} color="#ffffff" fill="#ffffff" />
                        <Text style={styles.wishBtnText}>Wished ❤️</Text>
                      </>
                    ) : (
                      <>
                        <Gift size={14} color="#ffffff" />
                        <Text style={styles.wishBtnText}>Wish Birthday 🎂</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.noBirthdayBox}>
          <View style={styles.noBirthdayHeader}>
            <Calendar size={18} color={COLORS.primary} />
            <Text style={styles.noBirthdayTitle}>No Team Birthdays Today</Text>
          </View>
          <Text style={styles.noBirthdaySub}>
            Check back tomorrow! Wishing everyone in the company a productive & happy workday.
          </Text>

          {upcomingBirthdays.length > 0 && (
            <View style={styles.upcomingBox}>
              <Text style={styles.upcomingLabel}>Upcoming Birthdays This Month:</Text>
              {upcomingBirthdays.slice(0, 2).map((u, i) => (
                <Text key={i} style={styles.upcomingText}>
                  🎈 {u.name || u.FullName} - {u.DOB || u.dob} ({u.department || u.Department || 'Team'})
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  headerSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  birthdayList: {
    gap: 12,
  },
  birthdayItemCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  bannerRibbon: {
    backgroundColor: '#f59e0b',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  bannerRibbonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  empRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  empAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  crownBadge: {
    position: 'absolute',
    top: -6,
    right: -4,
  },
  empDetails: {
    flex: 1,
  },
  empName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  empRole: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  empDept: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 2,
  },
  wishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  wishBtnDone: {
    backgroundColor: COLORS.success,
  },
  wishBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  noBirthdayBox: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noBirthdayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  noBirthdayTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  noBirthdaySub: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  upcomingBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  upcomingLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  upcomingText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
