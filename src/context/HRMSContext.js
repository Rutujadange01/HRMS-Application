import React, { createContext, useState, useEffect } from 'react';
import { companyService } from '../services/companyService';
import { employeeService } from '../services/employeeService';
import { attendanceService } from '../services/attendanceService';
import { seedService } from '../services/seedService';
import { locationService } from '../services/locationService';

export const HRMSContext = createContext();

export const HRMSProvider = ({ children }) => {
  const [company, setCompany] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [leaves, setLeaves] = useState([]);
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
      const unsubEmps = employeeService.subscribeEmployees((data) => setEmployees(data));
      const unsubAtt = attendanceService.subscribeAttendance((data) => setAttendanceLogs(data));
      const unsubLeaves = attendanceService.subscribeLeaves((data) => setLeaves(data));

      unsubs = [unsubCompany, unsubDepts, unsubEmps, unsubAtt, unsubLeaves];
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
    const openLog = (attendanceLogs || []).find(l => {
      const lDate = l.date || l.PostingDate || (l.CreatedOn ? l.CreatedOn.split('T')[0] : '');
      const hasIn = l.clockIn && l.clockIn !== '--:--';
      const noOut = !l.clockOut || l.clockOut === '--:--';
      return lDate === today && hasIn && noOut;
    });
    setClockedIn(!!openLog);
  }, [attendanceLogs]);

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

  // Add Employee to Firestore
  const addEmployee = async (empData) => {
    await employeeService.addEmployee(empData);
  };

  // Update Employee in Firestore
  const updateEmployee = async (id, updatedFields) => {
    await employeeService.updateEmployee(id, updatedFields);
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

    // Validate Geofence if required by Company settings
    if (isGeoRequired && maxRadius > 0 && distMeters > maxRadius) {
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
    await attendanceService.updateLeave(leaveId, updatedData);
  };

  // Delete / Cancel Pending Leave application
  const deleteLeave = async (leaveId) => {
    await attendanceService.deleteLeave(leaveId);
  };

  return (
    <HRMSContext.Provider
      value={{
        company,
        departments,
        employees,
        attendanceLogs,
        leaves,
        loading,
        clockedIn,
        lastClockInTime,
        updateCompany,
        addDepartment,
        deleteDepartment,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        toggleClockIn,
        applyLeave,
        respondToLeave,
        updateLeave,
        deleteLeave
      }}
    >
      {children}
    </HRMSContext.Provider>
  );
};
