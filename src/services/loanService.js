import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export const loanService = {
  // Real-time listener for a company's loans & advances
  subscribeLoans: (companyId, onUpdate) => {
    if (!companyId) return () => {};
    const colRef = collection(db, 'Loan_AdvancesRequest');
    const q = query(colRef, where('CompanyID', '==', companyId));
    
    const unsub = onSnapshot(
      q,
      snap => {
        const list = snap.docs.map(d => {
          return { id: d.id, ...d.data() };
        });
        // Sort by CreatedDate descending
        list.sort((a, b) => new Date(b.CreatedDate || 0) - new Date(a.CreatedDate || 0));
        onUpdate(list);
      },
      err => {
        console.warn('Loan listener error:', err);
        onUpdate([]);
      },
    );
    return unsub;
  },

  // Add a new loan request
  addLoan: async (loanData) => {
    const loanId = loanData.LoanId || uuidv4();
    const docRef = doc(db, 'Loan_AdvancesRequest', loanId);
    
    await setDoc(docRef, {
      ...loanData,
      LoanId: loanId,
      Status: 'Pending',
      CreatedDate: new Date().toISOString(),
    });
  },

  // Update an existing loan (e.g. for approval)
  updateLoan: async (loanId, updates) => {
    const docRef = doc(db, 'Loan_AdvancesRequest', loanId);
    await updateDoc(docRef, {
      ...updates,
      UpdatedDate: new Date().toISOString(),
    });
  },

  // Delete a loan request
  deleteLoan: async (loanId) => {
    const docRef = doc(db, 'Loan_AdvancesRequest', loanId);
    await deleteDoc(docRef);
  },
};
