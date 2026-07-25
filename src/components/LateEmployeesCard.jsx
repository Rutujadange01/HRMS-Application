import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { COLORS } from '../constants/theme';
import { Clock, AlertTriangle, AlertCircle, BellRing, CheckCircle2, ShieldAlert, ArrowUpRight } from 'lucide-react-native';

const parseTimeToMinutes = (tStr) => {
  if (!tStr || tStr === '--:--') return null;
  const isPM = /PM/i.test(tStr);
  const isAM = /AM/i.test(tStr);
  const clean = tStr.replace(/(AM|PM)/i, '').trim();
  const parts = clean.split(':');
  let h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;
  return h * 60 + m;
};

export const LateEmployeesCard = ({ attendanceLogs = [], employees = [], profile = {}, navigation }) => {
  const [notified, setNotified] = useState({});

  const todayStr = new Date().toISOString().split('T')[0];
  const userCompanyId = (profile?.companyId || profile?.CompanyID || 'comp_01').trim().toLowerCase();

  // Filter logs for today & current company
  const todayLogs = (attendanceLogs || []).filter(l => {
    const lDate = l.date || l.PostingDate || (l.CreatedOn ? l.CreatedOn.split('T')[0] : '');
    const lCompany = (l.CompanyID || l.companyId || 'comp_01').trim().toLowerCase();
    return lDate === todayStr && (!userCompanyId || lCompany === userCompanyId || userCompanyId === 'comp_01');
  });

  // Calculate late employees
  const lateItems = [];
  const shiftStartMins = 9 * 60; // 09:00 AM
  const graceMins = 15; // 15 mins grace period

  todayLogs.forEach(l => {
    const clockInStr = l.clockIn && l.clockIn !== '--:--' ? l.clockIn : (l.Type === 'In' ? l.Time : null);
    if (!clockInStr) return;

    const clockInMins = parseTimeToMinutes(clockInStr);
    let lateByMins = l.LateMin || 0;

    if (clockInMins && clockInMins > (shiftStartMins + graceMins)) {
      lateByMins = clockInMins - shiftStartMins;
    } else if (l.status && l.status.toLowerCase().includes('late')) {
      lateByMins = lateByMins || 20;
    }

    const isExplicitLate = (l.status && l.status.toLowerCase().includes('late')) || lateByMins > 0;

    if (isExplicitLate) {
      // Find matching employee details from employees list
      const empId = l.UserID || l.employeeId;
      const empName = l.employeeName || l.UserName || 'Employee';
      
      const matchedEmp = (employees || []).find(e => {
        const eId = e.UserID || e.id;
        const eName = e.name || e.FullName;
        return (empId && eId === empId) || (eName && eName.toLowerCase() === empName.toLowerCase());
      });

      lateItems.push({
        id: l.PunchID || l.id || `late_${Math.random()}`,
        empId: empId,
        empName: empName,
        avatar: matchedEmp?.avatar || matchedEmp?.UPhoto || l.Photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        designation: matchedEmp?.designation || matchedEmp?.Designation || 'Team Member',
        department: matchedEmp?.department || matchedEmp?.Department || 'General',
        clockIn: clockInStr,
        lateMins: lateByMins > 0 ? lateByMins : 25,
        shiftTime: '09:00 AM',
        location: l.location || l.Location || 'Office HQ'
      });
    }
  });

  const handleSendReminder = (empName, itemId) => {
    setNotified(prev => ({ ...prev, [itemId]: true }));
    Alert.alert(
      "⚠️ Warning Issued",
      `Late attendance alert and shift policy reminder notice sent to ${empName}.`
    );
  };

  return (
    <View style={styles.cardContainer}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <Clock size={20} color="#ffffff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Late Employees Today</Text>
            <Text style={styles.headerSub}>Shift Start: 09:00 AM • Grace Period: 15 Mins</Text>
          </View>
        </View>

        <View style={[styles.badgeCount, lateItems.length > 0 ? styles.badgeCountLate : styles.badgeCountOk]}>
          <Text style={styles.badgeCountText}>
            {lateItems.length > 0 ? `${lateItems.length} Late Today` : '0 Late Marks'}
          </Text>
        </View>
      </View>

      {/* Main Content List */}
      {lateItems.length > 0 ? (
        <View style={styles.lateList}>
          {lateItems.map((item) => {
            const isNotified = notified[item.id];

            return (
              <View key={item.id} style={styles.lateItemCard}>
                <View style={styles.lateRow}>
                  <View style={styles.avatarWrapper}>
                    <Image source={{ uri: item.avatar }} style={styles.empAvatar} />
                    <View style={styles.alertDot}>
                      <AlertTriangle size={10} color="#ffffff" />
                    </View>
                  </View>

                  <View style={styles.empInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.empName}>{item.empName}</Text>
                      <View style={styles.lateTag}>
                        <Text style={styles.lateTagText}>Late by {item.lateMins}m</Text>
                      </View>
                    </View>

                    <Text style={styles.empRole}>{item.designation} • {item.department}</Text>
                    
                    <View style={styles.timeMetaRow}>
                      <Clock size={12} color={COLORS.textSecondary} />
                      <Text style={styles.timeMetaText}>
                        Clock-in: <Text style={{ fontWeight: '700', color: COLORS.danger }}>{item.clockIn}</Text> (Shift: {item.shiftTime})
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Card Actions */}
                <View style={styles.actionRow}>
                  <TouchableOpacity 
                    style={[styles.remindBtn, isNotified && styles.remindBtnSent]}
                    onPress={() => handleSendReminder(item.empName, item.id)}
                    disabled={isNotified}
                  >
                    <BellRing size={13} color={isNotified ? COLORS.textSecondary : COLORS.danger} />
                    <Text style={[styles.remindBtnText, isNotified && styles.remindBtnTextSent]}>
                      {isNotified ? 'Notice Sent' : 'Send Policy Alert'}
                    </Text>
                  </TouchableOpacity>

                  {navigation && (
                    <TouchableOpacity 
                      style={styles.viewDetailBtn}
                      onPress={() => navigation.navigate('DailyAttendance')}
                    >
                      <Text style={styles.viewDetailText}>Punch Log</Text>
                      <ArrowUpRight size={12} color={COLORS.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.noLateCard}>
          <CheckCircle2 size={24} color={COLORS.success} />
          <View style={{ flex: 1 }}>
            <Text style={styles.noLateTitle}>100% On-Time Attendance!</Text>
            <Text style={styles.noLateSub}>
              All employees in your company arrived within shift grace time today.
            </Text>
          </View>
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
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerBar: {
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
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  headerSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  badgeCount: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeCountLate: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  badgeCountOk: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  badgeCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.danger,
  },
  lateList: {
    gap: 10,
  },
  lateItemCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.04)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  lateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  empAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.danger,
  },
  alertDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.danger,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  empInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  empName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  lateTag: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lateTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.danger,
  },
  empRole: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  timeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  timeMetaText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.6)',
  },
  remindBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  remindBtnSent: {
    backgroundColor: COLORS.inputBg,
  },
  remindBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.danger,
  },
  remindBtnTextSent: {
    color: COLORS.textSecondary,
  },
  viewDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewDetailText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  noLateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  noLateTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.success,
  },
  noLateSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
});
