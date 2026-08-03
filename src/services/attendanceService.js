import { db } from '../config/firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';

export const attendanceService = {
  // Subscribe to real-time Attendance stream directly from Firestore
  subscribeAttendance: (onUpdate) => {
    if (!db) {
      onUpdate([]);
      return () => {};
    }

    try {
      const colRef = collection(db, 'attendance');
      const unsubscribe = onSnapshot(colRef, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        onUpdate(list);
      }, (error) => {
        console.warn("Attendance onSnapshot listener error:", error.message);
        onUpdate([]);
      });
      return unsubscribe;
    } catch (error) {
      console.warn("Failed to subscribe to attendance:", error.message);
      onUpdate([]);
      return () => {};
    }
  },

  // Subscribe to real-time Leaves stream directly from Firestore
  subscribeLeaves: (onUpdate) => {
    if (!db) {
      onUpdate([]);
      return () => {};
    }

    try {
      const colRef = collection(db, 'leaves');
      const unsubscribe = onSnapshot(colRef, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        onUpdate(list);
      }, (error) => {
        console.warn("Leaves onSnapshot listener error:", error.message);
        onUpdate([]);
      });
      return unsubscribe;
    } catch (error) {
      console.warn("Failed to subscribe to leaves:", error.message);
      onUpdate([]);
      return () => {};
    }
  },

  // Subscribe to real-time Corrections stream directly from Firestore
  subscribeCorrections: (onUpdate) => {
    if (!db) {
      onUpdate([]);
      return () => {};
    }

    try {
      const colRef = collection(db, 'corrections');
      const unsubscribe = onSnapshot(colRef, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort by CreatedDate descending
        list.sort((a, b) => new Date(b.CreatedDate || 0) - new Date(a.CreatedDate || 0));
        onUpdate(list);
      }, (error) => {
        console.warn("Corrections onSnapshot listener error:", error.message);
        onUpdate([]);
      });
      return unsubscribe;
    } catch (error) {
      console.warn("Failed to subscribe to corrections:", error.message);
      onUpdate([]);
      return () => {};
    }
  },

  // Subscribe to real-time Miss Punches stream directly from Firestore
  subscribeMissPunches: (onUpdate) => {
    if (!db) {
      onUpdate([]);
      return () => {};
    }

    try {
      const colRef = collection(db, 'misspunches');
      const unsubscribe = onSnapshot(colRef, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort by CreatedDate descending
        list.sort((a, b) => new Date(b.CreatedDate || 0) - new Date(a.CreatedDate || 0));
        onUpdate(list);
      }, (error) => {
        console.warn("MissPunches onSnapshot listener error:", error.message);
        onUpdate([]);
      });
      return unsubscribe;
    } catch (error) {
      console.warn("Failed to subscribe to misspunches:", error.message);
      onUpdate([]);
      return () => {};
    }
  },

  // One-time Fetch Attendance Logs directly from Firestore
  getAttendanceLogs: async () => {
    try {
      if (db) {
        const snapshot = await getDocs(collection(db, 'attendance'));
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (error) {
      console.warn("Attendance fetch error:", error.message);
    }
    return [];
  },

  // Add Attendance Log Directly
  addAttendanceLog: async (logData) => {
    try {
      if (db) {
        const ref = doc(db, 'attendance', logData.id);
        await setDoc(ref, logData);
      }
    } catch (error) {
      console.warn("Add attendance log error:", error.message);
      throw error;
    }
    return logData;
  },

  // Record Clock-In / Clock-Out directly into Firestore AttendancePunch
  markAttendance: async ({ employeeId, employeeName, location, notes, type, companyId, latitude, longitude, distance }) => {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let todayDocs = [];
    try {
      if (db) {
        const snapshot = await getDocs(collection(db, 'attendance'));
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        todayDocs = list.filter(l => {
          const lUser = l.UserID || l.employeeId;
          const lDate = l.date || l.PostingDate || (l.CreatedOn ? l.CreatedOn.split('T')[0] : '');
          const isUserMatch = lUser === employeeId || 
            (l.employeeName && employeeName && l.employeeName.trim().toLowerCase() === employeeName.trim().toLowerCase()) ||
            (l.UserName && employeeName && l.UserName.trim().toLowerCase() === employeeName.trim().toLowerCase());
          return isUserMatch && lDate === today;
        }).sort((a, b) => {
          const tA = a.CreatedOn || `${a.date || a.PostingDate} ${a.Time || '00:00'}`;
          const tB = b.CreatedOn || `${b.date || b.PostingDate} ${b.Time || '00:00'}`;
          return tA.localeCompare(tB);
        });
      }
    } catch (e) {
      console.warn("Existing punch search error:", e.message);
    }

    const latestDoc = todayDocs.length > 0 ? todayDocs[todayDocs.length - 1] : null;

    // A document is open ONLY if it has a valid clockIn AND clockOut is empty/missing/'--:--'
    const isLatestOpen = latestDoc && 
      latestDoc.clockIn && 
      latestDoc.clockIn !== '--:--' && 
      (!latestDoc.clockOut || latestDoc.clockOut === '--:--');

    let targetId;
    let targetDoc;

    if (isLatestOpen && type === 'out') {
      // Update the current open document with clockOut
      targetDoc = latestDoc;
      targetId = latestDoc.id;
    } else if (isLatestOpen && type === 'in') {
      // Current document is open but user clicked IN again -> update in time of current open document
      targetDoc = latestDoc;
      targetId = latestDoc.id;
    } else {
      // PREVIOUS DOCUMENT IS CLOSED (has clockOut) OR NO DOCUMENT FOR TODAY:
      // ALWAYS CREATE A BRAND NEW DOCUMENT ROW IN FIREBASE!
      targetDoc = null;
      targetId = 'punch_' + Date.now();
    }

    let finalClockIn = targetDoc
      ? (targetDoc.clockIn && targetDoc.clockIn !== '--:--' ? targetDoc.clockIn : nowTime)
      : (type === 'in' ? nowTime : '--:--');

    let finalClockOut = type === 'out'
      ? nowTime
      : (targetDoc?.clockOut && targetDoc.clockOut !== '--:--' ? targetDoc.clockOut : '--:--');

    // Calculate work hours if both clock-in and clock-out are present
    let workHrs = targetDoc?.workHrs || 'In Progress';
    if (finalClockIn !== '--:--' && finalClockOut !== '--:--') {
      try {
        const parse = (tStr) => {
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
        const inMins = parse(finalClockIn);
        const outMins = parse(finalClockOut);
        let diff = outMins - inMins;
        if (diff < 0) diff += 24 * 60;
        const hrs = Math.floor(diff / 60);
        const mins = diff % 60;
        workHrs = `${hrs} hrs ${mins} mins`;
      } catch (e) {
        workHrs = '8 hrs 00 mins';
      }
    } else if (type === 'in') {
      workHrs = 'In Progress';
    }

    const attendanceItem = {
      CompanyID: companyId || targetDoc?.CompanyID || 'comp_01',
      PunchID: targetId,
      id: targetId,
      UserID: employeeId,
      employeeId,
      UserName: employeeName,
      employeeName,
      date: today,
      PostingDate: today,
      Time: nowTime,
      clockIn: finalClockIn,
      clockOut: finalClockOut,
      workHrs,
      status: 'Present',
      Flag: 'P',
      Location: location || targetDoc?.Location || 'Office - HQ',
      location: location || targetDoc?.location || 'Office - HQ',
      Latitude: latitude ? String(latitude) : (targetDoc?.Latitude || '37.7751'),
      Longitude: longitude ? String(longitude) : (targetDoc?.Longitude || '-122.4192'),
      DistanceMeters: distance !== undefined ? distance : (targetDoc?.DistanceMeters || 0),
      notes: notes || (type === 'in' ? 'Clocked in successfully' : 'Clocked out successfully'),
      CreatedOn: targetDoc?.CreatedOn || new Date().toISOString()
    };

    try {
      if (db) {
        await setDoc(doc(db, 'attendance', targetId), attendanceItem);
      }
    } catch (error) {
      console.warn("Mark attendance error:", error.message);
      throw error;
    }
    return attendanceItem;
  },

  // One-time Fetch Leave Records directly from Firestore
  getLeaves: async () => {
    try {
      if (db) {
        const snapshot = await getDocs(collection(db, 'leaves'));
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (error) {
      console.warn("Leaves fetch error:", error.message);
    }
    return [];
  },

  // Apply Leave directly in database matching SSMS Leave_Application schema
  applyLeave: async (leaveData) => {
    const leaveId = 'LV_' + Date.now();
    const createdDateStr = new Date().toISOString();
    
    let leaveDays = 1;
    if (leaveData.startDate && leaveData.endDate) {
      try {
        const d1 = new Date(leaveData.startDate);
        const d2 = new Date(leaveData.endDate);
        const diffTime = Math.abs(d2 - d1);
        leaveDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      } catch (e) {
        leaveDays = 1;
      }
    }

    const newLeave = {
      id: leaveId,
      ID: leaveId,
      CompanyID: leaveData.companyId || leaveData.CompanyID || 'COMP_001',
      LeaveID: leaveId,
      UserID: leaveData.employeeId || leaveData.UserID || 'EMP_001',
      employeeId: leaveData.employeeId || leaveData.UserID || 'EMP_001',
      employeeName: leaveData.employeeName || leaveData.CreatedByUName || 'Employee',
      FromDate: leaveData.startDate || leaveData.FromDate || '',
      startDate: leaveData.startDate || leaveData.FromDate || '',
      Todate: leaveData.endDate || leaveData.Todate || '',
      endDate: leaveData.endDate || leaveData.Todate || '',
      LeaveDays: leaveDays,
      Reason: leaveData.reason || leaveData.Reason || '',
      reason: leaveData.reason || leaveData.Reason || '',
      ApprovedBy: '',
      Approveddate: null,
      IsActive: true,
      CreatedByUId: leaveData.employeeId || leaveData.UserID || 'EMP_001',
      CreatedByUName: leaveData.employeeName || leaveData.CreatedByUName || 'Employee',
      CreatedDate: createdDateStr,
      UpdatedByUId: leaveData.employeeId || leaveData.UserID || 'EMP_001',
      UpdatedByUName: leaveData.employeeName || leaveData.CreatedByUName || 'Employee',
      UpdatedDate: createdDateStr,
      Status: 'Pending',
      status: 'Pending',
      Remark: '',
      Rejecteddate: null,
      LeaveType: leaveData.type || leaveData.LeaveType || 'Casual Leave',
      type: leaveData.type || leaveData.LeaveType || 'Casual Leave',
    };

    try {
      if (db) {
        await setDoc(doc(db, 'leaves', leaveId), newLeave);
      }
    } catch (error) {
      console.warn("Apply leave error:", error.message);
      throw error;
    }
    return newLeave;
  },

  // Update Leave Status (Approve / Reject) in database matching SSMS Leave_Application schema
  updateLeaveStatus: async (leaveId, status, responderProfile = {}) => {
    const updatedDateStr = new Date().toISOString();
    const shortDate = updatedDateStr.split('T')[0];
    
    const updates = {
      Status: status,
      status: status,
      UpdatedByUId: responderProfile.uid || responderProfile.UserID || 'ADMIN_001',
      UpdatedByUName: responderProfile.name || responderProfile.FullName || 'Admin',
      UpdatedDate: updatedDateStr,
    };

    if (status === 'Approved') {
      updates.ApprovedBy = responderProfile.name || responderProfile.FullName || 'Admin';
      updates.Approveddate = shortDate;
    } else if (status === 'Rejected') {
      const reason = responderProfile.remark || 'Application rejected by manager';
      updates.Remark = reason;
      updates.Rejection_Reason = reason;
      updates.Rejecteddate = shortDate;
    }

    try {
      if (db && leaveId) {
        const ref = doc(db, 'leaves', leaveId);
        await updateDoc(ref, updates);
      }
    } catch (error) {
      console.warn("Update leave status error:", error.message);
      throw error;
    }
    return { leaveId, status };
  },

  // Update Pending Leave application details
  updateLeave: async (leaveId, updatedData) => {
    const updatedDateStr = new Date().toISOString();

    let leaveDays = 1;
    if (updatedData.startDate && updatedData.endDate) {
      try {
        const d1 = new Date(updatedData.startDate);
        const d2 = new Date(updatedData.endDate);
        const diffTime = Math.abs(d2 - d1);
        leaveDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      } catch (e) {
        leaveDays = 1;
      }
    }

    const updates = {
      FromDate: updatedData.startDate || updatedData.FromDate || '',
      startDate: updatedData.startDate || updatedData.FromDate || '',
      Todate: updatedData.endDate || updatedData.Todate || '',
      endDate: updatedData.endDate || updatedData.Todate || '',
      LeaveDays: leaveDays,
      Reason: updatedData.reason || updatedData.Reason || '',
      reason: updatedData.reason || updatedData.Reason || '',
      LeaveType: updatedData.type || updatedData.LeaveType || 'Casual Leave',
      type: updatedData.type || updatedData.LeaveType || 'Casual Leave',
      UpdatedDate: updatedDateStr,
    };

    try {
      if (db && leaveId) {
        const ref = doc(db, 'leaves', leaveId);
        await updateDoc(ref, updates);
      }
    } catch (error) {
      console.warn("Update leave error:", error.message);
      throw error;
    }
    return { leaveId, ...updates };
  },

  // Delete/Cancel Pending Leave application
  deleteLeave: async (leaveId) => {
    try {
      if (db && leaveId) {
        const ref = doc(db, 'leaves', leaveId);
        await deleteDoc(ref);
      }
    } catch (error) {
      console.warn("Delete leave error:", error.message);
      throw error;
    }
    return { leaveId };
  },

  // Add Attendance Correction Request
  addCorrection: async (correctionData) => {
    const correctionId = correctionData.ID || ('ac_' + Date.now());
    const payload = {
      ...correctionData,
      ID: correctionId
    };

    try {
      if (db) {
        const ref = doc(db, 'corrections', correctionId);
        await setDoc(ref, payload);
      }
    } catch (error) {
      console.warn("Add correction error:", error.message);
      throw error;
    }
    return payload;
  },

  // Update Pending Attendance Correction Request
  updateCorrection: async (correctionId, updatedData) => {
    const updatedDateStr = new Date().toISOString();
    const updates = {
      ...updatedData,
      UpdatedDate: updatedDateStr,
    };

    try {
      if (db && correctionId) {
        const ref = doc(db, 'corrections', correctionId);
        await updateDoc(ref, updates);
      }
    } catch (error) {
      console.warn("Update correction error:", error.message);
      throw error;
    }
    return { correctionId, ...updates };
  },

  // Delete/Cancel Pending Attendance Correction Request
  deleteCorrection: async (correctionId) => {
    try {
      if (db && correctionId) {
        const ref = doc(db, 'corrections', correctionId);
        await deleteDoc(ref);
      }
    } catch (error) {
      console.warn("Delete correction error:", error.message);
      throw error;
    }
  },

  // Add Miss Punch Request
  addMissPunch: async (missPunchData) => {
    const mpId = missPunchData.ID || missPunchData.id || ('mp_' + Date.now());
    const payload = {
      ...missPunchData,
      ID: mpId,
      id: mpId
    };

    try {
      if (db) {
        const ref = doc(db, 'misspunches', mpId);
        await setDoc(ref, payload);
      }
    } catch (error) {
      console.warn("Add miss punch error:", error.message);
      throw error;
    }
    return payload;
  },

  // Update Pending Miss Punch Request
  updateMissPunch: async (mpId, updatedData) => {
    const updatedDateStr = new Date().toISOString();
    const updates = {
      ...updatedData,
      UpdatedDate: updatedDateStr,
    };

    try {
      if (db && mpId) {
        const ref = doc(db, 'misspunches', mpId);
        await updateDoc(ref, updates);
      }
    } catch (error) {
      console.warn("Update miss punch error:", error.message);
      throw error;
    }
    return { mpId, ...updates };
  },

  // Delete/Cancel Pending Miss Punch Request
  deleteMissPunch: async (mpId) => {
    try {
      if (db && mpId) {
        const ref = doc(db, 'misspunches', mpId);
        await deleteDoc(ref);
      }
    } catch (error) {
      console.warn("Delete miss punch error:", error.message);
      throw error;
    }
    return { mpId };
  }
};
