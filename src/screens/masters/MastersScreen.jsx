import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, Switch } from 'react-native';
import { HRMSContext } from '../../context/HRMSContext';
import { AuthContext } from '../../context/AuthContext';
import { companyService } from '../../services/companyService';
import { COLORS } from '../../constants/theme';
import { DatePickerInput } from '../../components/DatePickerInput';
import { TimePickerInput } from '../../components/TimePickerInput';
import { Settings, Layers, Clock, Calendar, Plus, Trash2, Edit3, ChevronDown } from 'lucide-react-native';

export const MastersScreen = () => {
  const {
    departments, addDepartment, updateDepartment, deleteDepartment,
    shifts, addShift, updateShift, deleteShift,
    holidays, addHoliday, updateHoliday, deleteHoliday,
    salaryComponents, addSalaryComponent, updateSalaryComponent, deleteSalaryComponent
  } = useContext(HRMSContext);

  const { profile } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('dept'); // dept | shift | holiday
  const [deptModalVisible, setDeptModalVisible] = useState(false);
  const [shiftModalVisible, setShiftModalVisible] = useState(false);
  const [holidayModalVisible, setHolidayModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  // Edit Modes
  const [editDeptId, setEditDeptId] = useState(null);
  const [editShiftId, setEditShiftId] = useState(null);
  const [editHolidayId, setEditHolidayId] = useState(null);
  const [editCategoryId, setEditCategoryId] = useState(null);

  // Department Master Fields
  const [deptName, setDeptName] = useState('');
  const [shortName, setShortName] = useState('');
  const [description, setDescription] = useState('');
  const [deptIsActive, setDeptIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  // Shift Master Fields
  const [shiftName, setShiftName] = useState('');
  const [shiftShort, setShiftShort] = useState('');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('06:00 PM');
  const [graceMin, setGraceMin] = useState('15');
  const [shiftIsActive, setShiftIsActive] = useState(true);

  // Holiday Master Fields
  const [holidayTitle, setHolidayTitle] = useState('');
  const [holidayDate, setHolidayDate] = useState('');

  // Company selection state
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const comps = await companyService.getAllCompanies();
        const myUserId = String(profile?.uid || profile?.UserID || '').toLowerCase().trim();
        const myComps = comps.filter(c => {
          const creatorId = String(c.CreatedByUId || c.userId || c.CreatedBy || '').toLowerCase().trim();
          return creatorId === myUserId || c.id === 'comp_01'; // Fallback
        });
        setAvailableCompanies(myComps);
        if (myComps.length > 0) {
          setSelectedCompanyId(myComps[0].id || myComps[0].CompanyID);
        }
      } catch (err) {
        console.warn("Failed to load companies in Masters", err);
      }
    };
    fetchCompanies();
  }, [profile]);

  const renderCompanySelector = () => {
    if (availableCompanies.length === 0) return null;
    
    const selectedComp = availableCompanies.find(c => (c.id || c.CompanyID) === selectedCompanyId);
    
    return (
      <View style={{ marginBottom: 16 }}>
        <Text style={styles.inputLabel}>Assign to Company</Text>
        <TouchableOpacity
          style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: showCompanyDropdown ? 0 : 4, ...(showCompanyDropdown ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 } : {}) }]}
          onPress={() => setShowCompanyDropdown(!showCompanyDropdown)}
        >
          <Text style={{ color: selectedCompanyId ? COLORS.textPrimary : COLORS.textSecondary, flex: 1 }} numberOfLines={1}>
            {selectedComp ? (selectedComp.CompanyName || selectedComp.name || selectedComp.Company_Name || selectedComp.id) : 'Select a company...'}
          </Text>
          <ChevronDown size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>

        {showCompanyDropdown && (
          <View style={{
            backgroundColor: '#fff',
            borderWidth: 1,
            borderColor: COLORS.border,
            borderTopWidth: 0,
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}>
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true}>
              {availableCompanies.map(c => {
                const compId = c.id || c.CompanyID;
                const isSelected = selectedCompanyId === compId;
                return (
                  <TouchableOpacity
                    key={compId}
                    style={{ padding: 12, backgroundColor: isSelected ? 'rgba(239, 68, 68, 0.08)' : '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border }}
                    onPress={() => { setSelectedCompanyId(compId); setShowCompanyDropdown(false); }}
                  >
                    <Text style={{ color: isSelected ? COLORS.danger : COLORS.textPrimary, fontWeight: isSelected ? '600' : 'normal' }}>
                      {c.CompanyName || c.name || c.Company_Name || compId}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };
  const [holidayDescription, setHolidayDescription] = useState('');
  const [holidayIsActive, setHolidayIsActive] = useState(true);
  const [isNationalHoliday, setIsNationalHoliday] = useState(false);

  // Category (Salary Component) Master Fields
  const [compCode, setCompCode] = useState('');
  const [compName, setCompName] = useState('');
  const [compType, setCompType] = useState('Earning'); // Earning, Deduction
  const [calcType, setCalcType] = useState(''); // Percentage, Flat
  const [defValue, setDefValue] = useState('');
  const [printName, setPrintName] = useState('');
  const [isTaxable, setIsTaxable] = useState(false);
  const [isPFApplicable, setIsPFApplicable] = useState(false);
  const [isESIApplicable, setIsESIApplicable] = useState(false);
  const [isPartOfCTC, setIsPartOfCTC] = useState(true);
  const [isPartOfGross, setIsPartOfGross] = useState(true);
  const [isMandatory, setIsMandatory] = useState(true);
  const [applicableFor, setApplicableFor] = useState('All');
  const [priorityOrder, setPriorityOrder] = useState('1');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [formulaExpr, setFormulaExpr] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [taxExemption, setTaxExemption] = useState('');
  const [categoryIsActive, setCategoryIsActive] = useState(true);

  const openDeptModal = (dept = null) => {
    if (dept) {
      setEditDeptId(dept.id || dept.DepartmentID);
      setDeptName(dept.DepartmentName || dept.name || '');
      setShortName(dept.ShortName || dept.code || '');
      setDescription(dept.Description || '');
      setDeptIsActive(dept.IsActive !== false);
      setSelectedCompanyId(dept.CompanyID || availableCompanies[0]?.id || 'comp_01');
    } else {
      setEditDeptId(null);
      setDeptName('');
      setShortName('');
      setDescription('');
      setDeptIsActive(true);
      setSelectedCompanyId(availableCompanies[0]?.id || 'comp_01');
    }
    setDeptModalVisible(true);
  };

  const handleSaveDept = async () => {
    if (!deptName || !shortName) {
      Alert.alert("Missing Fields", "Please enter Department Name and Short Name.");
      return;
    }
    setLoading(true);
    try {
      if (editDeptId) {
        const updatePayload = {
          DepartmentName: deptName,
          name: deptName,
          ShortName: shortName,
          code: shortName,
          Description: description,
          IsActive: deptIsActive,
          CompanyID: selectedCompanyId || 'comp_01'
        };

        await updateDepartment(editDeptId, updatePayload);
        Alert.alert("Success", "Department Updated");
      } else {
        const deptId = 'dept_' + Date.now();
        const payload = {
          DepartmentID: deptId,
          id: deptId,
          DepartmentName: deptName,
          name: deptName,
          CompanyID: selectedCompanyId || 'comp_01',
          ShortName: shortName,
          code: shortName,
          Description: description || 'Department Unit',
          IsActive: deptIsActive,
          CreatedByUId: 'demo_admin_123',
          CreatedByUName: 'Admin',
          CreatedDate: new Date().toISOString(),
          head: 'Manager',
          employeeCount: 0
        };

        await addDepartment(payload);
        Alert.alert("Success", "Department Created");
      }
      setDeptModalVisible(false);
    } catch (error) {
      Alert.alert("Database Error", `Failed to save Department: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openShiftModal = (shift = null) => {
    if (shift) {
      setEditShiftId(shift.id || shift.ShiftID);
      setShiftName(shift.ShiftName || '');
      setShiftShort(shift.ShortName || '');
      setStartTime(shift.StartTime || '09:00 AM');
      setEndTime(shift.EndTime || '06:00 PM');
      setGraceMin(String(shift.GraceTime_Min || 15));
      setShiftIsActive(shift.IsActive !== false);
      setSelectedCompanyId(shift.CompanyID || availableCompanies[0]?.id || 'comp_01');
    } else {
      setEditShiftId(null);
      setShiftName('');
      setShiftShort('');
      setStartTime('09:00 AM');
      setEndTime('06:00 PM');
      setGraceMin('15');
      setShiftIsActive(true);
      setSelectedCompanyId(availableCompanies[0]?.id || 'comp_01');
    }
    setShiftModalVisible(true);
  };

  const handleSaveShift = async () => {
    if (!shiftName || !shiftShort) {
      Alert.alert("Missing Fields", "Please enter Shift Name and Short Name.");
      return;
    }
    setLoading(true);
    try {
      if (editShiftId) {
        const updatePayload = {
          ShiftName: shiftName,
          ShortName: shiftShort,
          StartTime: startTime,
          EndTime: endTime,
          GraceTime_Min: Number(graceMin) || 15,
          IsActive: shiftIsActive,
          CompanyID: selectedCompanyId || 'comp_01'
        };

        await updateShift(editShiftId, updatePayload);
        Alert.alert("Success", "Shift Updated");
      } else {
        const shiftId = 'sh_' + Date.now();
        const payload = {
          ShiftID: shiftId,
          id: shiftId,
          ShiftName: shiftName,
          ShortName: shiftShort,
          StartTime: startTime,
          EndTime: endTime,
          GraceTime_Min: Number(graceMin) || 15,
          IsActive: shiftIsActive,
          CompanyID: selectedCompanyId || 'comp_01'
        };

        await addShift(payload);
        Alert.alert("Success", "Shift Created");
      }
      setShiftModalVisible(false);
    } catch (error) {
      Alert.alert("Database Error", `Failed to save Shift: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openHolidayModal = (hol = null) => {
    if (hol) {
      setEditHolidayId(hol.id);
      setHolidayTitle(hol.HolidayName || '');
      setHolidayDate(hol.HolidayDate || '');
      setHolidayDescription(hol.Description || '');
      setHolidayIsActive(hol.IsActive !== false);
      setIsNationalHoliday(hol.IsNationalHoliday || false);
      setSelectedCompanyId(hol.CompanyID || availableCompanies[0]?.id || 'comp_01');
    } else {
      setEditHolidayId(null);
      setHolidayTitle('');
      setHolidayDate('');
      setHolidayDescription('');
      setHolidayIsActive(true);
      setIsNationalHoliday(false);
      setSelectedCompanyId(availableCompanies[0]?.id || 'comp_01');
    }
    setHolidayModalVisible(true);
  };

  const handleSaveHoliday = async () => {
    if (!holidayTitle || !holidayDate) {
      Alert.alert("Missing Fields", "Please enter Holiday Title and Date.");
      return;
    }
    setLoading(true);
    try {
      if (editHolidayId) {
        const updatePayload = {
          HolidayName: holidayTitle,
          HolidayDate: holidayDate,
          Description: holidayDescription || '',
          IsActive: holidayIsActive,
          IsNationalHoliday: isNationalHoliday,
          CompanyID: selectedCompanyId || 'comp_01',
          UpdatedByUId: profile?.uid || profile?.UserID || '',
          UpdatedDate: new Date().toISOString()
        };

        await updateHoliday(editHolidayId, updatePayload);
        Alert.alert("Success", "Holiday Updated");
      } else {
        const holId = 'hol_' + Date.now();
        const payload = {
          HolidayID: holId,
          HolidayName: holidayTitle,
          HolidayDate: holidayDate,
          Description: holidayDescription || '',
          IsActive: holidayIsActive,
          IsNationalHoliday: isNationalHoliday,
          CompanyID: selectedCompanyId || 'comp_01',
          CreatedByUId: profile?.uid || profile?.UserID || 'unknown_user',
          CreatedDate: new Date().toISOString(),
          UpdatedByUId: profile?.uid || profile?.UserID || '',
          UpdatedDate: new Date().toISOString()
        };

        await addHoliday(payload);
        Alert.alert("Success", "Holiday Created");
      }
      setHolidayModalVisible(false);
    } catch (error) {
      Alert.alert("Database Error", `Failed to save Holiday: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openCategoryModal = (cat = null) => {
    if (cat) {
      setEditCategoryId(cat.id || cat.SalaryComponentId);
      setCompCode(cat.ComponentCode || '');
      setCompName(cat.ComponentName || '');
      setCompType(cat.ComponentType || 'Earning');
      setCalcType(cat.CalculationType || '');
      setDefValue(String(cat.DefaultValue || ''));
      setPrintName(cat.PrintName || '');
      setIsTaxable(!!cat.IsTaxable);
      setIsPFApplicable(!!cat.IsPFApplicable);
      setIsESIApplicable(!!cat.IsESIApplicable);
      setIsPartOfCTC(cat.IsPartOfCTC !== false && cat.IsPartOfCTC !== 0);
      setIsPartOfGross(cat.IsPartOfGross !== false && cat.IsPartOfGross !== 0);
      setIsMandatory(cat.IsMandatory !== false && cat.IsMandatory !== 0);
      setApplicableFor(cat.ApplicableFor || 'All');
      setPriorityOrder(String(cat.PriorityOrder || 1));
      setMinAmount(cat.MinimumAmount !== null ? String(cat.MinimumAmount) : '');
      setMaxAmount(cat.MaximumAmount !== null ? String(cat.MaximumAmount) : '');
      setFormulaExpr(cat.FormulaExpression || '');
      setCatDesc(cat.Description || '');
      setTaxExemption(cat.TaxExemptionLimit !== null ? String(cat.TaxExemptionLimit) : '');
      setCategoryIsActive(cat.IsActive !== false && cat.IsActive !== 0);
      setSelectedCompanyId(cat.CompanyID || availableCompanies[0]?.id || 'comp_01');
    } else {
      setEditCategoryId(null);
      setCompCode('');
      setCompName('');
      setCompType('Earning');
      setCalcType('');
      setDefValue('');
      setPrintName('');
      setIsTaxable(false);
      setIsPFApplicable(false);
      setIsESIApplicable(false);
      setIsPartOfCTC(true);
      setIsPartOfGross(true);
      setIsMandatory(true);
      setApplicableFor('All');
      setPriorityOrder('1');
      setMinAmount('');
      setMaxAmount('');
      setFormulaExpr('');
      setCatDesc('');
      setTaxExemption('');
      setCategoryIsActive(true);
      setSelectedCompanyId(availableCompanies[0]?.id || 'comp_01');
    }
    setCategoryModalVisible(true);
  };

  const handleSaveCategory = async () => {
    if (!compCode || !compName) {
      Alert.alert("Missing Fields", "Please enter Component Code and Name.");
      return;
    }
    setLoading(true);
    try {
      const catData = {
        ComponentCode: compCode,
        ComponentName: compName,
        ComponentType: compType,
        CalculationType: calcType,
        DefaultValue: Number(defValue) || 0,
        IsTaxable: isTaxable ? 1 : 0,
        TaxExemptionLimit: taxExemption ? Number(taxExemption) : null,
        IsPFApplicable: isPFApplicable ? 1 : 0,
        IsESIApplicable: isESIApplicable ? 1 : 0,
        IsPartOfCTC: isPartOfCTC ? 1 : 0,
        IsPartOfGross: isPartOfGross ? 1 : 0,
        PriorityOrder: Number(priorityOrder) || 1,
        IsMandatory: isMandatory ? 1 : 0,
        PrintName: printName || compName,
        ApplicableFor: applicableFor || 'All',
        DependentOnComponentId: 0,
        MinimumAmount: minAmount ? Number(minAmount) : null,
        MaximumAmount: maxAmount ? Number(maxAmount) : null,
        FormulaExpression: formulaExpr || null,
        Description: catDesc || null,
        Status: categoryIsActive,
        IsActive: categoryIsActive,
        CompanyID: selectedCompanyId || 'comp_01',
        UpdatedByUId: profile?.uid || profile?.UserID || profile?.email || '',
        UpdatedDate: new Date().toISOString()
      };

      if (editCategoryId) {

        await updateSalaryComponent(editCategoryId, catData);
        Alert.alert("Success", "Category Updated");
      } else {
        const compId = 'comp_' + Date.now();
        const payload = {
          SalaryComponentId: compId,
          id: compId,
          ...catData,
          CreatedByUId: profile?.uid || profile?.UserID || profile?.email || '',
          CreatedDate: new Date().toISOString()
        };

        await addSalaryComponent(payload);
        Alert.alert("Success", "Category Created");
      }
      setCategoryModalVisible(false);
    } catch (error) {
      Alert.alert("Database Error", `Failed to save Category: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerCard}>
        <Settings size={26} color={COLORS.primary} />
        <Text style={styles.headerTitle}>System Masters Setup</Text>
        <Text style={styles.headerSub}>Manage company departments & shift master configuration.</Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        {[
          { id: 'dept', label: 'Department Master', icon: Layers },
          { id: 'shift', label: 'Shift Master', icon: Clock },
          { id: 'holiday', label: 'Holiday Master', icon: Calendar },
          { id: 'category', label: 'Salary Components', icon: Settings },
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

      {/* Department Master */}
      {activeTab === 'dept' && (
        <View>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Department Master ({departments.length})</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => openDeptModal()}>
              <Plus size={16} color="#ffffff" />
              <Text style={styles.addText}>Add Dept Master</Text>
            </TouchableOpacity>
          </View>

          {departments.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No departments created yet. Tap '+ Add Dept Master' above to create!</Text>
            </View>
          ) : (
            [...departments].sort((a, b) => new Date(b.CreatedDate || 0) - new Date(a.CreatedDate || 0)).map((d) => {
              const isActive = d.IsActive !== false;
              return (
                <View key={d.id || d.DepartmentID} style={styles.card}>
                  <View style={styles.cardRow}>
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>{d.DepartmentName || d.name}</Text>
                      <View style={styles.metaRow}>

                        <Text style={styles.cardSub}>
                          ShortName: {d.ShortName || d.code}
                        </Text>
                        <View style={[styles.statusBadge, isActive ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
                          <Text style={styles.statusBadgeText}>{isActive ? 'Active' : 'Inactive'}</Text>
                        </View>
                      </View>
                      {d.Description ? <Text style={styles.descText}>{d.Description}</Text> : null}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 15 }}>
                      <TouchableOpacity onPress={() => openDeptModal(d)}>
                        <Edit3 size={18} color={COLORS.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteDepartment(d.id || d.DepartmentID)}>
                        <Trash2 size={18} color={COLORS.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* Shift Master */}
      {activeTab === 'shift' && (
        <View>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Shift Master ({shifts.length})</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => openShiftModal()}>
              <Plus size={16} color="#ffffff" />
              <Text style={styles.addText}>Add Shift Master</Text>
            </TouchableOpacity>
          </View>

          {[...shifts].sort((a, b) => new Date(b.CreatedDate || 0) - new Date(a.CreatedDate || 0)).map((s) => (
            <View key={s.ShiftID || s.id} style={styles.card}>
              <View style={styles.cardRow}>
                <View>
                  <Text style={styles.cardTitle}>{s.ShiftName} [{s.ShortName}]</Text>
                  <Text style={styles.cardSub}>
                    Timing: {s.StartTime} - {s.EndTime} • Grace: {s.GraceTime_Min} mins
                  </Text>
                  <View style={[styles.statusBadge, s.IsActive ? styles.statusBadgeActive : styles.statusBadgeInactive, { marginTop: 6 }]}>
                    <Text style={styles.statusBadgeText}>
                      {s.IsActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 15 }}>
                  <TouchableOpacity onPress={() => openShiftModal(s)}>
                    <Edit3 size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteShift(s.id || s.ShiftID)}>
                    <Trash2 size={18} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Holiday Master */}
      {activeTab === 'holiday' && (
        <View>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Holiday Matser </Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => openHolidayModal()}>
              <Plus size={16} color="#ffffff" />
              <Text style={styles.addText}>Add Holiday</Text>
            </TouchableOpacity>
          </View>

          {[...holidays].sort((a, b) => new Date(b.CreatedDate || 0) - new Date(a.CreatedDate || 0)).map((h) => (
            <View key={h.id} style={styles.card}>
              <View style={styles.cardRow}>
                <View>
                  <Text style={styles.cardTitle}>{h.HolidayName}</Text>
                  <View style={styles.metaRow}>
                    <Text style={[styles.cardSub, { marginTop: 0 }]}>{h.HolidayDate}</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <View style={[styles.statusBadge, h.IsActive ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
                        <Text style={styles.statusBadgeText}>{h.IsActive ? 'Active' : 'Inactive'}</Text>
                      </View>
                      {h.IsNationalHoliday && (
                        <View style={[styles.statusBadge, { backgroundColor: '#e0e7ff' }]}>
                          <Text style={[styles.statusBadgeText, { color: '#4338ca' }]}>National</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {h.Description ? <Text style={styles.cardDesc}>{h.Description}</Text> : null}
                </View>
                <View style={{ flexDirection: 'row', gap: 15 }}>
                  <TouchableOpacity onPress={() => openHolidayModal(h)}>
                    <Edit3 size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteHoliday(h.id)}>
                    <Trash2 size={18} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Category (Salary Component) Master */}
      {activeTab === 'category' && (
        <View style={styles.listContainer}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Salary Components ({salaryComponents.length})</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => openCategoryModal()}>
              <Plus size={16} color="#ffffff" />
              <Text style={styles.addText}>Add Component</Text>
            </TouchableOpacity>
          </View>

          {[...salaryComponents].sort((a, b) => new Date(b.CreatedDate || 0) - new Date(a.CreatedDate || 0)).map((c) => (
            <View key={c.id} style={styles.card}>
              <View style={styles.cardRow}>
                <View>
                  <Text style={styles.cardTitle}>{c.ComponentName} [{c.ComponentCode}]</Text>
                  <View style={styles.metaRow}>
                    <Text style={[styles.cardSub, { marginTop: 0 }]}>{c.ComponentType} • {c.CalculationType}</Text>
                  </View>
                  <Text style={styles.descText}>
                    Default: {c.DefaultValue} | Taxable: {c.IsTaxable ? 'Yes' : 'No'} | PF: {c.IsPFApplicable ? 'Yes' : 'No'} | ESI: {c.IsESIApplicable ? 'Yes' : 'No'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 15 }}>
                  <TouchableOpacity onPress={() => openCategoryModal(c)}>
                    <Edit3 size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteSalaryComponent(c.id)}>
                    <Trash2 size={18} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Add Dept Modal */}
      <Modal visible={deptModalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editDeptId ? 'Edit Department' : 'Add Department'}</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flexShrink: 1, marginVertical: 10 }}>
              {renderCompanySelector()}

              <Text style={styles.inputLabel}>Department Name</Text>
              <TextInput
                style={styles.input}
                value={deptName}
                onChangeText={setDeptName}
                placeholder="e.g. Quality Assurance"
                placeholderTextColor={COLORS.textSecondary}
              />

              <Text style={styles.inputLabel}>Department Short Name</Text>
              <TextInput
                style={styles.input}
                value={shortName}
                onChangeText={setShortName}
                placeholder="e.g. QA"
                placeholderTextColor={COLORS.textSecondary}
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. Software Testing & Compliance"
                placeholderTextColor={COLORS.textSecondary}
              />

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Status</Text>
                <Switch
                  value={deptIsActive}
                  onValueChange={setDeptIsActive}
                  thumbColor={deptIsActive ? COLORS.primary : COLORS.border}
                  trackColor={{ false: '#f4f4f5', true: '#d1fae5' }}
                />
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSaveDept} disabled={loading}>
              <Text style={styles.submitText}>{loading ? 'Saving...' : 'Save Department Master'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setDeptModalVisible(false)}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Shift Modal */}
      <Modal visible={shiftModalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editShiftId ? 'Edit Shift' : 'Add Shift'}</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flexShrink: 1, marginVertical: 10 }}>
              {renderCompanySelector()}

              <Text style={styles.inputLabel}>Shift Name</Text>
              <TextInput
                style={styles.input}
                value={shiftName}
                onChangeText={setShiftName}
                placeholder="e.g. Evening Flex Shift"
                placeholderTextColor={COLORS.textSecondary}
              />

              <Text style={styles.inputLabel}>Shift Short Code</Text>
              <TextInput
                style={styles.input}
                value={shiftShort}
                onChangeText={setShiftShort}
                placeholder="e.g. EVEN"
                placeholderTextColor={COLORS.textSecondary}
              />

              <TimePickerInput
                label="Start Time"
                value={startTime}
                onChangeText={setStartTime}
                placeholder="02:00 PM"
              />

              <TimePickerInput
                label="End Time"
                value={endTime}
                onChangeText={setEndTime}
                placeholder="11:00 PM"
              />

              <Text style={styles.inputLabel}>Grace Time Minutes</Text>
              <TextInput
                style={styles.input}
                value={graceMin}
                onChangeText={setGraceMin}
                placeholder="15"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
              />

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Status</Text>
                <Switch
                  value={shiftIsActive}
                  onValueChange={setShiftIsActive}
                  thumbColor={shiftIsActive ? COLORS.primary : COLORS.border}
                  trackColor={{ false: '#f4f4f5', true: '#d1fae5' }}
                />
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSaveShift} disabled={loading}>
              <Text style={styles.submitText}>{loading ? 'Saving...' : 'Save Shift'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setShiftModalVisible(false)}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Holiday Modal */}
      <Modal visible={holidayModalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editHolidayId ? 'Edit Holiday' : 'Add Holiday'}</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flexShrink: 1, marginVertical: 10 }}>
              {renderCompanySelector()}

              <Text style={styles.inputLabel}>Holiday Title</Text>
              <TextInput
                style={styles.input}
                value={holidayTitle}
                onChangeText={setHolidayTitle}
                placeholder="e.g. Christmas Day"
                placeholderTextColor={COLORS.textSecondary}
              />

              <DatePickerInput
                label="Date (YYYY-MM-DD)"
                value={holidayDate}
                onChangeText={setHolidayDate}
                placeholder="e.g. 2026-12-25"
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={styles.input}
                value={holidayDescription}
                onChangeText={setHolidayDescription}
                placeholder="e.g. Company closed for Christmas"
                placeholderTextColor={COLORS.textSecondary}
              />

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Is National Holiday</Text>
                <Switch
                  value={isNationalHoliday}
                  onValueChange={setIsNationalHoliday}
                  thumbColor={isNationalHoliday ? COLORS.primary : COLORS.border}
                  trackColor={{ false: '#f4f4f5', true: '#d1fae5' }}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Status</Text>
                <Switch
                  value={holidayIsActive}
                  onValueChange={setHolidayIsActive}
                  thumbColor={holidayIsActive ? COLORS.primary : COLORS.border}
                  trackColor={{ false: '#f4f4f5', true: '#d1fae5' }}
                />
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSaveHoliday} disabled={loading}>
              <Text style={styles.submitText}>{loading ? 'Saving...' : 'Save Holiday'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setHolidayModalVisible(false)}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Category Modal */}
      <Modal visible={categoryModalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editCategoryId ? 'Edit Component' : 'Add Component'}</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flexShrink: 1, marginVertical: 10 }}>

              {renderCompanySelector()}

              <Text style={styles.inputLabel}>Component Code *</Text>
              <TextInput
                style={styles.input}
                value={compCode}
                onChangeText={setCompCode}
                placeholder="e.g. BASIC"
                placeholderTextColor={COLORS.textSecondary}
              />
              <Text style={styles.inputLabel}>Component Name *</Text>
              <TextInput
                style={styles.input}
                value={compName}
                onChangeText={setCompName}
                placeholder="e.g. Basic Salary"
                placeholderTextColor={COLORS.textSecondary}
              />
              <Text style={styles.inputLabel}>Component Type (Earning/Deduction)</Text>
              <TextInput
                style={styles.input}
                value={compType}
                onChangeText={setCompType}
                placeholder="e.g. Earning"
                placeholderTextColor={COLORS.textSecondary}
              />

              <Text style={styles.inputLabel}>Calculation Type (Fixed/Percentage/Formula)</Text>
              <TextInput
                style={styles.input}
                value={calcType}
                onChangeText={setCalcType}
                placeholder="e.g. Percentage"
                placeholderTextColor={COLORS.textSecondary}
              />

              <Text style={styles.inputLabel}>Default Value</Text>
              <TextInput
                style={styles.input}
                value={defValue}
                onChangeText={setDefValue}
                placeholder="e.g. 50"
                keyboardType="numeric"
                placeholderTextColor={COLORS.textSecondary}
              />

              <Text style={styles.inputLabel}>Print Name</Text>
              <TextInput
                style={styles.input}
                value={printName}
                onChangeText={setPrintName}
                placeholder="e.g. Basic Pay"
                placeholderTextColor={COLORS.textSecondary}
              />

              <Text style={styles.inputLabel}>Applicable For</Text>
              <TextInput
                style={styles.input}
                value={applicableFor}
                onChangeText={setApplicableFor}
                placeholder="e.g. All"
                placeholderTextColor={COLORS.textSecondary}
              />

              <Text style={styles.inputLabel}>Priority Order</Text>
              <TextInput
                style={styles.input}
                value={priorityOrder}
                onChangeText={setPriorityOrder}
                placeholder="e.g. 1"
                keyboardType="numeric"
                placeholderTextColor={COLORS.textSecondary}
              />

              <Text style={styles.inputLabel}>Minimum Amount</Text>
              <TextInput
                style={styles.input}
                value={minAmount}
                onChangeText={setMinAmount}
                placeholder="e.g. 1000"
                keyboardType="numeric"
                placeholderTextColor={COLORS.textSecondary}
              />

              <Text style={styles.inputLabel}>Maximum Amount</Text>
              <TextInput
                style={styles.input}
                value={maxAmount}
                onChangeText={setMaxAmount}
                placeholder="e.g. 10000"
                keyboardType="numeric"
                placeholderTextColor={COLORS.textSecondary}
              />

              <Text style={styles.inputLabel}>Formula Expression</Text>
              <TextInput
                style={styles.input}
                value={formulaExpr}
                onChangeText={setFormulaExpr}
                placeholder="e.g. BASIC * 0.5"
                placeholderTextColor={COLORS.textSecondary}
              />

              <Text style={styles.inputLabel}>Tax Exemption Limit</Text>
              <TextInput
                style={styles.input}
                value={taxExemption}
                onChangeText={setTaxExemption}
                placeholder="e.g. 2500"
                keyboardType="numeric"
                placeholderTextColor={COLORS.textSecondary}
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={styles.input}
                value={catDesc}
                onChangeText={setCatDesc}
                placeholder="e.g. Allowances details"
                placeholderTextColor={COLORS.textSecondary}
              />

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Is Taxable?</Text>
                <Switch
                  value={isTaxable}
                  onValueChange={setIsTaxable}
                  thumbColor={isTaxable ? COLORS.primary : COLORS.border}
                  trackColor={{ false: '#f4f4f5', true: '#d1fae5' }}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Is PF Applicable?</Text>
                <Switch
                  value={isPFApplicable}
                  onValueChange={setIsPFApplicable}
                  thumbColor={isPFApplicable ? COLORS.primary : COLORS.border}
                  trackColor={{ false: '#f4f4f5', true: '#d1fae5' }}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Is ESI Applicable?</Text>
                <Switch
                  value={isESIApplicable}
                  onValueChange={setIsESIApplicable}
                  thumbColor={isESIApplicable ? COLORS.primary : COLORS.border}
                  trackColor={{ false: '#f4f4f5', true: '#d1fae5' }}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Is Part of CTC?</Text>
                <Switch
                  value={isPartOfCTC}
                  onValueChange={setIsPartOfCTC}
                  thumbColor={isPartOfCTC ? COLORS.primary : COLORS.border}
                  trackColor={{ false: '#f4f4f5', true: '#d1fae5' }}
                />
              </View>


              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Is Part of Gross?</Text>
                <Switch
                  value={isPartOfGross}
                  onValueChange={setIsPartOfGross}
                  thumbColor={isPartOfGross ? COLORS.primary : COLORS.border}
                  trackColor={{ false: '#f4f4f5', true: '#d1fae5' }}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Is Mandatory?</Text>
                <Switch
                  value={isMandatory}
                  onValueChange={setIsMandatory}
                  thumbColor={isMandatory ? COLORS.primary : COLORS.border}
                  trackColor={{ false: '#f4f4f5', true: '#d1fae5' }}
                />
              </View>

            </ScrollView>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSaveCategory} disabled={loading}>
              <Text style={styles.submitText}>{loading ? 'Saving...' : 'Save Component'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setCategoryModalVisible(false)}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
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
  headerCard: {
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 6,
  },
  headerSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  tabsScroll: {
    marginBottom: 16,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 4,
  },
  emptyCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cardSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
    marginRight: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  descText: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 0,
    marginBottom: 0,
  },
  statusBadgeActive: {
    backgroundColor: '#dcfce7',
  },
  statusBadgeInactive: {
    backgroundColor: '#fee2e2',
  },
  cardStatusActive: {
    color: '#15803d',
    fontWeight: '700',
    marginTop: 6,
  },
  cardStatusInactive: {
    color: '#b91c1c',
    fontWeight: '700',
    marginTop: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // Fixed:
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(63, 71, 82, 0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
    flexShrink: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    padding: 12,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  closeBtn: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  closeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  chipRow: {
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
  }
});
