import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Modal } from 'react-native';
import { HRMSContext } from '../../context/HRMSContext';
import { AuthContext } from '../../context/AuthContext';
import { AttendanceBadge } from '../../components/AttendanceBadge';
import { CustomInput } from '../../components/CustomInput';
import { DatePickerInput } from '../../components/DatePickerInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { COLORS } from '../../constants/theme';
import { Calendar, FileText, Check, X, PlusCircle, Edit3, Trash2, Filter, RotateCcw } from 'lucide-react-native';

export const LeaveManagementScreen = ({ navigation }) => {
  const { profile } = useContext(AuthContext);
  const { leaves, applyLeave, respondToLeave, updateLeave, deleteLeave } = useContext(HRMSContext);

  const [type, setType] = useState('Casual Leave');
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-08-03');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [editingLeaveId, setEditingLeaveId] = useState(null);
  const [activeTab, setActiveTab] = useState('All');

  // Date Filter States
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [showFilterBar, setShowFilterBar] = useState(false);

  const userRole = profile?.role || profile?.Role || 'Employee';

  const profUid = (profile?.uid || profile?.UserID || profile?.id || '').trim().toLowerCase();
  const profName = (profile?.name || profile?.FullName || '').trim().toLowerCase();
  const profEmail = (profile?.email || profile?.Email || '').trim().toLowerCase();

  const displayedLeaves = (leaves || []).filter(l => {
    const lUid = (l.UserID || l.employeeId || '').trim().toLowerCase();
    const lName = (l.employeeName || l.UserName || l.CreatedByUName || '').trim().toLowerCase();
    const lEmail = (l.email || l.Email || '').trim().toLowerCase();
    return (profUid && lUid === profUid) || (profName && lName === profName) || (profEmail && lEmail === profEmail);
  });

  const dateFilteredLeaves = displayedLeaves.filter(l => {
    let rawDate = l.CreatedDate || l.createdDate || l.date || l.FromDate || l.startDate || '';
    let compareDate = rawDate;

    if (compareDate && compareDate.includes('T')) {
      compareDate = compareDate.split('T')[0];
    } else if (compareDate) {
      const dObj = new Date(compareDate);
      if (!isNaN(dObj.getTime())) {
          const y = dObj.getFullYear();
          const m = String(dObj.getMonth() + 1).padStart(2, '0');
          const d = String(dObj.getDate()).padStart(2, '0');
          compareDate = `${y}-${m}-${d}`;
      }
    }

    if (filterFromDate && compareDate < filterFromDate) return false;
    if (filterToDate && compareDate > filterToDate) return false;
    if (activeTab !== 'All') {
      let s = l.Status || l.status || 'Pending';
      if (s.trim().toLowerCase() !== activeTab.toLowerCase()) return false;
    }
    return true;
  });

  const handleApplyOrUpdate = async () => {
    if (!startDate || !endDate || !reason) {
      Alert.alert('Validation Error', 'Start date, end date, and reason are required.');
      return;
    }
    setLoading(true);
    try {
      if (editingLeaveId) {
        await updateLeave(editingLeaveId, {
          type,
          startDate,
          endDate,
          reason
        });
        Alert.alert('Success', 'Leave application details updated successfully.');
        setEditingLeaveId(null);
      } else {
        await applyLeave({
          companyId: profile?.companyId || 'COMP_001',
          employeeId: profile?.uid || profile?.UserID || 'emp_001',
          employeeName: profile?.name || profile?.FullName || 'Employee',
          type,
          startDate,
          endDate,
          reason
        });
        Alert.alert('Success', 'Leave application submitted for approval.');
      }
      setReason('');
      setShowApplyForm(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save leave application.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (item) => {
    setEditingLeaveId(item.id || item.LeaveID);
    setType(item.LeaveType || item.type || 'Casual Leave');
    setStartDate(item.FromDate || item.startDate || '2026-08-01');
    setEndDate(item.Todate || item.endDate || '2026-08-03');
    setReason(item.Reason || item.reason || '');
    setShowApplyForm(true);
  };

  const handleDelete = async (leaveId) => {
    try {
      await deleteLeave(leaveId);
    } catch (e) {
      if (Platform.OS === 'web') window.alert("Error: Could not delete leave request.");
      else Alert.alert("Error", "Could not delete leave request.");
    }
  };

  const handleAction = async (leaveId, status) => {
    try {
      await respondToLeave(leaveId, status, profile);
      Alert.alert('Leave Updated', `Leave application marked as ${status}.`);
    } catch (error) {
      Alert.alert('Error', 'Could not update leave status.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={styles.screenTitle}>My Leave Applications</Text>
          <Text style={styles.screenSub}>Submit & track your time-off requests</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity
            style={styles.toggleFormBtn}
            onPress={() => setShowFilterBar(!showFilterBar)}
          >
            <Filter size={16} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleFormBtn}
            onPress={() => {
              setEditingLeaveId(null);
              setShowApplyForm(!showApplyForm);
            }}
          >
            <PlusCircle size={16} color={COLORS.primary} />
            <Text style={styles.toggleFormText}>{showApplyForm ? 'Hide' : 'Apply'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Range Filter Bar */}
      {showFilterBar && (
        <View style={[styles.card, { padding: 14, marginBottom: 16 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.textPrimary }}>Filter by Date Range</Text>
            {(filterFromDate || filterToDate) ? (
              <TouchableOpacity onPress={() => { setFilterFromDate(''); setFilterToDate(''); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <RotateCcw size={12} color={COLORS.danger} />
                <Text style={{ fontSize: 11, color: COLORS.danger, fontWeight: '600' }}>Clear Filter</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <DatePickerInput
                label="From Date"
                placeholder="YYYY-MM-DD"
                value={filterFromDate}
                onChangeText={(val) => { setFilterFromDate(val); setActiveTab('All'); }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <DatePickerInput
                label="To Date"
                placeholder="YYYY-MM-DD"
                value={filterToDate}
                onChangeText={(val) => { setFilterToDate(val); setActiveTab('All'); }}
              />
            </View>
          </View>
        </View>
      )}

      {/* Apply / Edit Leave Form Dropdown */}
      <Modal visible={showApplyForm} animationType="slide" transparent={true} onRequestClose={() => { setEditingLeaveId(null); setShowApplyForm(false); }}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '90%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={styles.modalTitle}>{editingLeaveId ? 'Update Pending Leave' : 'New Leave Application'}</Text>
              <TouchableOpacity onPress={() => { setEditingLeaveId(null); setShowApplyForm(false); }}>
                <X size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Leave Category</Text>
              <View style={styles.typeRow}>
                {['Casual Leave', 'Sick Leave', 'Paid Leave', 'Unpaid Leave'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeChip, type === t && styles.typeChipActive]}
                    onPress={() => setType(t)}
                  >
                    <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <DatePickerInput
                label="Start Date"
                placeholder="2026-08-01"
                value={startDate}
                onChangeText={setStartDate}
              />

              <DatePickerInput
                label="End Date"
                placeholder="2026-08-03"
                value={endDate}
                onChangeText={setEndDate}
              />

              <CustomInput
                label="Reason for Leave"
                placeholder="Detailed reason..."
                value={reason}
                onChangeText={setReason}
                icon={FileText}
                multiline={true}
                numberOfLines={3}
              />

              <PrimaryButton
                title={editingLeaveId ? "Save & Update Leave Request" : "Submit Leave Request"}
                onPress={handleApplyOrUpdate}
                loading={loading}
                style={{ marginTop: 8 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Existing Leave Requests List */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
          My Leave Applications ({dateFilteredLeaves.length})
        </Text>
      </View>

      {/* Tabs Filter Bar */}
      <View style={{ borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 16, paddingBottom: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {['All', 'Pending', 'Approved', 'Rejected'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabChip, activeTab === t && styles.tabChipActive]}
              onPress={() => setActiveTab(t)}
            >
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {dateFilteredLeaves.length === 0 ? (
        <View style={styles.leaveCard}>
          <Text style={{ color: COLORS.textSecondary, textAlign: 'center', marginVertical: 12 }}>
            No matching leave applications found.
          </Text>
        </View>
      ) : (
        [...dateFilteredLeaves].sort((a,b) => new Date(b.CreatedDate || 0) - new Date(a.CreatedDate || 0)).map((item) => {
          const empDisplay = item.CreatedByUName || item.employeeName || item.UserName || 'Employee';
          const typeDisplay = item.LeaveType || item.type || 'Casual Leave';
          const statusDisplay = item.Status || item.status || 'Pending';
          const fromDisplay = item.FromDate || item.startDate || '';
          const toDisplay = item.Todate || item.endDate || '';
          const reasonDisplay = item.Reason || item.reason || '';

          const isPending = statusDisplay === 'Pending';

          return (
            <View key={item.id || item.LeaveID} style={styles.leaveCard}>
              <View style={styles.leaveTop}>
                <View>
                  <Text style={styles.empName}>{empDisplay}</Text>
                  <Text style={styles.leaveType}>{typeDisplay} • {item.LeaveDays || 1} Days</Text>
                </View>
                <AttendanceBadge status={statusDisplay} />
              </View>

              <View style={styles.datesRow}>
                <Calendar size={14} color={COLORS.textSecondary} />
                <Text style={styles.datesText}>
                  {fromDisplay} to {toDisplay}
                </Text>
              </View>

              <Text style={styles.reasonText}>"{reasonDisplay}"</Text>

              {statusDisplay === 'Approved' && item.Approveddate && (
                <View style={styles.statusDetailRow}>
                  <Text style={styles.statusDetailText}>
                    Approved on: {item.Approveddate.split('T')[0]}
                  </Text>
                </View>
              )}

              {statusDisplay === 'Rejected' && (
                <View style={[styles.statusDetailRow, { backgroundColor: 'rgba(239, 68, 68, 0.05)' }]}>
                  <Text style={[styles.statusDetailText, { color: COLORS.danger }]}>
                    Rejected on: {(item.Rejecteddate || item.UpdatedDate || '').split('T')[0]}
                  </Text>
                  {(item.Rejection_Reason || item.Remark) && (
                    <Text style={[styles.statusDetailText, { color: COLORS.danger, marginTop: 4, fontStyle: 'italic' }]}>
                      Reason: {item.Rejection_Reason || item.Remark}
                    </Text>
                  )}
                </View>
              )}

              {/* User Actions */}
              {isPending ? (
                <View style={styles.userActionRow}>
                  <TouchableOpacity style={styles.iconActionBtn} onPress={() => handleStartEdit(item)}>
                    <Edit3 size={16} color={COLORS.primary} />
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.iconActionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]} onPress={() => handleDelete(item.id || item.LeaveID)}>
                    <Trash2 size={16} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          );
        })
      )}
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
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  screenSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  toggleFormBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 4,
    shrink: 0,
  },
  toggleFormText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  typeChip: {
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeChipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  typeChipTextActive: {
    color: '#ffffff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 14,
  },
  leaveCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  leaveTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  empName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  leaveType: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  datesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
  },
  datesText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  reasonText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  userActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  iconActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDetailRow: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#f4f4f5',
    borderRadius: 8,
  },
  statusDetailText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 36,
    borderRadius: 10,
    gap: 6,
  },
  approveBtn: {
    backgroundColor: COLORS.success,
  },
  rejectBtn: {
    backgroundColor: COLORS.danger,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});
