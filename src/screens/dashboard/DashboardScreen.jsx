import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { EmployeeDashboardScreen } from './EmployeeDashboardScreen';
import { AdminDashboardScreen } from './AdminDashboardScreen';

export const DashboardScreen = ({ navigation }) => {
  const { profile } = useContext(AuthContext);

  const userRole = profile?.role || profile?.Role || 'Employee';
  const isEmployee = userRole === 'Employee';

  if (isEmployee) {
    return <EmployeeDashboardScreen navigation={navigation} />;
  }

  return <AdminDashboardScreen navigation={navigation} />;
};
