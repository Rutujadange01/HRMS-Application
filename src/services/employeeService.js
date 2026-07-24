import { db } from '../config/firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';

export const employeeService = {
  // Subscribe to real-time Employees stream directly from Firestore
  subscribeEmployees: (onUpdate) => {
    if (!db) {
      onUpdate([]);
      return () => {};
    }

    try {
      const colRef = collection(db, 'employees');
      const unsubscribe = onSnapshot(colRef, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        onUpdate(list);
      }, (error) => {
        console.warn("Employees onSnapshot listener error:", error.message);
        onUpdate([]);
      });
      return unsubscribe;
    } catch (error) {
      console.warn("Failed to subscribe to employees:", error.message);
      onUpdate([]);
      return () => {};
    }
  },

  // One-time Fetch Employees directly from Firestore
  getEmployees: async () => {
    try {
      if (db) {
        const snapshot = await getDocs(collection(db, 'employees'));
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (error) {
      console.warn("Employees fetch error:", error.message);
    }
    return [];
  },

  // Create Employee directly in Firestore
  addEmployee: async (employeeData) => {
    const empId = employeeData.UserID || employeeData.id || ('emp_' + Date.now());
    const payload = {
      CompanyID: 'comp_01',
      UserID: empId,
      id: empId,
      Status: 'Active',
      status: 'Active',
      IsActive: true,
      joiningDate: new Date().toISOString().split('T')[0],
      CreatedOn: new Date().toISOString(),
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
      ...employeeData
    };

    try {
      if (db) {
        await setDoc(doc(db, 'employees', empId), payload);
      }
    } catch (error) {
      console.warn("Add employee error:", error.message);
      throw error;
    }
    return payload;
  },

  // Update Employee directly in Firestore
  updateEmployee: async (id, updatedFields) => {
    try {
      if (db && id) {
        const ref = doc(db, 'employees', id);
        await updateDoc(ref, updatedFields);
      }
    } catch (error) {
      console.warn("Update employee error:", error.message);
      throw error;
    }
    return { id, ...updatedFields };
  },

  // Delete Employee directly from Firestore
  deleteEmployee: async (id) => {
    try {
      if (db && id) {
        await deleteDoc(doc(db, 'employees', id));
      }
    } catch (error) {
      console.warn("Delete employee error:", error.message);
      throw error;
    }
    return id;
  }
};
