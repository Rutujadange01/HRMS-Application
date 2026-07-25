import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { EmployeeDashboardScreen } from './EmployeeDashboardScreen';
import { AdminDashboardScreen } from './AdminDashboardScreen';

export const DashboardScreen = ({ navigation }) => {
  const { profile } = useContext(AuthContext);

  const rawRole = (profile?.role || profile?.Role || 'Employee').toString().trim().toLowerCase();
  const isAdminOrHR = rawRole === 'admin' || rawRole === 'hr' || rawRole === 'manager';

  if (!isAdminOrHR) {
    return <EmployeeDashboardScreen navigation={navigation} />;
  }

  return <AdminDashboardScreen navigation={navigation} />;
};
