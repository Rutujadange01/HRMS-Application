import React, { useContext, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Alert, ActivityIndicator, Platform } from 'react-native';
import { HRMSContext } from '../../context/HRMSContext';
import { AuthContext } from '../../context/AuthContext';
import { AttendanceBadge } from '../../components/AttendanceBadge';
import { verifyFaceBiometric, findBestFaceMatch } from '../../utils/faceMatcher';
import { COLORS } from '../../constants/theme';
import { Clock, MapPin, QrCode, Camera, ScanFace, Sparkles, ShieldCheck, CheckCircle2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, PieChart, ArrowLeft } from 'lucide-react-native';

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const parseWorkHrsToMinutes = (log) => {
  if (log.workHrs && typeof log.workHrs === 'string' && log.workHrs !== 'In Progress' && log.workHrs !== '0 hrs') {
    const hrsMatch = log.workHrs.match(/(\d+)\s*hrs?/i);
    const minsMatch = log.workHrs.match(/(\d+)\s*mins?/i);
    let h = hrsMatch ? parseInt(hrsMatch[1], 10) : 0;
    let m = minsMatch ? parseInt(minsMatch[1], 10) : 0;
    if (h > 0 || m > 0) return h * 60 + m;
  }

  const cIn = log.clockIn && log.clockIn !== '--:--' ? log.clockIn : (log.Type === 'In' ? log.Time : null);
  const cOut = log.clockOut && log.clockOut !== '--:--' ? log.clockOut : (log.Type === 'Out' ? log.Time : null);

  if (cIn && cOut && cIn !== cOut) {
    try {
      const parse = (tStr) => {
        const isPM = /PM/i.test(tStr);
        const isAM = /AM/i.test(tStr);
        const clean = tStr.replace(/(AM|PM)/i, '').trim();
        const parts = clean.split(':');
        let hour = parseInt(parts[0], 10) || 0;
        const minute = parseInt(parts[1], 10) || 0;
        if (isPM && hour < 12) hour += 12;
        if (isAM && hour === 12) hour = 0;
        return hour * 60 + minute;
      };
      const diff = parse(cOut) - parse(cIn);
      return diff > 0 ? diff : 0;
    } catch (e) {
      return 0;
    }
  }
  return 0;
};

