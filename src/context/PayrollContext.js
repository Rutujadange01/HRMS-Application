import React, { createContext, useState, useEffect } from 'react';

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

  // Advance & Loans
  const [loans, setLoans] = useState([
    {
      id: 'loan_01',
      employeeId: 'emp_002',
      employeeName: 'Alex Rivers',
      type: 'Salary Advance',
      amount: 15000,
      emi: 5000,
      paidAmount: 5000,
      balance: 10000,
      status: 'Approved',
      requestDate: '2026-07-01'
    },
    {
      id: 'loan_02',
      employeeId: 'emp_003',
      employeeName: 'Elena Vance',
      type: 'Personal Loan',
      amount: 30000,
      emi: 6000,
      paidAmount: 12000,
      balance: 18000,
      status: 'Pending',
      requestDate: '2026-07-15'
    }
  ]);

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
  const requestLoan = (loanData) => {
    const newLoan = {
      id: 'loan_' + Date.now(),
      status: 'Pending',
      paidAmount: 0,
      balance: loanData.amount,
      requestDate: new Date().toISOString().split('T')[0],
      ...loanData
    };
    setLoans(prev => [newLoan, ...prev]);
  };

  // Approve / Reject Loan
  const updateLoanStatus = (id, status) => {
    setLoans(prev => prev.map(l => l.id === id ? { ...l, status } : l));
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
