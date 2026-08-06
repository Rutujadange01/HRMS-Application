import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import { loanService } from '../services/loanService';

export const PayrollContext = createContext();

export const PayrollProvider = ({ children }) => {
  // Payroll Wizard Config
  const [payrollConfig, setPayrollConfig] = useState({
    configured: true,
    employeeCount: 15,
    salaryType: 'Monthly', // Monthly | Daily | Hourly
    workingDaysPerMonth: 26,
    shiftTimings: '09:00 AM - 06:00 PM',
    overtimeRate: 1.5, // 1.5x hourly rate
    weeklyOff: 'Sunday',
    paymentDate: 5, // 5th of every month
  });

  const { profile } = useContext(AuthContext);

  // Advance & Loans
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    const companyId = profile?.companyId;
    if (companyId) {
      const unsub = loanService.subscribeLoans(companyId, setLoans);
      return () => unsub();
    }
  }, [profile?.companyId]);

  // Expense Claims
  const [expenses, setExpenses] = useState([
    {
      id: 'exp_01',
      employeeId: 'emp_004',
      employeeName: 'Michael Chang',
      title: 'Client Dinner & Travel',
      amount: 4500,
      category: 'Travel & Food',
      status: 'Pending',
      date: '2026-07-20'
    }
  ]);

  // Update Payroll Config from Wizard
  const savePayrollConfig = (newConfig) => {
    setPayrollConfig({ ...newConfig, configured: true });
  };

  // Add Loan Request
  const requestLoan = async (loanData) => {
    try {
      await loanService.addLoan({
        ...loanData,
        balance: loanData.amount, // Set initial balance
        paidAmount: 0,
        CompanyID: profile?.companyId,
        UserID: profile?.uid || profile?.UserID,
        CreatedByUId: profile?.uid || profile?.UserID,
        CreatedByUName: profile?.name || profile?.FullName || 'Employee',
      });
    } catch (err) {
      console.error("Error requesting loan:", err);
    }
  };

  // Approve / Reject Loan
  const updateLoanStatus = async (id, statusOrUpdates) => {
    try {
      const updates = typeof statusOrUpdates === 'string' ? { status: statusOrUpdates, Status: statusOrUpdates } : statusOrUpdates;
      await loanService.updateLoan(id, updates);
    } catch (err) {
      console.error("Error updating loan status:", err);
    }
  };

  // Add Expense Claim
  const applyExpense = (expenseData) => {
    const newExp = {
      id: 'exp_' + Date.now(),
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
      ...expenseData
    };
    setExpenses(prev => [newExp, ...prev]);
  };

  return (
    <PayrollContext.Provider
      value={{
        payrollConfig,
        loans,
        expenses,
        savePayrollConfig,
        requestLoan,
        updateLoanStatus,
        applyExpense
      }}
    >
      {children}
    </PayrollContext.Provider>
  );
};
