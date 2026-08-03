import { db } from '../config/firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';

export const expenseService = {
  // Subscribe to real-time Expense Claims directly from Firestore
  subscribeExpenses: (onUpdate) => {
    if (!db) {
      onUpdate([]);
      return () => {};
    }

    try {
      const colRef = collection(db, 'expenses');
      const unsubscribe = onSnapshot(colRef, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        onUpdate(list);
      }, (error) => {
        console.warn("Expenses onSnapshot listener error:", error.message);
        onUpdate([]);
      });
      return unsubscribe;
    } catch (error) {
      console.warn("Failed to subscribe to expenses:", error.message);
      onUpdate([]);
      return () => {};
    }
  },

  // One-time Get Expenses from Firestore
  getExpenses: async () => {
    try {
      if (db) {
        const snapshot = await getDocs(collection(db, 'expenses'));
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (error) {
      console.warn("Expense fetch error:", error.message);
    }
    return [];
  },

  // Add Expense Claim directly to Firestore
  addExpense: async (expenseData) => {
    const expenseId = expenseData.ID || expenseData.id || ('exp_' + Date.now());
    const payload = {
      ID: expenseId,
      UserID: expenseData.UserID || 'emp_001',
      Expense_Desc: expenseData.Expense_Desc || '',
      Claim_Date: expenseData.Claim_Date || new Date().toISOString().split('T')[0],
      Expense_Date: expenseData.Expense_Date || new Date().toISOString().split('T')[0],
      Description: expenseData.Description || '',
      Category: expenseData.Category || 'Other',
      Total_Amount: parseFloat(expenseData.Total_Amount) || 0,
      Status: 'Pending',
      Approved_By: '',
      Approved_Date: '',
      Rejection_Reason: '',
      CreatedByUId: expenseData.CreatedByUId || 'emp_001',
      CreatedDate: new Date().toISOString(),
      UpdatedByUId: '',
      UpdatedDate: '',
      CompanyID: expenseData.CompanyID || 'comp_01'
    };

    try {
      if (db) {
        await setDoc(doc(db, 'expenses', expenseId), payload);
      }
    } catch (error) {
      console.warn("Add expense error:", error.message);
      throw error;
    }
    return payload;
  },

  // Update Expense Claim directly in Firestore
  updateExpense: async (id, updatedFields) => {
    try {
      if (db && id) {
        // Automatically inject UpdatedDate if modifying
        const dataToUpdate = {
          ...updatedFields,
          UpdatedDate: new Date().toISOString()
        };
        await updateDoc(doc(db, 'expenses', id), dataToUpdate);
      }
    } catch (error) {
      console.warn("Update expense error:", error.message);
      throw error;
    }
    return id;
  },

  // Delete Expense Claim directly from Firestore
  deleteExpense: async (id) => {
    try {
      if (db && id) {
        await deleteDoc(doc(db, 'expenses', id));
      }
    } catch (error) {
      console.warn("Delete expense error:", error.message);
      throw error;
    }
    return id;
  }
};