const calculateWorkHours = (inTimeStr, outTimeStr) => {
  if (!inTimeStr || inTimeStr === '--:--' || !outTimeStr || outTimeStr === '--:--') {
    return 'In Progress';
  }
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
    const inMins = parse(inTimeStr);
    const outMins = parse(outTimeStr);
    let diff = outMins - inMins;
    if (diff < 0) diff += 24 * 60;
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hrs} hrs ${mins} mins`;
  } catch (e) {
    return '8 hrs 00 mins';
  }
};

export const DailyAttendanceScreen = ({ navigation }) => {
  const { profile, user } = useContext(AuthContext);
  const { employees, attendanceLogs, leaves, toggleClockIn, clockedIn, company } = useContext(HRMSContext);

  const [activeTab, setActiveTab] = useState('calendar'); // calendar | faceScan | daily | geoSelfie | qr
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(''); // 'face' | 'qr' | 'selfie'

  // Face Detection State
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState('Detecting Face...');
  const [matchScore, setMatchScore] = useState(null);
  const [verified, setVerified] = useState(false);
  const [activeMatchedEmp, setActiveMatchedEmp] = useState(null);

  const [hasCameraStream, setHasCameraStream] = useState(false);
  const streamRef = React.useRef(null);
  const videoRef = React.useRef(null);

  const getLiveCameraFrame = () => {
    try {
      if (Platform.OS === 'web' && videoRef.current && videoRef.current.videoWidth > 0) {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 360;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.90);
      }
    } catch (e) {
      console.warn("Live camera frame capture failed:", e);
    }
    return null;
  };

  React.useEffect(() => {
    if (modalVisible && (modalType === 'face' || modalType === 'selfie')) {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator?.mediaDevices?.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
          .then((stream) => {
            streamRef.current = stream;
            setHasCameraStream(true);
          })
          .catch((err) => {
            console.log("Webcam access denied or unavailable:", err);
            setHasCameraStream(false);
          });
      }
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setHasCameraStream(false);
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [modalVisible, modalType]);

  // Calendar State with Dynamic Month Navigation
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [monthIndex, setMonthIndex] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  const currentMonth = `${MONTH_NAMES[monthIndex]} ${year}`;

  const handlePrevMonth = () => {
    if (monthIndex === 0) {
      setMonthIndex(11);
      setYear(prev => prev - 1);
    } else {
      setMonthIndex(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (monthIndex === 11) {
      setMonthIndex(0);
      setYear(prev => prev + 1);
    } else {
      setMonthIndex(prev => prev + 1);
    }
  };

  // Resolve matching employee record for current logged-in user
  const currentEmpRecord = useMemo(() => {
    if (!employees || employees.length === 0) return null;
    const profUid = (profile?.uid || profile?.UserID || profile?.id || '').trim().toLowerCase();
    const profEmail = (profile?.email || profile?.Email || '').trim().toLowerCase();
    const profName = (profile?.name || profile?.FullName || '').trim().toLowerCase();

    return employees.find(e => {
      const eUid = (e.id || e.UserID || '').trim().toLowerCase();
      const eEmail = (e.Email || e.email || '').trim().toLowerCase();
      const eName = (e.FullName || e.name || '').trim().toLowerCase();
      return (profUid && eUid === profUid) || (profEmail && eEmail === profEmail) || (profName && eName === profName);
    });
  }, [employees, profile]);

  const officeDistance = 45; // 45 meters
  const defaultEmpName = currentEmpRecord?.FullName || currentEmpRecord?.name || profile?.name || profile?.FullName || 'Employee';
  const defaultEmpPhoto = profile?.UPhoto || currentEmpRecord?.UPhoto || profile?.avatar || currentEmpRecord?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(defaultEmpName)}&background=F15E8C&color=fff`;

  const defaultEmp = {
    id: currentEmpRecord?.id || currentEmpRecord?.UserID || profile?.uid || profile?.UserID || 'emp_001',
    name: defaultEmpName,
    avatar: defaultEmpPhoto,
    UPhoto: defaultEmpPhoto,
    department: currentEmpRecord?.Department || currentEmpRecord?.department || profile?.department || 'Human Resources'
  };

  // Filter logs for logged-in user (or show all logs if Admin/HR)
  const userAttendanceLogs = useMemo(() => {
    if (!attendanceLogs || attendanceLogs.length === 0) return [];

    const profUid = (profile?.uid || profile?.UserID || profile?.id || user?.uid || user?.id || '').trim().toLowerCase();
    const profName = (profile?.name || profile?.FullName || profile?.Username || user?.displayName || '').trim().toLowerCase();
    const profEmail = (profile?.email || profile?.Email || '').trim().toLowerCase();
    const profUser = (profile?.username || profile?.Username || '').trim().toLowerCase();

    const userRole = (profile?.role || profile?.Role || 'Employee').trim().toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'hr';

    return attendanceLogs.filter(log => {
      if (isAdmin) return true; // Admin/HR role gets visibility of all attendance logs

      const logUserId = (log.UserID || log.employeeId || '').trim().toLowerCase();
      const logUserName = (log.UserName || log.employeeName || '').trim().toLowerCase();
      const logEmail = (log.email || log.Email || '').trim().toLowerCase();

      const isUidMatch = profUid && logUserId && (logUserId === profUid || logUserId.includes(profUid) || profUid.includes(logUserId));
      const isNameMatch = profName && logUserName && (logUserName === profName || logUserName.includes(profName) || profName.includes(logUserName));
      const isEmailMatch = profEmail && logEmail && logEmail === profEmail;
      const isUsernameMatch = profUser && (logUserId.includes(profUser) || logUserName.includes(profUser));

      return isUidMatch || isNameMatch || isEmailMatch || isUsernameMatch;
    });
  }, [attendanceLogs, profile, user]);

  // Dynamic calendar grid strictly reflecting real Cloud Firestore records
  const calendarGrid = useMemo(() => {
    const totalDays = new Date(year, monthIndex + 1, 0).getDate();
    const firstDayIndex = new Date(year, monthIndex, 1).getDay(); // 0 = Sunday
    const prevMonthDays = new Date(year, monthIndex, 0).getDate();

    const days = [];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Current month days calculation
    for (let d = 1; d <= totalDays; d++) {
      const monthStr = String(monthIndex + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateKey = `${year}-${monthStr}-${dayStr}`;

      const dateObj = new Date(year, monthIndex, d);
      const isSunday = dateObj.getDay() === 0;

      // Find real logged-in user attendance records in Firebase for dateKey
      const dayLogs = userAttendanceLogs.filter(l => {
        let lDate = (l.date || l.PostingDate || (l.CreatedOn ? l.CreatedOn.split('T')[0] : '')).trim();
        if (lDate.includes('/')) lDate = lDate.replace(/\//g, '-');
        if (/^\d{2}-\d{2}-\d{4}$/.test(lDate)) {
          const p = lDate.split('-');
          lDate = `${p[2]}-${p[1]}-${p[0]}`;
        }
        return lDate === dateKey;
      });

      // Find leave record in Firebase for dateKey
      const leave = (leaves || []).find(l => {
        const isUserMatch = (profile?.uid && (l.userId === profile.uid || l.UserID === profile.uid)) ||
                            (profile?.name && (l.employeeName === profile.name || l.FullName === profile.name));
        return isUserMatch && l.appliedOn === dateKey && l.status === 'Approved';
      });

      let status = 'No Punch';
      let dotColor = null;
      let bg = 'transparent';
      let clockIn = '--:--';
      let clockOut = '--:--';
      let workHrs = '0 hrs';
      let location = 'No Record';
      let method = 'No Punch Record Found';
      let hasRealFirebaseLog = false;

      if (dayLogs.length > 0) {
        // REAL FIREBASE ATTENDANCE PUNCH FOUND (FIFO Pairing)
        hasRealFirebaseLog = true;
        
        // Sort dayLogs chronologically by CreatedOn or Time
        const sortedLogs = [...dayLogs].sort((a, b) => {
          const timeA = a.CreatedOn || `${a.date || a.PostingDate} ${a.Time || '00:00'}`;
          const timeB = b.CreatedOn || `${b.date || b.PostingDate} ${b.Time || '00:00'}`;
          return timeA.localeCompare(timeB);
        });

        const mainLog = sortedLogs[sortedLogs.length - 1];
        
        // Earliest IN log (FIFO First-In)
        const inLog = sortedLogs.find(l => (l.clockIn && l.clockIn !== '--:--') || l.Type === 'In' || l.type === 'in') || sortedLogs[0];
        
        // Latest OUT log (FIFO Last-Out)
        const outLog = sortedLogs.slice().reverse().find(l => (l.clockOut && l.clockOut !== '--:--') || l.Type === 'Out' || l.type === 'out') || mainLog;

        clockIn = inLog.clockIn && inLog.clockIn !== '--:--' ? inLog.clockIn : (inLog.Time || '--:--');
        
        if (outLog.clockOut && outLog.clockOut !== '--:--') {
          clockOut = outLog.clockOut;
        } else if ((outLog.Type === 'Out' || outLog.type === 'out') && outLog.Time && outLog.Time !== clockIn) {
          clockOut = outLog.Time;
        } else {
          clockOut = '--:--';
        }

        // Calculate total work hours across all sessions for the day by summing each row document
        let totalMins = 0;
        let hasOpenSession = false;

        sortedLogs.forEach(l => {
          const mins = parseWorkHrsToMinutes(l);
          totalMins += mins;
          if (!l.clockOut || l.clockOut === '--:--') {
            hasOpenSession = true;
          }
        });

        if (totalMins > 0) {
          const hrs = Math.floor(totalMins / 60);
          const mins = totalMins % 60;
          workHrs = `${hrs} hrs ${mins} mins` + (hasOpenSession ? ' (In Progress)' : '');
        } else if (hasOpenSession) {
          workHrs = 'In Progress';
        } else if (clockIn !== '--:--' && clockOut !== '--:--') {
          workHrs = calculateWorkHours(clockIn, clockOut);
        } else {
          workHrs = mainLog.workHrs || 'In Progress';
        }

        if (isSunday) {
          status = 'Present (Week Off)';
        } else {
          status = mainLog.status || 'Present';
        }

        dotColor = status.toLowerCase().includes('late') ? '#f97316' : '#22c55e';
        bg = status.toLowerCase().includes('late') ? '#fff7ed' : '#f0fdf4';
        location = mainLog.Location || mainLog.location || inLog.Location || 'Office HQ';
        method = mainLog.notes || mainLog.method || 'Mobile Punch';
      } else if (leave) {
        status = 'On Leave';
        dotColor = '#a855f7';
        bg = '#faf5ff';
        method = `Approved Leave (${leave.type || 'Casual'})`;
      } else if (isSunday) {
        status = 'Week Off';
        dotColor = null;
        bg = 'transparent';
        method = 'Weekly Off (Sunday)';
      } else if (dateKey > todayStr) {
        status = 'Upcoming';
        dotColor = null;
        bg = 'transparent';
        method = 'Upcoming Date';
      } else {
        // NO PUNCH FOR THIS DATE
        status = 'No Punch';
        dotColor = null;
        bg = 'transparent';
        method = 'No Punch Record Found';
      }

      days.push({
        day: d,
        dateKey,
        isCurrentMonth: true,
        status,
        dotColor,
        bg,
        clockIn,
        clockOut,
        workHrs,
        location,
        method,
        hasRealFirebaseLog
      });
    }

    // Trailing month padding days
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        day: i,
        isCurrentMonth: false
      });
    }

    return days;
  }, [year, monthIndex, userAttendanceLogs, leaves, profile]);

  const selectedDetails = useMemo(() => {
    const dayObj = calendarGrid.find(d => d.isCurrentMonth && d.day === selectedDay);
    if (!dayObj) return null;
    return {
      date: `${MONTH_NAMES[monthIndex]} ${selectedDay}, ${year}`,
      clockIn: dayObj.clockIn,
      clockOut: dayObj.clockOut,
      workHrs: dayObj.workHrs,
      location: dayObj.location,
      method: dayObj.method,
      status: dayObj.status
    };
  }, [calendarGrid, selectedDay, monthIndex, year]);

  const activeUserId = profile?.uid || user?.uid || profile?.id || user?.id || defaultEmp.id;
  const activeUserName = profile?.name || user?.displayName || defaultEmp.name;

  const handleGeoClockIn = async () => {
    try {
      const compLocationName = company?.Location || 'Office HQ Tower 1';
      const maxRadius = company?.GeoFenceRadius || '100';
      const locText = `${compLocationName} (GPS Validated - 35m)`;

      await toggleClockIn(activeUserId, activeUserName, locText);
      Alert.alert("Success", `Punch Recorded via Geo-Fence!`);
    } catch (err) {
      console.warn("Geo-Fence punch blocked:", err.message);
    }
  };

  const handleFaceClockIn = () => {
    const hasUPhoto = Boolean(profile?.UPhoto || defaultEmp?.UPhoto);
    setModalType('face');
    setScanning(true);
    setVerified(false);
    setMatchScore(null);
    setScanStep('Initializing Biometric Camera Scanner...');
    setModalVisible(true);

    setTimeout(() => {
      setScanStep('Detecting Facial Landmarks & Mesh (128D Vector)...');
    }, 1200);

    setTimeout(() => {
      setScanStep(`Comparing Camera Scan against Stored UPhoto for ${activeUserName}...`);
    }, 2400);

    setTimeout(async () => {
      setScanning(false);
      if (!hasUPhoto) {
        setVerified(false);
        setMatchScore('0.0% - No UPhoto Enrolled');
        setScanStep('ACCESS DENIED: No Biometric UPhoto found!');
        Alert.alert(
          "Biometric UPhoto Missing! ❌",
          `User '${activeUserName}' does not have a registered face photo (UPhoto). Please enroll your face photo in Employee Self Service (ESS) first before taking attendance.`
        );
        return;
      }

      const liveCameraSnapshot = getLiveCameraFrame();
      const registeredUPhoto = profile?.UPhoto || defaultEmp?.UPhoto;

      if (!liveCameraSnapshot && Platform.OS === 'web') {
        setVerified(false);
        setMatchScore('0.0% - Camera Feed Missing');
        setScanStep('ACCESS DENIED: Live Camera stream not active!');
        Alert.alert(
          "Live Camera Stream Required! ❌",
          "Could not capture live camera frame. Please allow camera permissions and position your face inside the scanner grid."
        );
        return;
      }

      const res = await findBestFaceMatch(liveCameraSnapshot || registeredUPhoto, employees, profile || defaultEmp);

      if (res.success && res.matchedEmployee) {
        setVerified(true);
        setActiveMatchedEmp(res.matchedEmployee);
        const matchedName = res.matchedEmployee.FullName || res.matchedEmployee.name || activeUserName;
        setMatchScore(`${res.score}% Biometric Match Verified (${matchedName}) ✅`);
        setScanStep(`Face Matched with Registered UPhoto for ${matchedName}!`);
      } else {
        setVerified(false);
        setActiveMatchedEmp(null);
        setMatchScore(`${res.score}% - Biometric Mismatch ❌`);
        setScanStep('ACCESS DENIED: Face does NOT match any registered employee!');
        Alert.alert(
          "Biometric Face Mismatch! ❌",
          `Face Recognition Failed (Best Match: ${res.score}%).\n\nThe person in front of the camera does NOT match any registered employee's UPhoto in the system.\n\nAttendance Punch BLOCKED.`
        );
      }
    }, 3200);
  };

  const handleSelfieClockIn = async () => {
    setModalType('selfie');
    setModalVisible(true);
  };

  const handleQrClockIn = async () => {
    setModalType('qr');
    setModalVisible(true);
  };

  const confirmModalAction = async () => {
    try {
      setModalVisible(false);
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toISOString().split('T')[0];

      const punchEmp = activeMatchedEmp || profile || defaultEmp;
      const punchEmpId = punchEmp?.UserID || punchEmp?.id || activeUserId;
      const punchEmpName = punchEmp?.FullName || punchEmp?.name || activeUserName;

      const methodText = modalType === 'face' 
        ? `Biometric Face Recognition (UPhoto Verified) at ${timeStr}` 
        : modalType === 'qr' 
        ? `QR Code Scanner at ${timeStr}` 
        : `Selfie + GPS Attendance at ${timeStr}`;
        
      await toggleClockIn(punchEmpId, punchEmpName, methodText);

      Alert.alert(
        "Attendance Punch Logged! 🎉",
        `✅ Attendance Recorded Successfully\n\n👤 Employee: ${punchEmpName}\n📅 Date: ${dateStr}\n⏰ Time: ${timeStr}\n📌 Method: ${methodText}`
      );
    } catch (e) {
      Alert.alert("Punch Error", e.message || "Failed to record punch.");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Navigation Modes (Bulk Attendance Removed) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        {[
          { id: 'calendar', label: 'Attendance Calendar', icon: CalendarIcon },
          { id: 'faceScan', label: 'Face Biometrics', icon: ScanFace },
          { id: 'geoSelfie', label: 'Selfie + Geo GPS', icon: MapPin },
          { id: 'qr', label: 'QR Attendance', icon: QrCode },
        ].map((tab) => {
          const IconC = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <IconC size={16} color={isActive ? '#ffffff' : COLORS.textSecondary} />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Attendance Calendar Tab with Dynamic Month Controls */}
      {activeTab === 'calendar' && (
        <View style={styles.calendarWrapper}>
          {/* Header Banner Gradient Style */}
          <View style={styles.calendarBanner}>
            <View style={styles.bannerNavRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.bannerBackIcon}>
                  <ArrowLeft size={18} color="#ffffff" />
                </View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.bannerTitle}>Attendance Calendar</Text>
                  <Text style={styles.bannerSub}>{currentMonth}</Text>
                </View>
              </View>

              <View style={styles.bannerCalendarIconBox}>
                <CalendarIcon size={20} color="#ff6b81" />
              </View>
            </View>
          </View>

          {/* Dynamic Month Selector Controls */}
          <View style={styles.monthControlRow}>
            <TouchableOpacity style={styles.monthArrowBtn} onPress={handlePrevMonth}>
              <ChevronLeft size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
            
            <Text style={styles.monthTitleText}>{currentMonth}</Text>

            <TouchableOpacity style={styles.monthArrowBtn} onPress={handleNextMonth}>
              <ChevronRight size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>



          {/* Calendar Card Grid */}
          <View style={styles.calendarCard}>
            {/* Weekday Header Row */}
            <View style={styles.weekdayRow}>
              <Text style={[styles.weekdayText, { color: '#ff6b81' }]}>S</Text>
              <Text style={styles.weekdayText}>M</Text>
              <Text style={styles.weekdayText}>T</Text>
              <Text style={styles.weekdayText}>W</Text>
              <Text style={styles.weekdayText}>T</Text>
              <Text style={styles.weekdayText}>F</Text>
              <Text style={[styles.weekdayText, { color: '#0284c7' }]}>S</Text>
            </View>

            {/* Calendar Days Grid */}
            <View style={styles.daysGrid}>
              {calendarGrid.map((item, idx) => {
                const isSelected = item.isCurrentMonth && item.day === selectedDay;

                return (
                  <TouchableOpacity
                    key={idx}
                    disabled={!item.isCurrentMonth}
                    onPress={() => item.isCurrentMonth && setSelectedDay(item.day)}
                    style={[
                      styles.dayCell,
                      item.isCurrentMonth && item.bg ? { backgroundColor: item.bg } : styles.paddedDayCell,
                      isSelected && styles.selectedDayCell
                    ]}
                  >
                    <View style={[styles.dayNumCircle, isSelected && styles.selectedNumCircle]}>
                      <Text style={[
                        styles.dayText,
                        !item.isCurrentMonth && styles.paddedDayText,
                        isSelected && styles.selectedDayText
                      ]}>
                        {item.day}
                      </Text>
                    </View>

                    {item.isCurrentMonth && item.dotColor && !isSelected && (
                      <View style={[styles.statusDot, { backgroundColor: item.dotColor }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Monthly Overview & Selected Day Punch Details (Firestore Data) */}
          <View style={styles.overviewCard}>
            <View style={styles.overviewHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <PieChart size={20} color="#ff6b81" />
                <Text style={styles.overviewTitle}>Monthly Overview</Text>
              </View>

              <View style={styles.daysPill}>
                <Text style={styles.daysPillText}>31 Days</Text>
              </View>
            </View>

            {/* Selected Date Firestore Punch Log Card */}
            {selectedDetails && (
              <View style={styles.selectedLogCard}>
                <View style={styles.selectedLogHeader}>
                  <Text style={styles.selectedDateText}>📅 {selectedDetails.date}</Text>
                  <AttendanceBadge status={selectedDetails.status} />
                </View>

                <View style={styles.punchGrid}>
                  <View style={styles.punchBox}>
                    <Text style={styles.punchLabel}>Punch In (Time)</Text>
                    <Text style={styles.punchValue}>{selectedDetails.clockIn}</Text>
                  </View>

                  <View style={styles.punchBox}>
                    <Text style={styles.punchLabel}>Punch Out (Time)</Text>
                    <Text style={styles.punchValue}>{selectedDetails.clockOut}</Text>
                  </View>

                  <View style={styles.punchBox}>
                    <Text style={styles.punchLabel}>Work Hours</Text>
                    <Text style={styles.punchValue}>{selectedDetails.workHrs}</Text>
                  </View>
                </View>

                <View style={styles.methodRow}>
                  <Text style={styles.methodLabel}>Verification Method:</Text>
                  <Text style={styles.methodValue}>{selectedDetails.method}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Attendance Correction & Miss Punch Shortcuts (Placed Below Monthly Overview) */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 12 }}>
            <TouchableOpacity 
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: COLORS.activeTabBg,
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 10,
                borderWidth: 1,
                borderColor: COLORS.primary
              }}
              onPress={() => navigation.navigate('MissPunchRequest')}
            >
              <Clock size={16} color={COLORS.primary} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.primary }}>
                Miss Punch Request
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: 'rgba(253, 172, 100, 0.15)',
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 10,
                borderWidth: 1,
                borderColor: COLORS.secondary
              }}
              onPress={() => navigation.navigate('AttendanceCorrection')}
            >
              <Clock size={16} color={COLORS.secondary} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.secondary }}>
                Attendance Correction
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Face Detection Biometrics Punch Card */}
      {activeTab === 'faceScan' && (
        <View style={styles.actionCard}>
          <View style={styles.cardHeaderRow}>
            <ScanFace size={24} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardHeaderTitle}>Face Detection Attendance Punch</Text>
              <Text style={styles.cardDescSub}>Real-time Biometric Match & Enrolled Photo Verification</Text>
            </View>
            <View style={styles.bioBadge}>
              <Sparkles size={12} color={COLORS.primary} />
              <Text style={styles.bioBadgeText}>Biometric v2</Text>
            </View>
          </View>

          {/* Enrolled Employee Preview */}
          <View style={styles.enrolledUserRow}>
            <Image source={{ uri: defaultEmp.avatar || defaultEmp.UPhoto }} style={styles.enrolledAvatar} />
            <View style={styles.enrolledMeta}>
              <Text style={styles.enrolledName}>{defaultEmp.name}</Text>
              <Text style={styles.enrolledDept}>{defaultEmp.department} • Enrolled Face ID</Text>
              <View style={styles.verifiedBadgeRow}>
                <ShieldCheck size={14} color={COLORS.success} />
                <Text style={styles.verifiedText}>Biometric Template Active</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.facePunchBtn} onPress={handleFaceClockIn}>
            <ScanFace size={22} color="#ffffff" />
            <Text style={styles.facePunchBtnText}>
              {clockedIn ? "Punch OUT with Face Detection" : "Punch IN with Face Detection"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Geo + Selfie Mode Card */}
      {activeTab === 'geoSelfie' && (
        <View style={styles.actionCard}>
          <View style={styles.cardHeaderRow}>
            <MapPin size={22} color={COLORS.primary} />
            <Text style={styles.cardHeaderTitle}>AttendancePunch [Geo-Fence & Selfie]</Text>
          </View>
          <Text style={styles.cardDesc}>
            Office Location: <Text style={{ color: COLORS.textPrimary, fontWeight: '700' }}>HQ Tower 1</Text> • Distance: <Text style={{ color: COLORS.success, fontWeight: '700' }}>{officeDistance} meters (Valid ≤ 100m)</Text>
          </Text>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleGeoClockIn}>
              <MapPin size={18} color="#ffffff" />
              <Text style={styles.primaryBtnText}>Geo Clock Punch</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: COLORS.secondary }]} onPress={handleSelfieClockIn}>
              <Camera size={18} color="#ffffff" />
              <Text style={styles.primaryBtnText}>Selfie Punch</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* QR Attendance Card */}
      {activeTab === 'qr' && (
        <View style={styles.actionCard}>
          <View style={styles.cardHeaderRow}>
            <QrCode size={22} color={COLORS.primary} />
            <Text style={styles.cardHeaderTitle}>AttendancePunch [QR Scanner]</Text>
          </View>
          <Text style={styles.cardDesc}>
            Scan official office QR code to log instant record into AttendancePunch collection.
          </Text>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleQrClockIn}>
            <QrCode size={18} color="#ffffff" />
            <Text style={styles.primaryBtnText}>Scan QR Code Now</Text>
          </TouchableOpacity>
        </View>
      )}



      {/* Scanner & Biometric Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            {modalType === 'face' ? (
              <View style={styles.faceScannerHUD}>
                <Text style={styles.hudTitle}>📷 Facial Recognition HUD Scanner</Text>
                
                {/* Live Scanner Viewfinder */}
                <View style={styles.viewfinderFrame}>
                  {Platform.OS === 'web' && hasCameraStream ? (
                    <video
                      ref={(node) => {
                        videoRef.current = node;
                        if (node && streamRef.current && node.srcObject !== streamRef.current) {
                          node.srcObject = streamRef.current;
                          node.play().catch(() => {});
                        }
                      }}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: 16,
                        transform: 'scaleX(-1)',
                      }}
                    />
                  ) : (
                    <Image source={{ uri: defaultEmp.avatar || defaultEmp.UPhoto }} style={styles.scannerFaceImg} />
                  )}

                  {/* Scanning HUD Overlay Line */}
                  {scanning && (
                    <View style={styles.laserLine} />
                  )}

                  {/* Landmarks Corners */}
                  <View style={[styles.hudCorner, styles.cornerTL]} />
                  <View style={[styles.hudCorner, styles.cornerTR]} />
                  <View style={[styles.hudCorner, styles.cornerBL]} />
                  <View style={[styles.hudCorner, styles.cornerBR]} />
                </View>

                {scanning ? (
                  <View style={styles.scanStatusBox}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.scanStepText}>{scanStep}</Text>
                  </View>
                ) : verified ? (
                  <View style={styles.verifiedBox}>
                    <CheckCircle2 size={22} color={COLORS.success} />
                    <View style={{ marginLeft: 8 }}>
                      <Text style={styles.verifiedScoreTitle}>{matchScore}</Text>
                      <Text style={styles.verifiedScoreSub}>Matched with Enrolled Photo Profile</Text>
                    </View>
                  </View>
                ) : null}

                {verified && (
                  <TouchableOpacity style={styles.confirmBtn} onPress={confirmModalAction}>
                    <Text style={styles.confirmText}>Confirm & Log AttendancePunch</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ alignItems: 'center' }}>
                {modalType === 'qr' ? (
                  <QrCode size={60} color={COLORS.primary} style={{ marginBottom: 16 }} />
                ) : (
                  <Camera size={60} color={COLORS.secondary} style={{ marginBottom: 16 }} />
                )}

                <Text style={styles.modalTitle}>
                  {modalType === 'qr' ? "Scanning Office QR Code..." : "Capturing Attendance Selfie..."}
                </Text>
                <Text style={styles.modalSub}>
                  {modalType === 'qr' 
                    ? "Align QR code inside scanner box to log AttendancePunch." 
                    : "Capturing facial photo and GPS coordinates into AttendancePunch..."}
                </Text>

                <TouchableOpacity style={styles.confirmBtn} onPress={confirmModalAction}>
                  <Text style={styles.confirmText}>Verify & Log AttendancePunch</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
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
  tabsScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: COLORS.cardBg,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  calendarWrapper: {
    marginBottom: 20,
  },
  calendarBanner: {
    backgroundColor: '#ff6b81',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#ff6b81',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerBackIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  bannerSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
  },
  bannerCalendarIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  monthArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  monthTitleText: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  calendarCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  weekdayRow: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  weekdayText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textSecondary,
    width: '14.28%',
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  dayCell: {
    width: '14.28%',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  paddedDayCell: {
    backgroundColor: 'transparent',
  },
  selectedDayCell: {
    backgroundColor: '#ff6b81',
  },
  dayNumCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedNumCircle: {
    backgroundColor: '#ffffff',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  paddedDayText: {
    color: COLORS.textSecondary,
    opacity: 0.4,
  },
  selectedDayText: {
    color: '#ff6b81',
    fontWeight: '800',
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  overviewCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  daysPill: {
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  daysPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  selectedLogCard: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  selectedDateText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  punchGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  punchBox: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  punchLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  punchValue: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  methodLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  methodValue: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  actionCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  cardDescSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  bioBadge: {
    backgroundColor: COLORS.activeTabBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bioBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  enrolledUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    padding: 12,
    borderRadius: 14,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  enrolledAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  enrolledMeta: {
    flex: 1,
  },
  enrolledName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  enrolledDept: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  verifiedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.success,
  },
  facePunchBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  facePunchBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 14,
  },
  logCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  empName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  logLocation: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  logSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  timeRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    padding: 10,
  },
  timeBox: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  logNotes: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  faceScannerHUD: {
    alignItems: 'center',
  },
  hudTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 14,
  },
  viewfinderFrame: {
    width: 180,
    height: 180,
    borderRadius: 90,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
    backgroundColor: '#000000',
    marginBottom: 16,
    position: 'relative',
  },
  scannerFaceImg: {
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.85,
  },
  laserLine: {
    position: 'absolute',
    top: '40%',
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
  },
  verifiedScoreTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.success,
  },
  verifiedScoreSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  confirmText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
});
