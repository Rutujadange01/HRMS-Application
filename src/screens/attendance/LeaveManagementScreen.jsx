import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
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

  // Date Filter States
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [showFilterBar, setShowFilterBar] = useState(false);

  const userRole = profile?.role || profile?.Role || 'Employee';
  const isEmployee = userRole === 'Employee';

  const profUid = (profile?.uid || profile?.UserID || profile?.id || '').trim().toLowerCase();
  const profName = (profile?.name || profile?.FullName || '').trim().toLowerCase();
  const profEmail = (profile?.email || profile?.Email || '').trim().toLowerCase();

  const displayedLeaves = isEmployee
    ? (leaves || []).filter(l => {
        const lUid = (l.UserID || l.employeeId || '').trim().toLowerCase();
        const lName = (l.employeeName || l.UserName || l.CreatedByUName || '').trim().toLowerCase();
        const lEmail = (l.email || l.Email || '').trim().toLowerCase();
        return (profUid && lUid === profUid) || (profName && lName === profName) || (profEmail && lEmail === profEmail);
      })
    : (leaves || []);

  const dateFilteredLeaves = displayedLeaves.filter(l => {
    const lFrom = l.FromDate || l.startDate || '';
    const lTo = l.Todate || l.endDate || '';
    if (filterFromDate && lFrom < filterFromDate) return false;
    if (filterToDate && lTo > filterToDate) return false;
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

  const handleDelete = (leaveId) => {
    Alert.alert(
      "Cancel Leave Request",
      "Are you sure you want to delete this pending leave request?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes, Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteLeave(leaveId);
              Alert.alert("Deleted", "Pending leave request deleted successfully.");
            } catch (e) {
              Alert.alert("Error", "Could not delete leave request.");
            }
          } 
        }
      ]
    );
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
          <Text style={styles.screenTitle}>{isEmployee ? 'My Leave Applications' : 'Leave & Time-Off Management'}</Text>
          <Text style={styles.screenSub}>{isEmployee ? 'Submit & track your time-off requests' : 'Manage workforce leave applications'}</Text>
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
                onChangeText={setFilterFromDate}
              />
            </View>
            <View style={{ flex: 1 }}>
              <DatePickerInput
                label="To Date"
                placeholder="YYYY-MM-DD"
                value={filterToDate}
                onChangeText={setFilterToDate}
              />
            </View>
          </View>
        </View>
      )}

      {/* Apply / Edit Leave Form Dropdown */}
      {showApplyForm && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{editingLeaveId ? 'Update Pending Leave Application' : 'New Leave Application'}</Text>

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

          {editingLeaveId && (
            <TouchableOpacity 
              onPress={() => { setEditingLeaveId(null); setShowApplyForm(false); }}
              style={{ marginTop: 10, alignItems: 'center' }}
            >
              <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>Cancel Editing</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Existing Leave Requests List */}
      <Text style={styles.sectionTitle}>
        {isEmployee ? 'My Leave Applications' : 'Workforce Leave Applications'} ({dateFilteredLeaves.length})
      </Text>

      {dateFilteredLeaves.length === 0 ? (
        <View style={styles.leaveCard}>
          <Text style={{ color: COLORS.textSecondary, textAlign: 'center', marginVertical: 12 }}>
            {isEmployee ? 'No matching leave applications found.' : 'No leave applications found for selected filter.'}
          </Text>
        </View>
      ) : (
        dateFilteredLeaves.map((item) => {
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

              {/* Action Rows: Admin Approval vs Employee Pending Edit/Delete */}
              {!isEmployee && isPending ? (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={() => handleAction(item.id || item.LeaveID, 'Approved')}
                  >
                    <Check size={16} color="#ffffff" />
                    <Text style={styles.actionBtnText}>Approve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => handleAction(item.id || item.LeaveID, 'Rejected')}
                  >
                    <X size={16} color="#ffffff" />
                    <Text style={styles.actionBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              ) : isPending ? (
                /* Pending Edit & Delete Buttons for Employee */
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: 'rgba(241, 94, 140, 0.15)', borderWidth: 1, borderColor: COLORS.primary }]}
                    onPress={() => handleStartEdit(item)}
                  >
                    <Edit3 size={15} color={COLORS.primary} />
                    <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderWidth: 1, borderColor: COLORS.danger }]}
                    onPress={() => handleDelete(item.id || item.LeaveID)}
                  >
                    <Trash2 size={15} color={COLORS.danger} />
                    <Text style={[styles.actionBtnText, { color: COLORS.danger }]}>Delete</Text>
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
});
