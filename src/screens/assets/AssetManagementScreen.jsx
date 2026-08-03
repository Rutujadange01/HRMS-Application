import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Platform } from 'react-native';
import { HRMSContext } from '../../context/HRMSContext';
import { companyService } from '../../services/companyService';
import { AuthContext } from '../../context/AuthContext';
import { COLORS } from '../../constants/theme';
import { DatePickerInput } from '../../components/DatePickerInput';
import { Package, User, Plus, X, Search, Laptop, Smartphone, Monitor, Edit3, Trash2, ChevronDown, CornerDownLeft, Eye } from 'lucide-react-native';

export const AssetManagementScreen = () => {
  const { profile } = useContext(AuthContext);
  const { assets, assetDeployments, employees, addAsset, addDeployment, updateAsset, updateDeployment, deleteAsset } = useContext(HRMSContext);

  const userRole = profile?.role || profile?.Role || 'Employee';
  const isEmployee = userRole === 'Employee';

  const profUid = (profile?.uid || profile?.UserID || profile?.id || '').trim().toLowerCase();

  const [activeTab, setActiveTab] = useState('Inventory'); // Inventory, Deployments
  const [modalVisible, setModalVisible] = useState(false);
  const [deployModalVisible, setDeployModalVisible] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [editingAssetId, setEditingAssetId] = useState(null);
  const [showAssetDropdown, setShowAssetDropdown] = useState(false);
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [selectedReturnAsset, setSelectedReturnAsset] = useState(null);
  const [returnForm, setReturnForm] = useState({ AssetConditionAtReturn: '', ReturnReason: '', ActualReturnDate: new Date().toISOString().split('T')[0] });
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedViewDep, setSelectedViewDep] = useState(null);
  const [assetSearch, setAssetSearch] = useState('');
  const [empSearch, setEmpSearch] = useState('');
  const [showAssetCompanyDropdown, setShowAssetCompanyDropdown] = useState(false);
  const [showDeployCompanyDropdown, setShowDeployCompanyDropdown] = useState(false);
  const [allCompanies, setAllCompanies] = useState([]);

  useEffect(() => {
    const fetchCompanies = async () => {
      const comps = await companyService.getAllCompanies();
      const myComps = comps.filter(c => {
        const isCreator = (c.CreatedByUId || c.AdminID || '').trim().toLowerCase() === profUid;
        const isAssigned = c.CompanyID === profile?.companyId || c.id === profile?.companyId || c.CompanyID === profile?.CompanyID || c.id === profile?.CompanyID;
        return isCreator || isAssigned;
      });
      setAllCompanies(myComps);
    };
    if (!isEmployee) fetchCompanies();
  }, [profUid, isEmployee, profile]);

  // Form states for Create Asset
  const [assetForm, setAssetForm] = useState({
    CompanyID: '',
    AssetCategory: 'Laptop',
    AssetCode: '',
    AssetModel: '',
    AssetName: '',
    AssetTag: '',
    AssetType: 'Hardware',
    Brand: '',
    Condition: 'Good',
    CurrentLocation: 'Office HQ',
    CurrentStatus: 'In Stock',
    InvoiceNumber: '',
    PurchaseDate: new Date().toISOString().split('T')[0],
    PurchaseValue: '',
    SerialNumber: '',
    VendorName: '',
    WarrantyDetails: '',
    WarrantyExpiryDate: ''
  });

  // Form states for Deploy Asset
  const [deployForm, setDeployForm] = useState({
    CompanyID: '',
    AssetConditionAtDeployment: 'Good',
    ExpectedReturnDate: '',
    Remarks: '',
    UserID: ''
  });

  const handleCreateAsset = async () => {
    if (!assetForm.AssetName || !assetForm.SerialNumber) {
      Alert.alert("Validation", "Asset Name and Serial Number are required.");
      return;
    }

    try {
      if (editingAssetId) {
        await updateAsset(editingAssetId, {
          ...assetForm,
          UpdatedByUId: profUid,
          UpdatedDate: new Date().toISOString()
        });

        // Auto-close active deployment if asset status is changed to Returned or In Stock
        if (assetForm.CurrentStatus === 'Returned' || assetForm.CurrentStatus === 'In Stock') {
          const activeDep = (assetDeployments || []).find(d => d.AssetID === editingAssetId && d.DeploymentStatus !== 'Returned');
          if (activeDep) {
            await updateDeployment(activeDep.id, {
              DeploymentStatus: 'Returned',
              ActualReturnDate: new Date().toISOString().split('T')[0],
              UpdatedByUId: profUid,
              UpdatedDate: new Date().toISOString()
            });
          }
        }

        Alert.alert("Success", "Asset updated successfully.");
      } else {
        const newAssetData = {
          ...assetForm,
          CompanyID: assetForm.CompanyID || profile?.companyId || 'comp_01',
          CreatedByUId: profUid,
          CreatedDate: new Date().toISOString(),
          IsActive: true
        };
        await addAsset(newAssetData);
        Alert.alert("Success", "Asset added to inventory.");
      }
      setModalVisible(false);
      setEditingAssetId(null);
      setAssetForm({ ...assetForm, CompanyID: '', AssetCode: '', AssetName: '', SerialNumber: '' });
    } catch (e) {
      Alert.alert("Error", "Failed to save asset.");
    }
  };

  const handleEditAsset = (asset) => {
    setEditingAssetId(asset.id);
    setAssetForm({
      CompanyID: asset.CompanyID || '',
      AssetCategory: asset.AssetCategory || 'Laptop',
      AssetCode: asset.AssetCode || '',
      AssetModel: asset.AssetModel || '',
      AssetName: asset.AssetName || '',
      AssetTag: asset.AssetTag || '',
      AssetType: asset.AssetType || 'Hardware',
      Brand: asset.Brand || '',
      Condition: asset.Condition || 'Good',
      CurrentLocation: asset.CurrentLocation || 'Office HQ',
      CurrentStatus: asset.CurrentStatus || 'In Stock',
      InvoiceNumber: asset.InvoiceNumber || '',
      PurchaseDate: asset.PurchaseDate || new Date().toISOString().split('T')[0],
      PurchaseValue: asset.PurchaseValue || '',
      SerialNumber: asset.SerialNumber || '',
      VendorName: asset.VendorName || '',
      WarrantyDetails: asset.WarrantyDetails || '',
      WarrantyExpiryDate: asset.WarrantyExpiryDate || ''
    });
    setModalVisible(true);
  };

  const handleDeleteAsset = async (id) => {
    try {
      await deleteAsset(id);
    } catch (e) {
      Alert.alert("Error", "Failed to delete asset.");
    }
  };

  const handleDeployAsset = async () => {
    if (!deployForm.UserID) {
      Alert.alert("Validation", "Please select an employee.");
      return;
    }

    const newDeploymentData = {
      ...deployForm,
      ActualReturnDate: '',
      AssetConditionAtReturn: '',
      AssetID: selectedAsset.id,
      CompanyID: deployForm.CompanyID || profile?.companyId || 'comp_01',
      CreatedByUId: profUid,
      CreatedDate: new Date().toISOString(),
      DeployedByUserID: profUid,
      DeploymentDate: new Date().toISOString().split('T')[0],
      DeploymentStatus: 'Deployed',
      ReturnReason: '',
      UpdatedByUId: profUid,
      UpdatedDate: new Date().toISOString()
    };

    try {
      await addDeployment(newDeploymentData);
      await updateAsset(selectedAsset.id, { CurrentStatus: 'Deployed' });

      setDeployModalVisible(false);
      setSelectedAsset(null);
      Alert.alert("Success", "Asset assigned to employee.");
    } catch (e) {
      Alert.alert("Error", "Failed to assign asset.");
    }
  };

  const submitReturnAsset = async () => {
    if (!returnForm.AssetConditionAtReturn || !returnForm.ReturnReason) {
      Alert.alert("Validation", "Please fill all fields.");
      return;
    }
    try {
      await updateDeployment(selectedReturnAsset.id, {
        DeploymentStatus: 'Returned',
        ActualReturnDate: returnForm.ActualReturnDate,
        AssetConditionAtReturn: returnForm.AssetConditionAtReturn,
        ReturnReason: returnForm.ReturnReason,
        UpdatedByUId: profUid,
        UpdatedDate: new Date().toISOString()
      });
      await updateAsset(selectedReturnAsset.AssetID, { CurrentStatus: 'Returned' });
      Alert.alert("Success", "Asset returned successfully.");
      setReturnModalVisible(false);
      setSelectedReturnAsset(null);
      setReturnForm({ AssetConditionAtReturn: '', ReturnReason: '', ActualReturnDate: new Date().toISOString().split('T')[0] });
    } catch (e) {
      Alert.alert("Error", "Failed to return asset.");
    }
  };

  const myDeployments = (assetDeployments || [])
    .filter(d => (d.UserID || '').trim().toLowerCase() === profUid)
    .sort((a, b) => new Date(b.CreatedDate || 0) - new Date(a.CreatedDate || 0));

  const sortedAssets = [...(assets || [])].sort((a, b) => new Date(b.CreatedDate || 0) - new Date(a.CreatedDate || 0));
  const sortedDeployments = [...(assetDeployments || [])].sort((a, b) => new Date(b.CreatedDate || 0) - new Date(a.CreatedDate || 0));

  const getAssetIcon = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('laptop')) return <Laptop size={24} color={COLORS.primary} />;
    if (cat.includes('mobile') || cat.includes('phone')) return <Smartphone size={24} color={COLORS.primary} />;
    return <Monitor size={24} color={COLORS.primary} />;
  };

  return (
    <View style={styles.container}>

      {!isEmployee && (
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'Inventory' ? styles.activeTab : styles.inactiveTab]} onPress={() => setActiveTab('Inventory')}>
            <Text style={[styles.tabText, activeTab === 'Inventory' && styles.activeTabText]}>Inventory</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'Deployments' ? styles.activeTab : styles.inactiveTab]} onPress={() => setActiveTab('Deployments')}>
            <Text style={[styles.tabText, activeTab === 'Deployments' && styles.activeTabText]}>Assignments</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* EMPLOYEE VIEW */}
        {isEmployee && (
          <View>
            <Text style={styles.sectionTitle}>My Current Assets</Text>
            {myDeployments.length === 0 ? (
              <Text style={styles.emptyText}>No assets assigned to you.</Text>
            ) : (
              myDeployments.map(dep => {
                const asset = assets.find(a => a.id === dep.AssetID);
                return (
                  <View key={dep.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      {getAssetIcon(asset?.AssetCategory)}
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.cardTitle}>{asset?.AssetName || 'Unknown Asset'}</Text>
                        <Text style={styles.cardSub}>{asset?.Brand} • S/N: {asset?.SerialNumber}</Text>
                      </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View>
                        <Text style={[styles.detailText, { marginBottom: 2 }]}>Deployed On: {dep.DeploymentDate}</Text>
                        {dep.DeployedByUserID && (
                          <Text style={[styles.detailText, { marginBottom: 0, fontSize: 12, color: COLORS.textSecondary }]}>
                            By: {employees?.find(e => (e.id === dep.DeployedByUserID || e.UserID === dep.DeployedByUserID))?.FullName || employees?.find(e => (e.id === dep.DeployedByUserID || e.UserID === dep.DeployedByUserID))?.name || 'Admin'}
                          </Text>
                        )}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ backgroundColor: dep.DeploymentStatus === 'Returned' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 12 }}>
                          <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 12 }}>{dep.DeploymentStatus}</Text>
                        </View>
                        <TouchableOpacity onPress={() => { setSelectedViewDep(dep); setViewModalVisible(true); }}>
                          <Eye size={18} color={COLORS.primary} />
                        </TouchableOpacity>
                        {dep.DeploymentStatus !== 'Returned' && (
                          <TouchableOpacity
                            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 8, borderRadius: 8, marginLeft: 12 }}
                            onPress={() => {
                              setSelectedReturnAsset(dep);
                              setReturnForm({ AssetConditionAtReturn: '', ReturnReason: '', ActualReturnDate: new Date().toISOString().split('T')[0] });
                              setReturnModalVisible(true);
                            }}
                          >
                            <CornerDownLeft size={18} color={COLORS.danger} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                )
              })
            )}
          </View>
        )}

        {/* ADMIN VIEW - INVENTORY */}
        {!isEmployee && activeTab === 'Inventory' && (
          <View>
            <TouchableOpacity style={styles.addBtn} onPress={() => {
              setEditingAssetId(null);
              setAssetForm({ ...assetForm, AssetCode: '', AssetName: '', SerialNumber: '' });
              setModalVisible(true);
            }}>
              <Plus size={20} color="#fff" />
              <Text style={styles.addBtnText}>Add New Asset</Text>
            </TouchableOpacity>

            {sortedAssets.map(asset => (
              <View key={asset.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  {getAssetIcon(asset.AssetCategory)}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.cardTitle}>{asset.AssetName}</Text>
                    <Text style={styles.cardSub}>{asset.AssetCategory} • {asset.Brand}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                    <View style={[styles.badge, asset.CurrentStatus === 'In Stock' ? styles.badgeSuccess : styles.badgeWarning]}>
                      <Text style={asset.CurrentStatus === 'In Stock' ? styles.textSuccess : styles.textWarning}>{asset.CurrentStatus}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleEditAsset(asset)}>
                      <Edit3 size={18} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteAsset(asset.id)}>
                      <Trash2 size={18} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.divider} />
                <Text style={styles.detailText}>S/N: {asset.SerialNumber} | Tag: {asset.AssetTag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ADMIN VIEW - DEPLOYMENTS */}
        {!isEmployee && activeTab === 'Deployments' && (
          <View>
            <TouchableOpacity style={styles.addBtn} onPress={() => { setSelectedAsset(null); setShowAssetDropdown(false); setShowEmpDropdown(false); setAssetSearch(''); setEmpSearch(''); setDeployModalVisible(true); }}>
              <Plus size={20} color="#fff" />
              <Text style={styles.addBtnText}>Assign Asset</Text>
            </TouchableOpacity>

            {sortedDeployments.map(dep => {
              const asset = assets.find(a => a.id === dep.AssetID);
              const emp = employees.find(e => (e.UserID || e.id) === dep.UserID);
              return (
                <View key={dep.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <User size={24} color={COLORS.secondary} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.cardTitle}>{emp?.name || emp?.FullName || 'Unknown User'}</Text>
                      <Text style={styles.cardSub}>{asset?.AssetName} (S/N: {asset?.SerialNumber})</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={[styles.badge, dep.DeploymentStatus === 'Returned' ? styles.badgeDanger : styles.badgeSuccess]}>
                        <Text style={dep.DeploymentStatus === 'Returned' ? styles.textDanger : styles.textSuccess}>{dep.DeploymentStatus}</Text>
                      </View>
                      <TouchableOpacity onPress={() => { setSelectedViewDep(dep); setViewModalVisible(true); }}>
                        <Eye size={18} color={COLORS.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.divider} />
                  <Text style={styles.detailText}>Deployed On: {dep.DeploymentDate}</Text>
                  {dep.DeployedByUserID && (
                    <Text style={styles.detailText}>
                      Deployed By: {employees?.find(e => (e.id === dep.DeployedByUserID || e.UserID === dep.DeployedByUserID))?.FullName || employees?.find(e => (e.id === dep.DeployedByUserID || e.UserID === dep.DeployedByUserID))?.name || 'Admin'}
                    </Text>
                  )}
                </View>
              )
            })}
          </View>
        )}

      </ScrollView>

      {/* CREATE ASSET MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingAssetId ? 'Edit Asset' : 'Add New Asset'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Select Company</Text>
              <TouchableOpacity
                style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: showAssetCompanyDropdown ? 0 : 12, ...(showAssetCompanyDropdown ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 } : {}) }]}
                onPress={() => setShowAssetCompanyDropdown(!showAssetCompanyDropdown)}
              >
                <Text style={{ color: assetForm.CompanyID ? COLORS.textPrimary : COLORS.textSecondary, flex: 1 }} numberOfLines={1}>
                  {assetForm.CompanyID ? allCompanies.find(c => c.id === assetForm.CompanyID || c.CompanyID === assetForm.CompanyID)?.CompanyName || assetForm.CompanyID : 'Select a company...'}
                </Text>
                <ChevronDown size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>

              {showAssetCompanyDropdown && (
                <View style={{
                  backgroundColor: '#fff',
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderTopWidth: 0,
                  borderBottomLeftRadius: 8,
                  borderBottomRightRadius: 8,
                  marginBottom: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}>
                  <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true}>
                    {allCompanies.map(comp => {
                      const compId = comp.id || comp.CompanyID;
                      const isSelected = assetForm.CompanyID === compId;
                      return (
                        <TouchableOpacity
                          key={compId}
                          style={{ padding: 12, backgroundColor: isSelected ? 'rgba(239, 68, 68, 0.08)' : '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border }}
                          onPress={() => { setAssetForm({ ...assetForm, CompanyID: compId }); setShowAssetCompanyDropdown(false); }}
                        >
                          <Text style={{ color: isSelected ? COLORS.danger : COLORS.textPrimary, fontWeight: isSelected ? '600' : 'normal' }}>{comp.CompanyName || comp.name || compId}</Text>
                        </TouchableOpacity>
                      )
                    })}
                  </ScrollView>
                </View>
              )}

              <Text style={styles.label}>Asset Name</Text>
              <TextInput style={styles.input} value={assetForm.AssetName} onChangeText={t => setAssetForm({ ...assetForm, AssetName: t })} placeholder="e.g. MacBook Pro 14" />

              <Text style={styles.label}>Category</Text>
              <TextInput style={styles.input} value={assetForm.AssetCategory} onChangeText={t => setAssetForm({ ...assetForm, AssetCategory: t })} />

              <Text style={styles.label}>Brand</Text>
              <TextInput style={styles.input} value={assetForm.Brand} onChangeText={t => setAssetForm({ ...assetForm, Brand: t })} />

              <Text style={styles.label}>Serial Number</Text>
              <TextInput style={styles.input} value={assetForm.SerialNumber} onChangeText={t => setAssetForm({ ...assetForm, SerialNumber: t })} />

              <Text style={styles.label}>Asset Tag</Text>
              <TextInput style={styles.input} value={assetForm.AssetTag} onChangeText={t => setAssetForm({ ...assetForm, AssetTag: t })} />

              <Text style={styles.label}>Asset Code</Text>
              <TextInput style={styles.input} value={assetForm.AssetCode} onChangeText={t => setAssetForm({ ...assetForm, AssetCode: t })} />

              <Text style={styles.label}>Asset Model</Text>
              <TextInput style={styles.input} value={assetForm.AssetModel} onChangeText={t => setAssetForm({ ...assetForm, AssetModel: t })} />

              <Text style={styles.label}>Asset Type</Text>
              <TextInput style={styles.input} value={assetForm.AssetType} onChangeText={t => setAssetForm({ ...assetForm, AssetType: t })} />

              <Text style={styles.label}>Condition</Text>
              <TextInput style={styles.input} value={assetForm.Condition} onChangeText={t => setAssetForm({ ...assetForm, Condition: t })} />

              <Text style={styles.label}>Current Location</Text>
              <TextInput style={styles.input} value={assetForm.CurrentLocation} onChangeText={t => setAssetForm({ ...assetForm, CurrentLocation: t })} />

              <Text style={styles.label}>Current Status</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
                {['In Stock', 'Deployed', 'Returned'].map(status => (
                  <TouchableOpacity
                    key={status}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: assetForm.CurrentStatus === status ? COLORS.primary : '#f1f5f9',
                      borderWidth: 1,
                      borderColor: assetForm.CurrentStatus === status ? COLORS.primary : COLORS.border,
                      marginRight: 8,
                      marginBottom: 8
                    }}
                    onPress={() => setAssetForm({ ...assetForm, CurrentStatus: status })}
                  >
                    <Text style={{
                      color: assetForm.CurrentStatus === status ? '#fff' : COLORS.textSecondary,
                      fontWeight: assetForm.CurrentStatus === status ? 'bold' : 'normal',
                      fontSize: 13
                    }}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Invoice Number</Text>
              <TextInput style={styles.input} value={assetForm.InvoiceNumber} onChangeText={t => setAssetForm({ ...assetForm, InvoiceNumber: t })} />

              <Text style={styles.label}>Purchase Date</Text>
              <DatePickerInput
                value={assetForm.PurchaseDate}
                onDateChange={t => setAssetForm({ ...assetForm, PurchaseDate: t })}
                placeholder="YYYY-MM-DD"
              />

              <Text style={styles.label}>Purchase Value</Text>
              <TextInput style={styles.input} value={assetForm.PurchaseValue} onChangeText={t => setAssetForm({ ...assetForm, PurchaseValue: t })} keyboardType="numeric" />

              <Text style={styles.label}>Vendor Name</Text>
              <TextInput style={styles.input} value={assetForm.VendorName} onChangeText={t => setAssetForm({ ...assetForm, VendorName: t })} />

              <Text style={styles.label}>Warranty Details</Text>
              <TextInput style={styles.input} value={assetForm.WarrantyDetails} onChangeText={t => setAssetForm({ ...assetForm, WarrantyDetails: t })} />

              <Text style={styles.label}>Warranty Expiry Date</Text>
              <DatePickerInput
                value={assetForm.WarrantyExpiryDate}
                onDateChange={t => setAssetForm({ ...assetForm, WarrantyExpiryDate: t })}
                placeholder="YYYY-MM-DD"
              />

              <TouchableOpacity style={styles.submitBtn} onPress={handleCreateAsset}>
                <Text style={styles.submitBtnText}>{editingAssetId ? 'Update Asset' : 'Save Asset'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* DEPLOY ASSET MODAL */}
      <Modal visible={deployModalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Asset</Text>
              <TouchableOpacity onPress={() => setDeployModalVisible(false)}>
                <X size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>

              <Text style={styles.label}>Select Company</Text>
              <TouchableOpacity
                style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: showDeployCompanyDropdown ? 0 : 12, ...(showDeployCompanyDropdown ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 } : {}) }]}
                onPress={() => setShowDeployCompanyDropdown(!showDeployCompanyDropdown)}
              >
                <Text style={{ color: deployForm.CompanyID ? COLORS.textPrimary : COLORS.textSecondary, flex: 1 }} numberOfLines={1}>
                  {deployForm.CompanyID ? allCompanies.find(c => c.id === deployForm.CompanyID || c.CompanyID === deployForm.CompanyID)?.CompanyName || deployForm.CompanyID : 'Select a company...'}
                </Text>
                <ChevronDown size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>

              {showDeployCompanyDropdown && (
                <View style={{
                  backgroundColor: '#fff',
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderTopWidth: 0,
                  borderBottomLeftRadius: 8,
                  borderBottomRightRadius: 8,
                  marginBottom: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}>
                  <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true}>
                    {allCompanies.map(comp => {
                      const compId = comp.id || comp.CompanyID;
                      const isSelected = deployForm.CompanyID === compId;
                      return (
                        <TouchableOpacity
                          key={compId}
                          style={{ padding: 12, backgroundColor: isSelected ? 'rgba(239, 68, 68, 0.08)' : '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border }}
                          onPress={() => { setDeployForm({ ...deployForm, CompanyID: compId }); setShowDeployCompanyDropdown(false); }}
                        >
                          <Text style={{ color: isSelected ? COLORS.danger : COLORS.textPrimary, fontWeight: isSelected ? '600' : 'normal' }}>{comp.CompanyName || comp.name || compId}</Text>
                        </TouchableOpacity>
                      )
                    })}
                  </ScrollView>
                </View>
              )}

              <Text style={styles.label}>Select Employee</Text>
              <TouchableOpacity
                style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: showEmpDropdown ? 0 : 12, ...(showEmpDropdown ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 } : {}) }]}
                onPress={() => setShowEmpDropdown(!showEmpDropdown)}
              >
                <Text style={{ color: deployForm.UserID ? COLORS.textPrimary : COLORS.textSecondary, flex: 1 }} numberOfLines={1}>
                  {deployForm.UserID ? employees.find(e => (e.UserID || e.id) === deployForm.UserID)?.name || employees.find(e => (e.UserID || e.id) === deployForm.UserID)?.FullName : 'Select an employee...'}
                </Text>
                <ChevronDown size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>

              {showEmpDropdown && (
                <View style={{
                  backgroundColor: '#fff',
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderTopWidth: 0,
                  borderBottomLeftRadius: 8,
                  borderBottomRightRadius: 8,
                  marginBottom: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}>

                  <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true}>
                    {employees.filter(e => !deployForm.CompanyID || e.CompanyID === deployForm.CompanyID).map(emp => {
                      const isSelected = deployForm.UserID === (emp.UserID || emp.id);
                      return (
                        <TouchableOpacity
                          key={emp.id}
                          style={{ padding: 12, backgroundColor: isSelected ? 'rgba(239, 68, 68, 0.08)' : '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border }}
                          onPress={() => { setDeployForm({ ...deployForm, UserID: emp.UserID || emp.id }); setShowEmpDropdown(false); }}
                        >
                          <Text style={{ color: isSelected ? COLORS.danger : COLORS.textPrimary, fontWeight: isSelected ? '600' : 'normal' }}>{emp.name || emp.FullName}</Text>
                        </TouchableOpacity>
                      )
                    })}
                  </ScrollView>
                </View>
              )}
              <Text style={styles.label}>Select Asset</Text>
              <TouchableOpacity
                style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: showAssetDropdown ? 0 : 12, ...(showAssetDropdown ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 } : {}) }]}
                onPress={() => setShowAssetDropdown(!showAssetDropdown)}
              >
                <Text style={{ color: selectedAsset ? COLORS.textPrimary : COLORS.textSecondary, flex: 1 }} numberOfLines={1}>
                  {selectedAsset ? `${selectedAsset.AssetName} (S/N: ${selectedAsset.SerialNumber})` : 'Select an asset...'}
                </Text>
                <ChevronDown size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>

              {showAssetDropdown && (
                <View style={{
                  backgroundColor: '#fff',
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderTopWidth: 0,
                  borderBottomLeftRadius: 8,
                  borderBottomRightRadius: 8,
                  marginBottom: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}>

                  <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true}>
                    {assets.filter(a => a.CurrentStatus === 'In Stock' && (!deployForm.CompanyID || a.CompanyID === deployForm.CompanyID)).map(asset => {
                      const isSelected = selectedAsset?.id === asset.id;
                      return (
                        <TouchableOpacity
                          key={asset.id}
                          style={{
                            padding: 12,
                            backgroundColor: isSelected ? 'rgba(239, 68, 68, 0.08)' : '#fff',
                            borderBottomWidth: 1,
                            borderBottomColor: COLORS.border
                          }}
                          onPress={() => { setSelectedAsset(asset); setShowAssetDropdown(false); }}
                        >
                          <Text style={{ color: isSelected ? COLORS.danger : COLORS.textPrimary, fontWeight: isSelected ? '600' : 'normal' }}>{asset.AssetName} (S/N: {asset.SerialNumber})</Text>
                        </TouchableOpacity>
                      )
                    })}
                    {assets.filter(a => a.CurrentStatus === 'In Stock' && (!deployForm.CompanyID || a.CompanyID === deployForm.CompanyID)).length === 0 && (
                      <View style={{ padding: 12 }}><Text style={{ color: COLORS.textSecondary }}>No available assets</Text></View>
                    )}
                  </ScrollView>
                </View>
              )}

              <Text style={styles.label}>Expected Return Date</Text>
              <DatePickerInput 
                value={deployForm.ExpectedReturnDate} 
                onChangeText={t => setDeployForm({ ...deployForm, ExpectedReturnDate: t })}
              />

              <Text style={styles.label}>Condition At Deployment</Text>
              <TextInput style={styles.input} value={deployForm.AssetConditionAtDeployment} onChangeText={t => setDeployForm({ ...deployForm, AssetConditionAtDeployment: t })} />

              <Text style={styles.label}>Remarks</Text>
              <TextInput style={styles.input} value={deployForm.Remarks} onChangeText={t => setDeployForm({ ...deployForm, Remarks: t })} />

              <TouchableOpacity style={styles.submitBtn} onPress={handleDeployAsset}>
                <Text style={styles.submitBtnText}>Confirm Assignment</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* RETURN ASSET MODAL */}
      <Modal visible={returnModalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Return Asset</Text>
              <TouchableOpacity onPress={() => setReturnModalVisible(false)}>
                <X size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>


              <Text style={styles.label}>Condition At Return</Text>
              <TextInput
                style={styles.input}
                value={returnForm.AssetConditionAtReturn}
                onChangeText={t => setReturnForm({ ...returnForm, AssetConditionAtReturn: t })}
                placeholder="e.g. Good, Scratched..."
              />

              <Text style={styles.label}>Return Reason / Remarks</Text>
              <TextInput
                style={styles.input}
                value={returnForm.ReturnReason}
                onChangeText={t => setReturnForm({ ...returnForm, ReturnReason: t })}
                placeholder="Why are you returning this?"
              />

              <TouchableOpacity style={styles.submitBtn} onPress={submitReturnAsset}>
                <Text style={styles.submitBtnText}>Confirm Return</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* VIEW DEPLOYMENT MODAL */}
      <Modal visible={viewModalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Deployment Details</Text>
              <TouchableOpacity onPress={() => setViewModalVisible(false)}>
                <X size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedViewDep && (() => {
                const dep = selectedViewDep;
                const asset = assets.find(a => a.id === dep.AssetID);
                const emp = employees.find(e => (e.UserID || e.id) === dep.UserID);
                const comp = allCompanies.find(c => c.id === dep.CompanyID || c.CompanyID === dep.CompanyID);
                return (
                  <View>
                    <Text style={styles.label}>Company</Text>
                    <TextInput style={[styles.input, { backgroundColor: '#f1f5f9', color: COLORS.textSecondary }]} value={comp?.CompanyName || dep.CompanyID || 'Unknown'} editable={false} />

                    <Text style={styles.label}>Employee</Text>
                    <TextInput style={[styles.input, { backgroundColor: '#f1f5f9', color: COLORS.textSecondary }]} value={emp?.name || emp?.FullName || 'Unknown'} editable={false} />

                    <Text style={styles.label}>Asset</Text>
                    <TextInput style={[styles.input, { backgroundColor: '#f1f5f9', color: COLORS.textSecondary }]} value={asset ? `${asset.AssetName} (S/N: ${asset.SerialNumber})` : 'Unknown'} editable={false} />

                    <Text style={styles.label}>Deployment Date</Text>
                    <TextInput style={[styles.input, { backgroundColor: '#f1f5f9', color: COLORS.textSecondary }]} value={dep.DeploymentDate || 'N/A'} editable={false} />

                    <Text style={styles.label}>Expected Return Date</Text>
                    <TextInput style={[styles.input, { backgroundColor: '#f1f5f9', color: COLORS.textSecondary }]} value={dep.ExpectedReturnDate || 'N/A'} editable={false} />

                    <Text style={styles.label}>Condition At Deployment</Text>
                    <TextInput style={[styles.input, { backgroundColor: '#f1f5f9', color: COLORS.textSecondary }]} value={dep.AssetConditionAtDeployment || 'N/A'} editable={false} />

                    <Text style={styles.label}>Remarks</Text>
                    <TextInput style={[styles.input, { backgroundColor: '#f1f5f9', color: COLORS.textSecondary }]} value={dep.Remarks || 'N/A'} editable={false} />

                    <Text style={styles.label}>Status</Text>
                    <TextInput style={[styles.input, { backgroundColor: '#f1f5f9', color: COLORS.textSecondary, fontWeight: 'bold' }]} value={dep.DeploymentStatus || 'N/A'} editable={false} />

                    {dep.DeploymentStatus === 'Returned' && (
                      <View style={{ marginTop: 16, padding: 16, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: COLORS.border }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 8 }}>Return Details</Text>

                        <Text style={[styles.label, { marginTop: 0 }]}>Actual Return Date</Text>
                        <TextInput style={[styles.input, { backgroundColor: '#fff', color: COLORS.textSecondary }]} value={dep.ActualReturnDate || 'N/A'} editable={false} />

                        <Text style={styles.label}>Return Reason</Text>
                        <TextInput style={[styles.input, { backgroundColor: '#fff', color: COLORS.textSecondary }]} value={dep.ReturnReason || 'N/A'} editable={false} />

                        <Text style={styles.label}>Condition At Return</Text>
                        <TextInput style={[styles.input, { backgroundColor: '#fff', color: COLORS.textSecondary }]} value={dep.AssetConditionAtReturn || 'N/A'} editable={false} />
                      </View>
                    )}
                  </View>
                );
              })()}
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  headerCard: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary, marginTop: 12 },
  headerSub: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  tabContainer: { flexDirection: 'row', marginBottom: 16, backgroundColor: COLORS.cardBg, borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: COLORS.primary },
  inactiveTab: { backgroundColor: '#f1f5f9' },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  activeTabText: { color: '#fff' },
  content: { flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 12 },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 20 },
  card: { backgroundColor: COLORS.cardBg, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
  cardSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeSuccess: { backgroundColor: 'rgba(34, 197, 94, 0.1)' },
  textSuccess: { color: COLORS.success, fontSize: 12, fontWeight: '600' },
  badgeWarning: { backgroundColor: 'rgba(245, 158, 11, 0.1)' },
  textWarning: { color: COLORS.warning, fontSize: 12, fontWeight: '600' },
  badgePrimary: { backgroundColor: 'rgba(59, 130, 246, 0.1)' },
  textPrimary: { color: COLORS.primary, fontSize: 12, fontWeight: '600' },
  badgeDanger: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  textDanger: { color: COLORS.danger, fontSize: 12, fontWeight: '600' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  detailText: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  addBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 16, alignSelf: 'flex-end' },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginLeft: 8 },
  assignBtn: { backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  assignBtnText: { color: COLORS.primary, fontWeight: '600' },
  returnBtn: { backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  returnBtnText: { color: COLORS.danger, fontWeight: '600' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, height: '95%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8, marginTop: 12 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, fontSize: 15, color: COLORS.textPrimary, backgroundColor: COLORS.background },
  submitBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24, marginBottom: 24 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
