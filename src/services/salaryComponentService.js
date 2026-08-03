import { db } from '../config/firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';

export const salaryComponentService = {
  // Subscribe to real-time Salary Components (Categories) directly from Firestore
  subscribeSalaryComponents: (onUpdate) => {
    if (!db) {
      onUpdate([]);
      return () => {};
    }

    try {
      const colRef = collection(db, 'salaryComponents');
      const unsubscribe = onSnapshot(colRef, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        onUpdate(list);
      }, (error) => {
        console.warn("SalaryComponents onSnapshot listener error:", error.message);
        onUpdate([]);
      });
      return unsubscribe;
    } catch (error) {
      console.warn("Failed to subscribe to salary components:", error.message);
      onUpdate([]);
      return () => {};
    }
  },

  addSalaryComponent: async (componentData) => {
    if (!db) return;
    const docId = componentData.SalaryComponentId || `sc_${Date.now()}`;
    const docRef = doc(db, 'salaryComponents', docId);
    await setDoc(docRef, { ...componentData, id: docId });
  },

  updateSalaryComponent: async (componentId, updateData) => {
    if (!db) return;
    const docRef = doc(db, 'salaryComponents', componentId);
    await updateDoc(docRef, updateData);
  },

  deleteSalaryComponent: async (componentId) => {
    if (!db) return;
    const docRef = doc(db, 'salaryComponents', componentId);
    await deleteDoc(docRef);
  },
};
