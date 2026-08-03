import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { HRMSContext } from '../../context/HRMSContext';
import { AttendanceBadge } from '../../components/AttendanceBadge';
import { COLORS } from '../../constants/theme';
import { ArrowLeft, Clock, Calendar, Receipt, FileEdit, Check, X, Filter, Users } from 'lucide-react-native';
import { DatePickerInput } from '../../components/DatePickerInput';

export const NotificationHubScreen = ({ navigation }) => {
  const { profile } = useContext(AuthContext);
  const {
    employees,
    leaves,
    correctionRequests,
    expenseClaims,
    missPunches,
    respondToLeave,
    respondToCorrectionRequest,
    respondToExpenseClaim,
    respondToMissPunch
  } = useContext(HRMSContext);

  const [activeTab, setActiveTab] = useState('Leaves');
  const [activeStatus, setActiveStatus] = useState('All');
  const [rejectData, setRejectData] = useState(null); // { type, id }
  const [rejectReason, setRejectReason] = useState('');

  const firstDay = new Date();
  firstDay.setDate(1);
  const [fromDate, setFromDate] = useState(firstDay.toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);

  const myEmpId = String(profile?.uid || profile?.UserID).toLowerCase().trim();

  const canApproveRequest = (itemEmpId) => {
    const reqEmp = (employees || []).find(e => String(e.UserID || e.id || e.UserCode).toLowerCase().trim() === itemEmpId);
    const reqReportingTo = String(reqEmp?.reportingTo || reqEmp?.ReportingTo || '').toLowerCase().trim();
    if (reqReportingTo === myEmpId) return true;
    return false;
  };

  const filterRequests = (list, idField) => {
    return (list || []).filter(item => {
      const itemEmpId = String(item[idField] || item.employeeId || item.employeeName || item.UserID).toLowerCase().trim();

      if (itemEmpId === myEmpId) return false;

      const reqEmp = (employees || []).find(e => String(e.UserID || e.id || e.UserCode).toLowerCase().trim() === itemEmpId);
      const reqReportingTo = String(reqEmp?.reportingTo || reqEmp?.ReportingTo || '').toLowerCase().trim();
      if (reqReportingTo === myEmpId) return true;

      return false;
    }).sort((a, b) => {
      const dateA = a.createdDate || a.CreatedDate || a.date || '';
      const dateB = b.createdDate || b.CreatedDate || b.date || '';
      return dateB.localeCompare(dateA);
    });
  };

  const pendingLeaves = filterRequests(leaves, 'employeeId');
  const pendingCorrections = filterRequests(correctionRequests, 'employeeId');
  const pendingExpenses = filterRequests(expenseClaims, 'employeeId');
  const pendingMissPunches = filterRequests(missPunches, 'employeeId');

  const handleApprove = (type, id) => {
    processRequest(type, id, 'Approved', '');
  };

  const openRejectModal = (type, id) => {
    setRejectData({ type, id });
    setRejectReason('');
  };

  const submitReject = () => {
    if (!rejectReason.trim()) {
      Alert.alert("Error", "Please provide a reason for rejection.");
      return;
    }
    processRequest(rejectData.type, rejectData.id, 'Rejected', rejectReason.trim());
    setRejectData(null);
  };

  const processRequest = async (type, id, status, reason = '') => {
    const approverName = profile?.name || profile?.FullName || profile?.Username || 'Admin';
    const approverUid = profile?.uid || profile?.UserID || 'unknown';

    try {
      if (type === 'Leave') {
        const enhancedProfile = { ...profile, remark: reason };
        await respondToLeave(id, status, enhancedProfile);
      } else if (type === 'Correction') {
        await respondToCorrectionRequest(id, status, approverName, approverUid, reason);
      } else if (type === 'Expense') {
        await respondToExpenseClaim(id, status, reason, approverName);
      } else if (type === 'MissPunch') {
        await respondToMissPunch(id, status, approverName, approverUid, reason);
      }
    } catch (error) {
      if (Platform.OS === 'web') window.alert(`Failed to process request: ${error.message}`);
      else Alert.alert("Error", `Failed to process request: ${error.message}`);
    }
  };

  const renderCard = (item, idx, type) => {
    const itemEmpId = String(item.employeeId || item.employeeName || item.UserID).toLowerCase().trim();
    const empData = (employees || []).find(e => String(e.UserID || e.id || e.UserCode).toLowerCase().trim() === itemEmpId);
    const empName = empData?.name || empData?.FullName || item.employeeName || item.UserName || item.CreatedByUName || 'Employee';
    const reqStatus = item.status || item.Status || 'Pending';
    const hasApprovalRights = canApproveRequest(itemEmpId) && itemEmpId !== myEmpId;

    const corrType = item.correction_type || item.correctionType || item.CorrectionType || item.MissPunch_type;
    const typeDisplay = item.LeaveType || item.type || item.expenseType || item.Category || item.Expense_Desc || (type === 'Correction' ? '' : (type === 'MissPunch' ? 'Missed Punch' : type));
    
    if (type === 'Correction') {
      console.log('--- CORRECTION REQUEST ITEM ---', JSON.stringify(item, null, 2));
    }

    const fallbackDate = item.CreatedDate ? item.CreatedDate.split('T')[0] : 'N/A';
    const fromDisplay = item.FromDate || item.startDate || item.date || item.leaveDate || item.PostingDate || item.Expense_Date || item.PunchDate || item.Original_Date || item.originalDate || item.MissPunch_Date || fallbackDate;
    const toDisplay = item.Todate || item.endDate || item.Correction_Date || item.correctionDate || fromDisplay;
    const reasonDisplay = item.Reason || item.reason || item.description || item.Description || item.notes || '';
    const daysDisplay = item.LeaveDays ? ` • ${item.LeaveDays} Days` : ((item.Total_Amount || item.amount) ? ` • ₹${item.Total_Amount || item.amount}` : (item.Requested_Time ? ` • ${item.Requested_Time}` : ''));

    let extraCorrectionDetails = null;
    let actualPunches = null;
    if (type === 'Correction') {
      const rInVal = item.Requested_CheckIn || item.RequestedCheckIn;
      const rOutVal = item.Requested_CheckOut || item.RequestedCheckOut;
      const rIn = rInVal && rInVal !== '--:--' ? rInVal : '';
      const rOut = rOutVal && rOutVal !== '--:--' ? rOutVal : '';
      if (rIn || rOut) {
        extraCorrectionDetails = `Requested: ${rIn ? `IN ${rIn}` : ''} ${rIn && rOut ? '|' : ''} ${rOut ? `OUT ${rOut}` : ''}`;
      }
      
      const aInVal = item.Added_CheckIn || item.AddedCheckIn;
      const aOutVal = item.Added_CheckOut || item.AddedCheckOut;
      const aIn = aInVal && aInVal !== '--:--' ? aInVal : '';
      const aOut = aOutVal && aOutVal !== '--:--' ? aOutVal : '';
      if (aIn || aOut) {
        actualPunches = `Actual: ${aIn ? `IN ${aIn}` : ''}${aIn && aOut ? ' | ' : ''}${aOut ? `OUT ${aOut}` : ''}`;
      }
    }

    return (
      <View key={item.id || item.ID || item.LeaveID || idx} style={styles.leaveCard}>
        <View style={styles.leaveTop}>
          <View>
            <Text style={styles.empName}>{itemEmpId === myEmpId ? 'My Request' : empName}</Text>
            {!!typeDisplay && <Text style={styles.leaveType}>{typeDisplay}{daysDisplay}</Text>}
          </View>
          <AttendanceBadge status={reqStatus} />
        </View>

        <View style={styles.datesRow}>
          {type === 'Leave' ? <Calendar size={14} color={COLORS.textSecondary} /> : (type === 'Correction' ? <FileEdit size={14} color={COLORS.textSecondary} /> : (type === 'MissPunch' ? <Clock size={14} color={COLORS.textSecondary} /> : <Receipt size={14} color={COLORS.textSecondary} />))}
          <Text style={styles.datesText}>
            {type === 'Correction' && fromDisplay && toDisplay && fromDisplay !== toDisplay
              ? `Original: ${fromDisplay} | Target: ${toDisplay}`
              : `${fromDisplay}${fromDisplay !== toDisplay && toDisplay ? ` to ${toDisplay}` : ''}`}
          </Text>
        </View>

        {!!actualPunches && <Text style={[styles.reasonText, { fontStyle: 'normal', fontSize: 11, color: COLORS.textSecondary, marginTop: 4 }]}>{actualPunches}</Text>}
        {!!extraCorrectionDetails && <Text style={[styles.reasonText, { fontStyle: 'normal', fontWeight: '600', marginTop: 2, color: COLORS.primary }]}>{extraCorrectionDetails}</Text>}
        {!!reasonDisplay && <Text style={styles.reasonText}>"{reasonDisplay}"</Text>}

        {reqStatus === 'Approved' && item.Approveddate && (
          <View style={styles.statusDetailRow}>
            <Text style={styles.statusDetailText}>
              Approved on: {item.Approveddate.split('T')[0]}
            </Text>
          </View>
        )}

        {reqStatus === 'Rejected' && (
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

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          {(type === 'Correction' || type === 'MissPunch') && corrType ? (
            <View style={[styles.badge, { 
              backgroundColor: String(corrType).toLowerCase() === 'in' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(59, 130, 246, 0.1)', 
              paddingVertical: 4, 
              paddingHorizontal: 8 
            }]}>
              <Text style={{ 
                fontSize: 11, 
                color: String(corrType).toLowerCase() === 'in' ? '#000000' : COLORS.primary, 
                fontWeight: '600' 
              }}>
                {type === 'MissPunch' ? 'Missed ' + corrType : corrType}
              </Text>
            </View>
          ) : <View />}

          {hasApprovalRights && reqStatus === 'Pending' ? (
            <View style={[styles.actionRow, { marginTop: 0 }]}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}
                onPress={() => handleApprove(type, item.id || item.ID || item.LeaveID)}
              >
                <Check size={16} color={COLORS.success} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
                onPress={() => openRejectModal(type, item.id || item.ID || item.LeaveID)}
              >
                <X size={16} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  const renderActiveList = () => {
    let data = [];
    let type = '';
    let icon = null;

    if (activeTab === 'Leaves') {
      data = pendingLeaves; type = 'Leave'; icon = Calendar;
    } else if (activeTab === 'Corrections') {
      data = pendingCorrections; type = 'Correction'; icon = FileEdit;
    } else if (activeTab === 'Expenses') {
      data = pendingExpenses; type = 'Expense'; icon = Receipt;
    } else if (activeTab === 'MissPunches') {
      data = pendingMissPunches; type = 'MissPunch'; icon = Clock;
    }

    const IconC = icon;

    if (activeStatus !== 'All') {
      data = data.filter(item => {
        const s = item.status || item.Status || 'Pending';
        return s === activeStatus;
      });
    }

    data = data.filter(item => {
      let itemDate = item.CreatedDate || item.createdDate || item.date || item.Original_Date || item.Expense_Date || item.FromDate || item.Correction_Date;
      if (!itemDate) return true;
      const d = itemDate.split('T')[0];
      return d >= fromDate && d <= toDate;
    });

    data.sort((a, b) => {
      const d1 = new Date(b.CreatedDate || b.createdDate || b.date || b.Original_Date || b.Expense_Date || b.FromDate || b.Correction_Date || 0);
      const d2 = new Date(a.CreatedDate || a.createdDate || a.date || a.Original_Date || a.Expense_Date || a.FromDate || a.Correction_Date || 0);
      return d1 - d2;
    });

    if (data.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Clock size={48} color={COLORS.border} />
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptyDesc}>There are no requests here.</Text>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <IconC size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>{activeTab} History & Pending</Text>
        </View>
        {data.map((item, idx) => renderCard(item, idx, type))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <View style={styles.tabContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={styles.tabScroll}>
            {['Leaves', 'Corrections', 'MissPunches', 'Expenses'].map((tab) => {
              const list = tab === 'Leaves' ? pendingLeaves : (tab === 'Corrections' ? pendingCorrections : (tab === 'MissPunches' ? pendingMissPunches : pendingExpenses));
              const count = list.filter(item => {
                const s = item.status || item.Status || 'Pending';
                return s === 'Pending';
              }).length;

              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                  {count > 0 && (
                    <View style={[styles.badge, activeTab === tab && styles.badgeActive]}>
                      <Text style={[styles.badgeText, activeTab === tab && styles.badgeTextActive]}>{count}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )
            })}
          </ScrollView>
          <TouchableOpacity 
            style={{ paddingHorizontal: 16, height: 50, justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: COLORS.border }}
            onPress={() => setShowDateModal(true)}
          >
            <Calendar size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={styles.filterScroll}>
            {['All', 'Pending', 'Approved', 'Rejected'].map((statusTab) => (
              <TouchableOpacity
                key={statusTab}
                style={[styles.filterChip, activeStatus === statusTab && styles.filterChipActive]}
                onPress={() => setActiveStatus(statusTab)}
              >
                <Text style={[styles.filterText, activeStatus === statusTab && styles.filterTextActive]}>{statusTab}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity 
            style={{ paddingHorizontal: 16, paddingVertical: 10, justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: COLORS.border }}
            onPress={() => setShowStatsModal(true)}
          >
            <Users size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {renderActiveList()}
      </ScrollView>

      {/* Reject Reason Modal */}
      <Modal
        visible={!!rejectData}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRejectData(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Reject Request</Text>
            <Text style={styles.modalSub}>Please provide a reason for rejecting this request.</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={4}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setRejectData(null)}>
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSubmit} onPress={submitReject}>
                <Text style={styles.modalBtnSubmitText}>Reject Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Date Filter Modal */}
      <Modal visible={showDateModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={[styles.modalTitle, { marginBottom: 0 }]}>Filter by Date</Text>
              <TouchableOpacity onPress={() => setShowDateModal(false)}>
                <X size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <DatePickerInput
              label="From Date"
              value={fromDate}
              onChangeText={setFromDate}
            />
            <View style={{ height: 16 }} />
            <DatePickerInput
              label="To Date"
              value={toDate}
              onChangeText={setToDate}
            />

            <View style={[styles.modalActions, { marginTop: 24 }]}>
              <TouchableOpacity style={[styles.modalBtnSubmit, { flex: 1 }]} onPress={() => setShowDateModal(false)}>
                <Text style={styles.modalBtnSubmitText}>Apply Filter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Employee Approved Leaves Modal */}
      <Modal visible={showStatsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '80%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={styles.modalTitle}>Approved Leaves</Text>
              <TouchableOpacity onPress={() => setShowStatsModal(false)}>
                <X size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {(employees || []).map((emp) => {
                const empId = String(emp.UserID || emp.id || emp.UserCode).toLowerCase().trim();
                const empName = emp.FullName || emp.name || emp.Name || 'Unknown Employee';
                
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();

                const approvedCount = (leaves || []).filter(l => {
                  const lEmpId = String(l.employeeId || l.UserID).toLowerCase().trim();
                  const lStatus = l.status || l.Status || 'Pending';
                  
                  let itemDate = l.CreatedDate || l.createdDate || l.date || l.FromDate || l.Original_Date;
                  let isCurrentMonth = false;
                  if (itemDate) {
                    const d = new Date(itemDate);
                    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                      isCurrentMonth = true;
                    }
                  }

                  return lEmpId === empId && lStatus === 'Approved' && isCurrentMonth;
                }).length;

                if (approvedCount === 0) return null;

                return (
                  <View key={empId} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
                    <Text style={{ fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' }}>{empName}</Text>
                    <View style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                      <Text style={{ fontSize: 12, color: '#16a34a', fontWeight: '700' }}>{approvedCount}</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { marginRight: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  tabContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabScroll: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  filterContainer: {
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: '#ffffff',
  },
  badge: {
    backgroundColor: '#e4e4e7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  badgeTextActive: {
    color: '#ffffff',
  },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginLeft: 8, flex: 1 },

  leaveCard: {
    backgroundColor: '#ffffff',
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
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginTop: 16 },
  emptyDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8 },

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
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#f4f4f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalBtnCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalBtnCancelText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  modalBtnSubmit: {
    backgroundColor: COLORS.danger,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalBtnSubmitText: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '600',
  },
});
