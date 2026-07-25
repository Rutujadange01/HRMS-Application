import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { AttendanceBadge } from '../../components/AttendanceBadge';
import { COLORS } from '../../constants/theme';
import { Mail, Phone, Calendar, Shield, ArrowLeft, Trash2, Edit3, Save, X, IndianRupee, Camera, Check, Building, CreditCard, Landmark, User } from 'lucide-react-native';
import { HRMSContext } from '../../context/HRMSContext';
import { CustomInput } from '../../components/CustomInput';
import { DatePickerInput } from '../../components/DatePickerInput';
import { PrimaryButton } from '../../components/PrimaryButton';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
];

export const EmployeeDetailScreen = ({ route, navigation }) => {
  const { deleteEmployee, updateEmployee, departments } = useContext(HRMSContext);

  const initialEmp = route.params?.employee || {
    id: 'emp_001',
    UserID: 'emp_001',
    name: 'Sarah Jenkins',
    FullName: 'Sarah Jenkins',
    email: 'sarah.j@acmeenterprise.com',
    Email: 'sarah.j@acmeenterprise.com',
    role: 'Admin',
    Role: 'Admin',
    department: 'Human Resources',
    Department: 'Human Resources',
    designation: 'VP of People Operations',
    Designation: 'VP of People Operations',
    phone: '+91 98765 43210',
    MobileNo: '+91 98765 43210',
    status: 'Active',
    Status: 'Active',
    joiningDate: '2021-03-15',
    salaryTier: '₹85,000 / mo',
    MonthlyPayAmt: 85000,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
  };

  const [currentEmp, setCurrentEmp] = useState(initialEmp);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form Edit State
  const [editName, setEditName] = useState(currentEmp.FullName || currentEmp.name || '');
  const [editDesignation, setEditDesignation] = useState(currentEmp.Designation || currentEmp.designation || '');
  const [editDepartment, setEditDepartment] = useState(currentEmp.department || currentEmp.Department || 'Engineering & Tech');
  const [editEmail, setEditEmail] = useState(currentEmp.Email || currentEmp.email || '');
  const [editPhone, setEditPhone] = useState(currentEmp.MobileNo || currentEmp.phone || '');
  const [editRole, setEditRole] = useState(currentEmp.Role || currentEmp.role || 'Employee');
  const [editSalary, setEditSalary] = useState(String(currentEmp.MonthlyPayAmt || 45000));
  const [editStatus, setEditStatus] = useState(currentEmp.status || currentEmp.Status || 'Active');
  const [editAvatar, setEditAvatar] = useState(currentEmp.avatar || currentEmp.UPhoto || AVATAR_PRESETS[0]);
  const [editDob, setEditDob] = useState(currentEmp.dob || currentEmp.DOB || '1995-01-15');
  const [editDoj, setEditDoj] = useState(currentEmp.joiningDate || currentEmp.DOJ || '2021-03-15');
  const [editBankName, setEditBankName] = useState(currentEmp.bankName || currentEmp.BankName || 'HDFC Bank Ltd');
  const [editAccountNo, setEditAccountNo] = useState(currentEmp.accountNo || currentEmp.AccountNo || '50100298765432');
  const [editIfscCode, setEditIfscCode] = useState(currentEmp.ifscCode || currentEmp.IFSCCode || 'HDFC0001234');
  const [editBranchName, setEditBranchName] = useState(currentEmp.branchName || currentEmp.BranchName || 'Main HQ Branch');
  const [editAccountHolderName, setEditAccountHolderName] = useState(currentEmp.accountHolderName || currentEmp.AccountHolderName || currentEmp.name || currentEmp.FullName || '');

  const openEditModal = () => {
    setEditName(currentEmp.FullName || currentEmp.name || '');
    setEditDesignation(currentEmp.Designation || currentEmp.designation || '');
    setEditDepartment(currentEmp.department || currentEmp.Department || 'Engineering & Tech');
    setEditEmail(currentEmp.Email || currentEmp.email || '');
    setEditPhone(currentEmp.MobileNo || currentEmp.phone || '');
    setEditRole(currentEmp.Role || currentEmp.role || 'Employee');
    setEditSalary(String(currentEmp.MonthlyPayAmt || 45000));
    setEditStatus(currentEmp.status || currentEmp.Status || 'Active');
    setEditAvatar(currentEmp.avatar || currentEmp.UPhoto || AVATAR_PRESETS[0]);
    setEditDob(currentEmp.dob || currentEmp.DOB || '1995-01-15');
    setEditDoj(currentEmp.joiningDate || currentEmp.DOJ || '2021-03-15');
    setEditBankName(currentEmp.bankName || currentEmp.BankName || 'HDFC Bank Ltd');
    setEditAccountNo(currentEmp.accountNo || currentEmp.AccountNo || '50100298765432');
    setEditIfscCode(currentEmp.ifscCode || currentEmp.IFSCCode || 'HDFC0001234');
    setEditBranchName(currentEmp.branchName || currentEmp.BranchName || 'Main HQ Branch');
    setEditAccountHolderName(currentEmp.accountHolderName || currentEmp.AccountHolderName || currentEmp.name || currentEmp.FullName || '');
    setEditModalVisible(true);
  };

  const handleUpdate = async () => {
    if (!editName || !editEmail || !editDesignation) {
      Alert.alert('Validation Error', 'Full Name, Work Email and Designation are required.');
      return;
    }

    setLoading(true);
    try {
      const empId = currentEmp.UserID || currentEmp.id || currentEmp.employeeId;
      const updatedFields = {
        FullName: editName,
        name: editName,
        Designation: editDesignation,
        designation: editDesignation,
        Department: editDepartment,
        department: editDepartment,
        Email: editEmail,
        email: editEmail,
        MobileNo: editPhone,
        phone: editPhone,
        Role: editRole,
        role: editRole,
        MonthlyPayAmt: Number(editSalary) || 45000,
        salaryTier: `₹${Number(editSalary || 45000).toLocaleString('en-IN')} / mo`,
        Status: editStatus,
        status: editStatus,
        UPhoto: editAvatar,
        avatar: editAvatar,
        DOB: editDob,
        dob: editDob,
        DOJ: editDoj,
        joiningDate: editDoj,
        BankName: editBankName,
        bankName: editBankName,
        AccountNo: editAccountNo,
        accountNo: editAccountNo,
        IFSCCode: editIfscCode,
        ifscCode: editIfscCode,
        BranchName: editBranchName,
        branchName: editBranchName,
        AccountHolderName: editAccountHolderName,
        accountHolderName: editAccountHolderName,
        UpdatedOn: new Date().toISOString()
      };

      await updateEmployee(empId, updatedFields);

      const merged = { ...currentEmp, ...updatedFields };
      setCurrentEmp(merged);
      setEditModalVisible(false);

      Alert.alert("Success", "User Updated");
    } catch (error) {
      Alert.alert('Database Error', `Failed to update Employee: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Remove Employee",
      `Are you sure you want to remove ${currentEmp.name || currentEmp.FullName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const empId = currentEmp.UserID || currentEmp.id;
            await deleteEmployee(empId);
            navigation.goBack();
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Actions */}
      <View style={styles.headerNav}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={COLORS.primary} />
          <Text style={styles.backText}>Back to Directory</Text>
        </TouchableOpacity>

        <View style={styles.actionHeaderBtns}>
          <TouchableOpacity style={styles.editBtn} onPress={openEditModal}>
            <Edit3 size={16} color="#ffffff" />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Trash2 size={18} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Card Header */}
      <View style={styles.profileCard}>
        <Image source={{ uri: currentEmp.avatar || currentEmp.UPhoto || AVATAR_PRESETS[0] }} style={styles.avatar} />
        <Text style={styles.name}>{currentEmp.name || currentEmp.FullName}</Text>
        <Text style={styles.designation}>{currentEmp.designation || currentEmp.Designation}</Text>
        <Text style={styles.department}>{currentEmp.department || currentEmp.Department}</Text>
        
        <View style={styles.badgeWrapper}>
          <AttendanceBadge status={currentEmp.status || currentEmp.Status || 'Active'} />
        </View>
      </View>

      {/* Contact & Job Details */}
      <View style={styles.detailsCard}>
        <Text style={styles.cardHeader}>Personal & Employment Details</Text>

        <View style={styles.row}>
          <Mail size={18} color={COLORS.primary} />
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Email Address</Text>
            <Text style={styles.rowValue}>{currentEmp.email || currentEmp.Email}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <Phone size={18} color={COLORS.primary} />
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Phone Number</Text>
            <Text style={styles.rowValue}>{currentEmp.phone || currentEmp.MobileNo || '+91 98765 43210'}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <Shield size={18} color={COLORS.primary} />
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>System Access Role</Text>
            <Text style={styles.rowValue}>{currentEmp.role || currentEmp.Role}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <IndianRupee size={18} color={COLORS.primary} />
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Monthly Pay Amount</Text>
            <Text style={styles.rowValue}>{currentEmp.salaryTier || `₹${Number(currentEmp.MonthlyPayAmt || 45000).toLocaleString('en-IN')} / mo`}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <Calendar size={18} color={COLORS.primary} />
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Date of Birth</Text>
            <Text style={styles.rowValue}>{currentEmp.dob || currentEmp.DOB || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <Calendar size={18} color={COLORS.primary} />
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Date Joined</Text>
            <Text style={styles.rowValue}>{currentEmp.joiningDate || currentEmp.DOJ || '2021-03-15'}</Text>
          </View>
        </View>
      </View>

      {/* Bank Account Details Card */}
      <View style={styles.detailsCard}>
        <Text style={styles.cardHeader}>🏦 Bank Account & Payroll Details</Text>

        <View style={styles.row}>
          <Building size={18} color={COLORS.primary} />
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Bank Name</Text>
            <Text style={styles.rowValue}>{currentEmp.bankName || currentEmp.BankName || 'HDFC Bank Ltd'}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <User size={18} color={COLORS.primary} />
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Account Holder Name</Text>
            <Text style={styles.rowValue}>{currentEmp.accountHolderName || currentEmp.AccountHolderName || currentEmp.name || currentEmp.FullName}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <CreditCard size={18} color={COLORS.primary} />
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Bank Account Number</Text>
            <Text style={styles.rowValue}>{currentEmp.accountNo || currentEmp.AccountNo || '50100298765432'}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <Shield size={18} color={COLORS.primary} />
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>IFSC Code</Text>
            <Text style={styles.rowValue}>{currentEmp.ifscCode || currentEmp.IFSCCode || 'HDFC0001234'}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <Landmark size={18} color={COLORS.primary} />
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Branch Name</Text>
            <Text style={styles.rowValue}>{currentEmp.branchName || currentEmp.BranchName || 'Main HQ Branch'}</Text>
          </View>
        </View>
      </View>

      {/* Edit Employee Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit & Update Employee</Text>
                <Text style={styles.modalSub}>Update profile details for '{currentEmp.name || currentEmp.FullName}'</Text>
              </View>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 450 }} showsVerticalScrollIndicator={false}>
              {/* Profile Avatar Selection */}
              <Text style={styles.sectionLabel}>📷 Profile Photo / Avatar</Text>
              <View style={styles.avatarPickerRow}>
                <Image source={{ uri: editAvatar }} style={styles.previewAvatar} />
                <View style={styles.avatarPickerMeta}>
                  <Text style={styles.avatarPickerTitle}>Selected Photo</Text>
                  <Text style={styles.avatarPickerSub}>Select photo for employee card</Text>
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
                {AVATAR_PRESETS.map((url, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    onPress={() => setEditAvatar(url)} 
                    style={[styles.presetItem, editAvatar === url && styles.presetItemActive]}
                  >
                    <Image source={{ uri: url }} style={styles.presetImg} />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <CustomInput
                label="Full Name"
                value={editName}
                onChangeText={setEditName}
                icon={Mail}
              />

              <CustomInput
                label="Designation / Job Title"
                value={editDesignation}
                onChangeText={setEditDesignation}
                icon={Mail}
              />

              <CustomInput
                label="Work Email Address"
                value={editEmail}
                onChangeText={setEditEmail}
                icon={Mail}
                keyboardType="email-address"
              />

              <CustomInput
                label="Mobile Phone"
                value={editPhone}
                onChangeText={setEditPhone}
                icon={Phone}
                keyboardType="phone-pad"
              />

              <CustomInput
                label="Monthly Pay Amount"
                value={editSalary}
                onChangeText={setEditSalary}
                icon={IndianRupee}
                keyboardType="numeric"
              />

              <DatePickerInput
                label="Date of Birth"
                value={editDob}
                onChangeText={setEditDob}
              />

              <DatePickerInput
                label="Date of Joining"
                value={editDoj}
                onChangeText={setEditDoj}
              />

              <Text style={styles.sectionLabel}>🏦 Bank Account Information</Text>

              <CustomInput
                label="Bank Name"
                value={editBankName}
                onChangeText={setEditBankName}
                icon={Building}
              />

              <CustomInput
                label="Account Holder Name"
                value={editAccountHolderName}
                onChangeText={setEditAccountHolderName}
                icon={User}
              />

              <CustomInput
                label="Bank Account Number"
                value={editAccountNo}
                onChangeText={setEditAccountNo}
                icon={CreditCard}
                keyboardType="numeric"
              />

              <CustomInput
                label="IFSC Code"
                value={editIfscCode}
                onChangeText={setEditIfscCode}
                icon={Shield}
              />

              <CustomInput
                label="Branch Name"
                value={editBranchName}
                onChangeText={setEditBranchName}
                icon={Landmark}
              />

              <Text style={styles.sectionLabel}>Department</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {departments.map((dept) => (
                  <TouchableOpacity
                    key={dept.id || dept.DepartmentID}
                    style={[styles.chip, editDepartment === (dept.DepartmentName || dept.name) && styles.chipActive]}
                    onPress={() => setEditDepartment(dept.DepartmentName || dept.name)}
                  >
                    <Text style={[styles.chipText, editDepartment === (dept.DepartmentName || dept.name) && styles.chipTextActive]}>
                      {dept.DepartmentName || dept.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.sectionLabel}>System Access Role</Text>
              <View style={styles.chipRow}>
                {['Admin', 'Manager', 'HR', 'Employee'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.chip, editRole === r && styles.chipActive]}
                    onPress={() => setEditRole(r)}
                  >
                    <Text style={[styles.chipText, editRole === r && styles.chipTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionLabel}>Status</Text>
              <View style={styles.chipRow}>
                {['Active', 'Inactive', 'On Leave'].map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.chip, editStatus === st && styles.chipActive]}
                    onPress={() => setEditStatus(st)}
                  >
                    <Text style={[styles.chipText, editStatus === st && styles.chipTextActive]}>{st}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <PrimaryButton
              title="Save & Update Employee"
              onPress={handleUpdate}
              loading={loading}
              icon={Save}
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      </Modal>
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
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  actionHeaderBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 10,
  },
  profileCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: COLORS.primary,
    marginBottom: 12,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  designation: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  department: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  badgeWrapper: {
    marginTop: 12,
  },
  detailsCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowContent: {
    marginLeft: 14,
  },
  rowLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  rowValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginTop: 2,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 18,
  },
  modalContent: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 12,
    marginBottom: 6,
  },
  avatarPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarPickerMeta: {
    flex: 1,
  },
  avatarPickerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  avatarPickerSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  presetScroll: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  presetItem: {
    padding: 2,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: 8,
  },
  presetItemActive: {
    borderColor: COLORS.primary,
  },
  presetImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: '#ffffff',
  },
});
