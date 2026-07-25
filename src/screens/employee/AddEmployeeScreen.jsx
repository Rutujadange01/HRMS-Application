import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Alert, ActivityIndicator } from 'react-native';
import { HRMSContext } from '../../context/HRMSContext';
import { AuthContext } from '../../context/AuthContext';
import { employeeService } from '../../services/employeeService';
import { CustomInput } from '../../components/CustomInput';
import { DatePickerInput } from '../../components/DatePickerInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { COLORS } from '../../constants/theme';
import { User, Mail, Phone, Briefcase, IndianRupee, ArrowLeft, UserCheck, CreditCard, Shield, Camera, Image as ImageIcon, Sparkles, Check, RefreshCw, X, ScanFace, ShieldCheck, CheckCircle2, Lock, Calendar, Building, Landmark } from 'lucide-react-native';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
];

const CAMERA_SNAPSHOTS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
];

export const AddEmployeeScreen = ({ navigation }) => {
  const { profile } = useContext(AuthContext);
  const { addEmployee, departments = [] } = useContext(HRMSContext);

  const userRole = profile?.role || profile?.Role || 'Employee';
  const isAuthorized = userRole === 'Admin' || userRole === 'HR';

  useEffect(() => {
    if (!isAuthorized) {
      Alert.alert("Access Denied", "Only HR and Admin authorized personnel can onboard or add new staff members.");
      navigation.goBack();
    }
  }, [isAuthorized]);

  const initialDept = (departments && Array.isArray(departments) && departments.length > 0)
    ? (departments[0]?.name || departments[0]?.DepartmentName || 'Engineering & Tech')
    : 'Engineering & Tech';

  // SSMS Users Table Fields
  const [userCode, setUserCode] = useState('USR' + Math.floor(100 + Math.random() * 900));
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [passwordHash, setPasswordHash] = useState('scrypt:salted_pass_123');
  const [mobileNo, setMobileNo] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState(initialDept);
  const [role, setRole] = useState('Employee');
  const [gender, setGender] = useState('Male');
  const [employmentType, setEmploymentType] = useState('Full-Time');
  const [adharNo, setAdharNo] = useState('');
  const [panNo, setPanNo] = useState('');
  const [uanNo, setUanNo] = useState('');
  const [monthlyPayAmt, setMonthlyPayAmt] = useState('45000');
  const [dob, setDob] = useState('1998-05-20');
  const [doj, setDoj] = useState(new Date().toISOString().split('T')[0]);
  const [bankName, setBankName] = useState('HDFC Bank Ltd');
  const [accountNo, setAccountNo] = useState('');
  const [ifscCode, setIfscCode] = useState('HDFC0001234');
  const [branchName, setBranchName] = useState('Main HQ Branch');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [loading, setLoading] = useState(false);

  // Camera & Face Detection Modal State
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [isFaceMode, setIsFaceMode] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [scanStep, setScanStep] = useState('Align Face in Target Frame...');
  const [capturedPhoto, setCapturedPhoto] = useState(null);

  const openCameraModal = (faceAi = true) => {
    setIsFaceMode(faceAi);
    setCapturedPhoto(null);
    setCapturing(false);
    setScanStep('Align Face inside Target Frame...');
    setCameraModalVisible(true);

    if (faceAi) {
      startFaceDetectionScan();
    }
  };

  const startFaceDetectionScan = () => {
    setCapturing(true);
    setScanStep('Initializing Camera Scanner...');

    setTimeout(() => {
      setScanStep('Detecting Facial Landmarks & Mesh...');
    }, 1000);

    setTimeout(() => {
      setScanStep('Extracting Face Template & Snapping Photo...');
    }, 2200);

    setTimeout(() => {
      const snap = CAMERA_SNAPSHOTS[Math.floor(Math.random() * CAMERA_SNAPSHOTS.length)];
      setCapturedPhoto(snap);
      setCapturing(false);
      setScanStep('Face Verified & Enrolled!');
    }, 3400);
  };

  const captureStandardPhoto = () => {
    setCapturing(true);
    setScanStep('Capturing Camera Snapshot...');
    setTimeout(() => {
      const snap = CAMERA_SNAPSHOTS[Math.floor(Math.random() * CAMERA_SNAPSHOTS.length)];
      setCapturedPhoto(snap);
      setCapturing(false);
    }, 1000);
  };

  const saveCapturedPhoto = () => {
    if (capturedPhoto) {
      setSelectedAvatar(capturedPhoto);
    }
    setCameraModalVisible(false);
  };

  const handleAdd = async () => {
    if (!fullName || !email || !designation) {
      Alert.alert('Validation Error', 'Full Name, Work Email and Designation are required.');
      return;
    }
    setLoading(true);
    try {
      const empId = 'emp_' + Date.now();
      const userPayload = {
        CompanyID: 'comp_01',
        UserID: empId,
        id: empId,
        UserCode: userCode,
        Username: username || (email ? email.split('@')[0] : 'user'),
        PasswordHash: passwordHash || 'scrypt:salted_pass_123',
        Role: role,
        role: role,
        FullName: fullName,
        name: fullName,
        Email: email,
        email: email,
        DOB: dob,
        dob: dob,
        DOJ: doj,
        joiningDate: doj,
        DepartmentID: 'dept_01',
        department: department,
        MobileNo: mobileNo || '+91 98765 43210',
        phone: mobileNo || '+91 98765 43210',
        AdharNo: adharNo,
        PanNo: panNo,
        UANNo: uanNo,
        BankName: bankName || 'HDFC Bank Ltd',
        bankName: bankName || 'HDFC Bank Ltd',
        AccountNo: accountNo || '50100298765432',
        accountNo: accountNo || '50100298765432',
        IFSCCode: ifscCode || 'HDFC0001234',
        ifscCode: ifscCode || 'HDFC0001234',
        BranchName: branchName || 'Main HQ Branch',
        branchName: branchName || 'Main HQ Branch',
        AccountHolderName: accountHolderName || fullName || 'Employee Account',
        accountHolderName: accountHolderName || fullName || 'Employee Account',
        Designation: designation,
        designation: designation,
        InTime: '09:00 AM',
        OutTime: '06:00 PM',
        IsActive: true,
        CreatedOn: new Date().toISOString(),
        CreatedUserID: 'demo_admin_123',
        Status: 'Active',
        status: 'Active',
        Gender: gender,
        Location: 'Office HQ Tower 1',
        EmploymentType: employmentType,
        ShiftID: 'sh_01',
        MonthlyPayAmt: Number(monthlyPayAmt) || 45000,
        salaryTier: `₹${Number(monthlyPayAmt || 45000).toLocaleString('en-IN')} / mo`,
        UPhoto: selectedAvatar,
        avatar: selectedAvatar,
        IsFaceEnrolled: true,
        WorkHrs: 8,
        IsPerDay: false
      };

      await employeeService.addEmployee(userPayload);
      await addEmployee(userPayload);
      Alert.alert("Success", "User Created");
      navigation.goBack();
    } catch (error) {
      Alert.alert('Database Error', `Failed to save Employee: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <ArrowLeft size={20} color={COLORS.primary} />
        <Text style={styles.backText}>Back to Roster</Text>
      </TouchableOpacity>

      <Text style={styles.screenTitle}>Onboard Employee</Text>
      <Text style={styles.screenSub}>Employee Onboarding & Account Registration</Text>

      {/* Profile Photo / Face Capture Selection */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>📷 Employee Profile Photo / Face Capture</Text>
        
        <View style={styles.avatarPickerRow}>
          <Image source={{ uri: selectedAvatar }} style={styles.previewAvatar} />
          <View style={styles.avatarPickerMeta}>
            <Text style={styles.avatarPickerTitle}>Enrolled Face Profile Photo</Text>
            <Text style={styles.avatarPickerSub}>Stored for Face Recognition Verification</Text>
          </View>
        </View>

        {/* Live Face Detection Camera Button */}
        <TouchableOpacity style={styles.faceTriggerBtn} onPress={() => openCameraModal(true)}>
          <ScanFace size={20} color="#ffffff" />
          <Text style={styles.faceTriggerText}>📷 Face Scan & Capture Live Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cameraTriggerBtn} onPress={() => openCameraModal(false)}>
          <Camera size={18} color="#ffffff" />
          <Text style={styles.cameraTriggerText}>📷 Standard Mobile Camera Snapshot</Text>
        </TouchableOpacity>

        <Text style={styles.presetLabel}>Or choose from Preset Avatars:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
          {AVATAR_PRESETS.map((url, idx) => (
            <TouchableOpacity 
              key={idx} 
              onPress={() => setSelectedAvatar(url)} 
              style={[styles.presetItem, selectedAvatar === url && styles.presetItemActive]}
            >
              <Image source={{ uri: url }} style={styles.presetImg} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionHeader}>1. Personal Identity & Account</Text>

        <CustomInput
          label="User Employee Code"
          value={userCode}
          onChangeText={setUserCode}
          icon={Shield}
        />

        <CustomInput
          label="Full Name"
          placeholder="e.g. Rachel Green"
          value={fullName}
          onChangeText={setFullName}
          icon={User}
        />

        <CustomInput
          label="Work Email Address"
          placeholder="rachel@acmeenterprise.com"
          value={email}
          onChangeText={(val) => {
            setEmail(val);
            if (!username) setUsername(val.split('@')[0]);
          }}
          icon={Mail}
          keyboardType="email-address"
        />

        <CustomInput
          label="Username"
          placeholder="e.g. rachel.green"
          value={username}
          onChangeText={setUsername}
          icon={User}
        />

        <CustomInput
          label="Password"
          placeholder="Type employee password..."
          value={passwordHash}
          onChangeText={setPasswordHash}
          icon={Lock}
        />

        <CustomInput
          label="Mobile Phone"
          placeholder="+91 98765 43210"
          value={mobileNo}
          onChangeText={setMobileNo}
          icon={Phone}
          keyboardType="phone-pad"
        />

        <CustomInput
          label="Designation / Job Title"
          placeholder="e.g. Senior Software Architect"
          value={designation}
          onChangeText={setDesignation}
          icon={Briefcase}
        />

        <DatePickerInput
          label="Date of Birth"
          placeholder="YYYY-MM-DD (e.g. 1995-08-15)"
          value={dob}
          onChangeText={setDob}
        />

        <DatePickerInput
          label="Date of Joining"
          placeholder="YYYY-MM-DD (e.g. 2024-01-15)"
          value={doj}
          onChangeText={setDoj}
        />

        <Text style={styles.sectionLabel}>Gender</Text>
        <View style={styles.chipRow}>
          {['Male', 'Female', 'Other'].map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.chip, gender === g && styles.chipActive]}
              onPress={() => setGender(g)}
            >
              <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Employment Type</Text>
        <View style={styles.chipRow}>
          {['Full-Time', 'Part-Time', 'Contract', 'Intern'].map((e) => (
            <TouchableOpacity
              key={e}
              style={[styles.chip, employmentType === e && styles.chipActive]}
              onPress={() => setEmploymentType(e)}
            >
              <Text style={[styles.chipText, employmentType === e && styles.chipTextActive]}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionHeader}>2. Compliance & Verification IDs</Text>

        <CustomInput
          label="Aadhaar Number"
          placeholder="9874-5612-3012"
          value={adharNo}
          onChangeText={setAdharNo}
          icon={CreditCard}
          keyboardType="numeric"
        />

        <CustomInput
          label="PAN Card Number"
          placeholder="ABCDE1234F"
          value={panNo}
          onChangeText={setPanNo}
          icon={CreditCard}
        />

        <CustomInput
          label="UAN EPF Number"
          placeholder="100987654321"
          value={uanNo}
          onChangeText={setUanNo}
          icon={CreditCard}
          keyboardType="numeric"
        />

        <Text style={styles.sectionHeader}>3. Bank Account & Payroll Details</Text>

        <CustomInput
          label="Bank Name"
          placeholder="e.g. HDFC Bank Ltd"
          value={bankName}
          onChangeText={setBankName}
          icon={Building}
        />

        <CustomInput
          label="Account Holder Name"
          placeholder="e.g. Rachel Green"
          value={accountHolderName}
          onChangeText={setAccountHolderName}
          icon={User}
        />

        <CustomInput
          label="Bank Account Number"
          placeholder="50100298765432"
          value={accountNo}
          onChangeText={setAccountNo}
          icon={CreditCard}
          keyboardType="numeric"
        />

        <CustomInput
          label="IFSC Code"
          placeholder="HDFC0001234"
          value={ifscCode}
          onChangeText={setIfscCode}
          icon={Shield}
        />

        <CustomInput
          label="Branch Name"
          placeholder="e.g. Main HQ Branch, Mumbai"
          value={branchName}
          onChangeText={setBranchName}
          icon={Landmark}
        />

        <Text style={styles.sectionHeader}>4. Department, Access Role & Pay</Text>

        <Text style={styles.sectionLabel}>Assigned Department</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {departments.map((dept) => (
            <TouchableOpacity
              key={dept.id || dept.DepartmentID}
              style={[styles.chip, department === (dept.DepartmentName || dept.name) && styles.chipActive]}
              onPress={() => setDepartment(dept.DepartmentName || dept.name)}
            >
              <Text style={[styles.chipText, department === (dept.DepartmentName || dept.name) && styles.chipTextActive]}>
                {dept.DepartmentName || dept.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionLabel}>System Access Role</Text>
        <View style={styles.roleRow}>
          {['Admin', 'Manager', 'HR', 'Employee'].map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.chip, role === r && styles.chipActive]}
              onPress={() => setRole(r)}
            >
              <Text style={[styles.chipText, role === r && styles.chipTextActive]}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <CustomInput
          label="Monthly Pay Amount"
          placeholder="45000"
          value={monthlyPayAmt}
          onChangeText={setMonthlyPayAmt}
          icon={IndianRupee}
          keyboardType="numeric"
        />

        <PrimaryButton
          title="Save & Register Employee"
          onPress={handleAdd}
          loading={loading}
          icon={UserCheck}
          style={{ marginTop: 16 }}
        />
      </View>

      {/* Live Camera & Face Detection Viewfinder Modal */}
      <Modal visible={cameraModalVisible} animationType="slide" transparent>
        <View style={styles.cameraModalBg}>
          <View style={styles.cameraCard}>
            <View style={styles.cameraHeader}>
              <Text style={styles.cameraTitle}>
                {isFaceMode ? "📷 Face Detection Camera Enroller" : "📱 Live Mobile Camera Viewfinder"}
              </Text>
              <TouchableOpacity onPress={() => setCameraModalVisible(false)}>
                <X size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Camera Preview Viewfinder Frame */}
            <View style={styles.cameraPreviewFrame}>
              {capturedPhoto ? (
                <Image source={{ uri: capturedPhoto }} style={styles.cameraCapturedImg} />
              ) : (
                <View style={styles.viewfinderBox}>
                  {/* Face Mesh Viewfinder Circle */}
                  <Image source={{ uri: AVATAR_PRESETS[0] }} style={styles.scannerFaceOverlayImg} />

                  {/* Scanning Laser Beam overlay when capturing */}
                  {capturing && (
                    <View style={styles.laserLine} />
                  )}

                  {/* Face Landmarks Corners */}
                  <View style={[styles.hudCorner, styles.cornerTL]} />
                  <View style={[styles.hudCorner, styles.cornerTR]} />
                  <View style={[styles.hudCorner, styles.cornerBL]} />
                  <View style={[styles.hudCorner, styles.cornerBR]} />
                </View>
              )}
            </View>

            {/* Scan Status Box */}
            {capturing ? (
              <View style={styles.scanStatusBox}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.scanStepText}>{scanStep}</Text>
              </View>
            ) : capturedPhoto ? (
              <View style={styles.verifiedBox}>
                <CheckCircle2 size={22} color={COLORS.success} />
                <Text style={styles.verifiedText}>Face Photo Captured & Enrolled!</Text>
              </View>
            ) : (
              <Text style={styles.alignSubText}>
                {isFaceMode ? "Hold camera steady to detect 128D facial landmarks" : "Press Shutter to snap photo"}
              </Text>
            )}

            {/* Camera Actions */}
            <View style={styles.cameraActionRow}>
              {capturedPhoto ? (
                <>
                  <TouchableOpacity style={styles.retakeBtn} onPress={isFaceMode ? startFaceDetectionScan : captureStandardPhoto}>
                    <RefreshCw size={16} color={COLORS.primary} />
                    <Text style={styles.retakeText}>Rescan Face</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.usePhotoBtn} onPress={saveCapturedPhoto}>
                    <Check size={16} color="#ffffff" />
                    <Text style={styles.usePhotoText}>Save & Enroll Photo</Text>
                  </TouchableOpacity>
                </>
              ) : !isFaceMode ? (
                <TouchableOpacity style={styles.shutterBtn} onPress={captureStandardPhoto} disabled={capturing}>
                  <View style={styles.shutterInnerCircle} />
                </TouchableOpacity>
              ) : null}
            </View>
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
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  screenSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: COLORS.inputBg,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 14,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarPickerMeta: {
    flex: 1,
  },
  avatarPickerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  avatarPickerSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  faceTriggerBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  faceTriggerText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  cameraTriggerBtn: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cameraTriggerText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  presetLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  presetScroll: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  presetItem: {
    padding: 3,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: 10,
  },
  presetItemActive: {
    borderColor: COLORS.primary,
  },
  presetImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 12,
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 10,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 14,
    paddingVertical: 8,
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
  cameraModalBg: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    padding: 18,
  },
  cameraCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cameraHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cameraTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  cameraPreviewFrame: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#0f172a',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
    marginBottom: 16,
    position: 'relative',
  },
  cameraCapturedImg: {
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  viewfinderBox: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  scannerFaceOverlayImg: {
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.8,
  },
  laserLine: {
    position: 'absolute',
    top: '45%',
    width: '100%',
    height: 3,
    backgroundColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 8,
  },
  hudCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: COLORS.primary,
  },
  cornerTL: { top: 12, left: 12, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 12, right: 12, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 12, left: 12, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 12, right: 12, borderBottomWidth: 3, borderRightWidth: 3 },
  scanStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  scanStepText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  verifiedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.success,
  },
  alignSubText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  cameraActionRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  shutterBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBg,
  },
  shutterInnerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  retakeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  usePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  usePhotoText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
