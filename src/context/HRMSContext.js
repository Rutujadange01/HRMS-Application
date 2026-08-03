import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import { companyService } from '../services/companyService';
import { employeeService } from '../services/employeeService';
import { attendanceService } from '../services/attendanceService';
import { seedService } from '../services/seedService';
import { locationService } from '../services/locationService';
import { salaryComponentService } from '../services/salaryComponentService';
import { expenseService } from '../services/expenseService';
import { assetService } from '../services/assetService';
import { INITIAL_MISSPUNCH, INITIAL_CORRECTIONS, INITIAL_EXPENSES } from '../utils/seedData';

export const HRMSContext = createContext();

export const HRMSProvider = ({ children }) => {
  const { profile, user } = useContext(AuthContext) || {};
  const [company, setCompany] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [salaryComponents, setSalaryComponents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [missPunches, setMissPunches] = useState(INITIAL_MISSPUNCH);
  const [correctionRequests, setCorrectionRequests] = useState(INITIAL_CORRECTIONS);
  const [expenseClaims, setExpenseClaims] = useState(INITIAL_EXPENSES);
  const [assets, setAssets] = useState([]);
  const [assetDeployments, setAssetDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clockedIn, setClockedIn] = useState(false);
  const [lastClockInTime, setLastClockInTime] = useState(null);

  useEffect(() => {
    let unsubs = [];

    const initializeRealtimeData = async () => {
      setLoading(true);
      // Auto-seed Firestore if collections are empty
      await seedService.seedIfEmpty();

      // Subscribe to real-time Cloud Firestore updates
      const unsubCompany = companyService.subscribeCompany((data) => setCompany(data));
      const unsubDepts = companyService.subscribeDepartments((data) => setDepartments(data));
      const unsubShifts = companyService.subscribeShifts((data) => setShifts(data));
      const unsubHolidays = companyService.subscribeHolidays((data) => setHolidays(data));
      const unsubSalaryComponents = salaryComponentService.subscribeSalaryComponents((data) => setSalaryComponents(data));
      const unsubEmps = employeeService.subscribeEmployees((data) => setEmployees(data));
      const unsubAtt = attendanceService.subscribeAttendance((data) => setAttendanceLogs(data));
      const unsubLeaves = attendanceService.subscribeLeaves((data) => setLeaves(data));
      const unsubMissPunches = attendanceService.subscribeMissPunches((data) => setMissPunches(data));
      const unsubExpenses = expenseService.subscribeExpenses((data) => setExpenseClaims(data));
      const unsubCorrections = attendanceService.subscribeCorrections((data) => setCorrectionRequests(data));
      const unsubAssets = assetService.subscribeAssets((data) => setAssets(data));
      const unsubDeployments = assetService.subscribeDeployments((data) => setAssetDeployments(data));

      unsubs = [unsubCompany, unsubDepts, unsubShifts, unsubHolidays, unsubSalaryComponents, unsubEmps, unsubAtt, unsubLeaves, unsubMissPunches, unsubExpenses, unsubCorrections, unsubAssets, unsubDeployments];
      setLoading(false);
    };

    initializeRealtimeData();

    return () => {
      unsubs.forEach(unsub => typeof unsub === 'function' && unsub());
    };
  }, []);

  // Dynamic clockedIn state checking if there is an unclosed punch for today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const profUid = (profile?.uid || profile?.UserID || user?.uid || '').trim().toLowerCase();
    
    const openLog = (attendanceLogs || []).find(l => {
      const lDate = l.date || l.PostingDate || (l.CreatedOn ? l.CreatedOn.split('T')[0] : '');
      const hasIn = l.clockIn && l.clockIn !== '--:--';
      const noOut = !l.clockOut || l.clockOut === '--:--';
      const lUid = (l.employeeId || l.userId || l.EmployeeID || '').trim().toLowerCase();
      
      return lDate === today && hasIn && noOut && (!profUid || lUid === profUid);
    });
    setClockedIn(!!openLog);
  }, [attendanceLogs, profile, user]);

  // Update Company Profile in Firestore
  const updateCompany = async (updatedFields) => {
    const updated = { ...company, ...updatedFields };
    setCompany(updated);
    await companyService.updateCompanyDetails(updated);
  };

  // Add Department to Firestore
  const addDepartment = async (dept) => {
    await companyService.addDepartment(dept);
  };

  // Delete Department from Firestore
  const deleteDepartment = async (id) => {
    await companyService.deleteDepartment(id);
  };

  const updateDepartment = async (id, updatedFields) => {
    await companyService.updateDepartment(id, updatedFields);
  };

  const addShift = async (shift) => {
    await companyService.addShift(shift);
  };

  const updateShift = async (id, updatedFields) => {
    await companyService.updateShift(id, updatedFields);
  };

  const deleteShift = async (id) => {
    await companyService.deleteShift(id);
  };

  const addHoliday = async (holiday) => {
    await companyService.addHoliday(holiday);
  };

  const updateHoliday = async (id, updatedFields) => {
    await companyService.updateHoliday(id, updatedFields);
  };

  const deleteHoliday = async (id) => {
    await companyService.deleteHoliday(id);
  };

  const addSalaryComponent = async (component) => {
    await salaryComponentService.addSalaryComponent(component);
  };

  const updateSalaryComponent = async (id, updatedFields) => {
    await salaryComponentService.updateSalaryComponent(id, updatedFields);
  };

  const deleteSalaryComponent = async (id) => {
    await salaryComponentService.deleteSalaryComponent(id);
  };

  // Add Employee to Firestore
  const addEmployee = async (empData) => {
    await employeeService.addEmployee(empData);
  };

  // Update Employee in Firestore & local state
  const updateEmployee = async (id, updatedFields) => {
    try {
      await employeeService.updateEmployee(id, updatedFields);
    } catch (e) {
      console.warn("Firestore update error:", e.message);
    }
    setEmployees(prev => prev.map(emp => {
      const eId = emp.id || emp.UserID;
      if (eId === id || emp.id === id || emp.UserID === id) {
        return { ...emp, ...updatedFields };
      }
      return emp;
    }));
  };

  // Delete Employee from Firestore
  const deleteEmployee = async (id) => {
    await employeeService.deleteEmployee(id);
  };

  // Calculate distance in meters between two lat/lon points
  const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
    if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 0;
    const pLat1 = parseFloat(lat1);
    const pLon1 = parseFloat(lon1);
    const pLat2 = parseFloat(lat2);
    const pLon2 = parseFloat(lon2);
    if (isNaN(pLat1) || isNaN(pLon1) || isNaN(pLat2) || isNaN(pLon2)) return 0;

    const R = 6371000; // Radius of earth in meters
    const dLat = (pLat2 - pLat1) * (Math.PI / 180);
    const dLon = (pLon2 - pLon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(pLat1 * (Math.PI / 180)) *
        Math.cos(pLat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  // Clock In / Out action in Firestore with Company Geofence Validation
  const toggleClockIn = async (employeeId, employeeName, locationParam = '', notes = '', forceType = null, userCoords = null) => {
    const today = new Date().toISOString().split('T')[0];

    // Read Company Settings from Context
    const isGeoRequired = Boolean(company?.GeoFenceRequired ?? true);
    const companyId = company?.CompanyID || 'comp_01';
    const compLocationName = company?.Location || 'Office HQ Tower 1';
    const compLat = company?.Latitude || '37.7749';
    const compLon = company?.Longitude || '-122.4194';
    const maxRadius = parseFloat(company?.GeoFenceRadius || '100');

    // Fetch real-time iOS / Android mobile hardware GPS Location
    let activeCoords = userCoords;
    if (!activeCoords) {
      activeCoords = await locationService.getCurrentLocation();
    }

    const userLat = activeCoords?.latitude ?? 37.7751;
    const userLon = activeCoords?.longitude ?? -122.4192;

    const distMeters = calculateDistanceMeters(compLat, compLon, userLat, userLon);
    const isBiometric = (locationParam || '').toLowerCase().includes('biometric') || 
                        (locationParam || '').toLowerCase().includes('face') || 
                        (notes || '').toLowerCase().includes('biometric') || 
                        (notes || '').toLowerCase().includes('face');

    // Validate Geofence if required by Company settings and not a biometric face scan
    if (isGeoRequired && !isBiometric && maxRadius > 0 && distMeters > maxRadius) {
      const warningMsg = `Geofence Restricted! You are ${distMeters}m away from ${compLocationName}. Max allowed radius for ${company?.CompanyName || 'Company'} is ${maxRadius}m.`;
      const { Alert } = require('react-native');
      Alert.alert("Geofence Violation", warningMsg);
      throw new Error(warningMsg);
    }

    const verifiedLocationName = locationParam || `${compLocationName} (GPS Validated - ${distMeters}m)`;

    const openLog = (attendanceLogs || []).find(l => {
      const lUser = l.UserID || l.employeeId;
      const lDate = l.date || l.PostingDate || (l.CreatedOn ? l.CreatedOn.split('T')[0] : '');
      const isUserMatch = lUser === employeeId || 
        (l.employeeName && employeeName && l.employeeName.trim().toLowerCase() === employeeName.trim().toLowerCase()) ||
        (l.UserName && employeeName && l.UserName.trim().toLowerCase() === employeeName.trim().toLowerCase());
      const hasIn = l.clockIn && l.clockIn !== '--:--';
      const noOut = !l.clockOut || l.clockOut === '--:--';
      return isUserMatch && lDate === today && hasIn && noOut;
    });

    const type = forceType || (openLog ? 'out' : 'in');
    const logItem = await attendanceService.markAttendance({
      employeeId,
      employeeName,
      location: verifiedLocationName,
      notes,
      type,
      companyId,
      latitude: userLat,
      longitude: userLon,
      distance: distMeters
    });

    if (type === 'in') {
      setClockedIn(true);
      setLastClockInTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } else {
      setClockedIn(false);
      setLastClockInTime(null);
    }
    return logItem;
  };

  // Apply Leave in Firestore
  const applyLeave = async (leaveData) => {
    await attendanceService.applyLeave(leaveData);
  };

  // Respond to Leave Status (Approve / Reject) in Firestore
  const respondToLeave = async (leaveId, status, responderProfile) => {
    await attendanceService.updateLeaveStatus(leaveId, status, responderProfile);
  };

  // Update Pending Leave application details
  const updateLeave = async (leaveId, updatedData) => {
    setLeaves(prev => prev.map(l => (l.id || l.LeaveID) === leaveId ? { ...l, ...updatedData } : l));
    await attendanceService.updateLeave(leaveId, updatedData);
  };

  // Delete / Cancel Pending Leave application
  const deleteLeave = async (leaveId) => {
    setLeaves(prev => prev.filter(l => (l.id || l.LeaveID) !== leaveId));
    try {
      await attendanceService.deleteLeave(leaveId);
    } catch (e) {
      console.warn(e);
    }
  };

  // Submit Miss Punch Request
  const submitMissPunch = async (payload) => {
    return await attendanceService.addMissPunch(payload);
  };

  // Update Pending Miss Punch Request
  const updateMissPunch = async (mpId, updatedData) => {
    return await attendanceService.updateMissPunch(mpId, updatedData);
  };

  // Approve / Reject Miss Punch Request
  const respondToMissPunch = async (missPunchId, status, approverName, approverUid, reason = '') => {
    const updatePayload = {
      Status: status,
      status: status,
      Approved_By: approverName,
      Approved_Date: new Date().toISOString(),
      Rejecteddate: status === 'Rejected' ? new Date().toISOString() : '',
      UpdatedByUId: approverUid,
      UpdatedByUName: approverName,
      Rejection_Reason: reason,
    };
    await attendanceService.updateMissPunch(missPunchId, updatePayload);

    if (status === 'Approved') {
      const targetMp = missPunches.find(mp => (mp.ID || mp.id) === missPunchId);
      if (targetMp) {
        // Automatically add/correct attendance punch log for approved miss punch
        const newPunch = {
          CompanyID: targetMp.CompanyID || 'comp_01',
          PunchID: 'mp_punch_' + Date.now(),
          id: 'mp_punch_' + Date.now(),
          UserID: targetMp.UserID || targetMp.employeeId,
          employeeId: targetMp.UserID || targetMp.employeeId,
          UserName: targetMp.CreatedByUName || targetMp.employeeName,
          employeeName: targetMp.CreatedByUName || targetMp.employeeName,
          Time: targetMp.Requested_Time || '09:00 AM',
          clockIn: targetMp.MissPunch_type === 'In' ? (targetMp.Requested_Time || '09:00 AM') : '09:00 AM',
          clockOut: targetMp.MissPunch_type === 'Out' ? (targetMp.Requested_Time || '06:00 PM') : '--:--',
          workHrs: '8 hrs 00 mins (MissPunch Corrected)',
          status: 'Present',
          Flag: 'P',
          Location: 'Office - HQ (Miss Punch Approval)',
          location: 'Office - HQ (Miss Punch Approval)',
          date: targetMp.MissPunch_Date,
          PostingDate: targetMp.MissPunch_Date,
          CreatedOn: new Date().toISOString()
        };
        const { db } = require('../config/firebase');
        const { setDoc, doc } = require('firebase/firestore');
        if (db) {
          await setDoc(doc(db, 'attendance', newPunch.PunchID), newPunch);
        }
      }
    }
  };

  // Delete / Cancel Pending Miss Punch Request
  const deleteMissPunch = async (missPunchId) => {
    return await attendanceService.deleteMissPunch(missPunchId);
  };

  // Submit Attendance Correction Request
  // Submit Attendance Correction Request
  const submitCorrectionRequest = async (payload) => {
    return await attendanceService.addCorrection(payload);
  };

  // Approve / Reject Attendance Correction Request
  const respondToCorrectionRequest = async (correctionId, status, approverName, approverUid, rejectionReason = '') => {
    await attendanceService.updateCorrection(correctionId, {
      Status: status,
      status: status,
      Approved_By: approverName,
      Approved_Date: new Date().toISOString(),
      Rejection_Reason: rejectionReason,
      Rejecteddate: status === 'Rejected' ? new Date().toISOString() : '',
      UpdatedByUId: approverUid
    });

    if (status === 'Approved') {
      const targetCr = correctionRequests.find(cr => (cr.ID || cr.id) === correctionId);
      if (targetCr) {
        // Automatically add/update corrected attendance punch log
        const punchId = 'corr_punch_' + Date.now();
        const newPunch = {
          CompanyID: targetCr.CompanyID || 'comp_01',
          PunchID: punchId,
          id: punchId,
          UserID: targetCr.UserID || targetCr.employeeId,
          employeeId: targetCr.UserID || targetCr.employeeId,
          UserName: targetCr.CreatedByUName || targetCr.employeeName,
          employeeName: targetCr.CreatedByUName || targetCr.employeeName,
          Time: targetCr.Requested_CheckIn || '09:00 AM',
          clockIn: targetCr.Requested_CheckIn || '09:00 AM',
          clockOut: targetCr.Requested_CheckOut || '06:00 PM',
          workHrs: '8 hrs 00 mins (Correction Approved)',
          status: 'Present',
          Flag: 'P',
          Location: 'Office - HQ (Attendance Correction)',
          location: 'Office - HQ (Attendance Correction)',
          date: targetCr.Correction_Date || targetCr.Original_Date,
          PostingDate: targetCr.Correction_Date || targetCr.Original_Date,
          CreatedOn: new Date().toISOString()
        };
        await attendanceService.addAttendanceLog(newPunch);
      }
    }
  };

  // Delete / Cancel Pending Attendance Correction Request
  const deleteCorrectionRequest = async (correctionId) => {
    await attendanceService.deleteCorrection(correctionId);
  };

  // Submit New Expense Claim (Mapped 100% to SSMS Emp_ExpenseClaims)
  const submitExpenseClaim = async (claimData) => {
    return await expenseService.addExpense(claimData);
  };

  const updateExpenseClaim = async (claimId, claimData) => {
    setExpenseClaims(prev => prev.map(c => (c.ID || c.id) === claimId ? { ...c, ...claimData } : c));
    return await expenseService.updateExpense(claimId, claimData);
  };

  // Respond to Expense Claim (Approve / Reject)
  const respondToExpenseClaim = async (claimId, status, rejectionReason = '', reviewerName = 'Admin', reviewerUid = '') => {
    await expenseService.updateExpense(claimId, {
      Status: status,
      Approved_By: status === 'Approved' ? reviewerName : '',
      Approved_Date: status === 'Approved' ? new Date().toISOString() : '',
      Rejection_Reason: status === 'Rejected' ? rejectionReason : '',
      Rejecteddate: status === 'Rejected' ? new Date().toISOString() : '',
      UpdatedByUId: reviewerUid
    });
  };

  // Mark Expense Payment Processed / Paid
  const processExpensePayment = async (claimId, paymentRef = '', paymentMode = 'Bank Transfer', processorName = 'Finance Team') => {
    await expenseService.updateExpense(claimId, {
      Payment_Status: 'Paid',
      Payment_Mode: paymentMode,
      Payment_Date: new Date().toISOString().split('T')[0],
      Payment_Reference: paymentRef,
      Processed_By: processorName
    });
  };

  // Delete Expense Claim
  const deleteExpenseClaim = async (claimId) => {
    setExpenseClaims(prev => prev.filter(c => (c.ID || c.id) !== claimId));
    await expenseService.deleteExpense(claimId);
  };

  return (
    <HRMSContext.Provider
      value={{
        company,
        departments,
        employees,
        attendanceLogs,
        leaves,
        missPunches,
        correctionRequests,
        expenseClaims,
        setExpenseClaims,
        assets,
        assetDeployments,
        addAsset: assetService.addAsset,
        updateAsset: assetService.updateAsset,
        deleteAsset: assetService.deleteAsset,
        addDeployment: assetService.addDeployment,
        updateDeployment: assetService.updateDeployment,
        loading,
        clockedIn,
        lastClockInTime,
        updateCompany,
        addDepartment,
        updateDepartment,
        deleteDepartment,
        shifts,
        addShift,
        updateShift,
        deleteShift,
        holidays,
        addHoliday,
        updateHoliday,
        deleteHoliday,
        salaryComponents,
        addSalaryComponent,
        updateSalaryComponent,
        deleteSalaryComponent,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        toggleClockIn,
        applyLeave,
        respondToLeave,
        updateLeave,
        deleteLeave,
        submitMissPunch,
        updateMissPunch,
        respondToMissPunch,
        deleteMissPunch,
        submitCorrectionRequest,
        respondToCorrectionRequest,
        deleteCorrectionRequest,
        submitExpenseClaim,
        updateExpenseClaim,
        respondToExpenseClaim,
        processExpensePayment,
        deleteExpenseClaim
      }}
    >
      {children}
    </HRMSContext.Provider>
  );
};
