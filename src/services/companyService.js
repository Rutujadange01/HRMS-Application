import { db } from '../config/firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';

export const companyService = {
  // Subscribe to real-time Company Details directly from Firestore
  subscribeCompany: (onUpdate) => {
    if (!db) {
      onUpdate(null);
      return () => {};
    }

    try {
      const colRef = collection(db, 'companies');
      const unsubscribe = onSnapshot(colRef, (snapshot) => {
        if (!snapshot.empty) {
          const comp = snapshot.docs[0].data();
          onUpdate({ id: snapshot.docs[0].id, ...comp });
        } else {
          onUpdate(null);
        }
      }, (error) => {
        console.warn("Company onSnapshot listener error:", error.message);
        onUpdate(null);
      });
      return unsubscribe;
    } catch (error) {
      console.warn("Failed to subscribe to company:", error.message);
      onUpdate(null);
      return () => {};
    }
  },

  // Subscribe to real-time Departments directly from Firestore
  subscribeDepartments: (onUpdate) => {
    if (!db) {
      onUpdate([]);
      return () => {};
    }

    try {
      const colRef = collection(db, 'departments');
      const unsubscribe = onSnapshot(colRef, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        onUpdate(list);
      }, (error) => {
        console.warn("Departments onSnapshot listener error:", error.message);
        onUpdate([]);
      });
      return unsubscribe;
    } catch (error) {
      console.warn("Failed to subscribe to departments:", error.message);
      onUpdate([]);
      return () => {};
    }
  },

  // Subscribe to real-time Shifts directly from Firestore
  subscribeShifts: (onUpdate) => {
    if (!db) {
      onUpdate([]);
      return () => {};
    }

    try {
      const colRef = collection(db, 'shifts');
      const unsubscribe = onSnapshot(colRef, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        onUpdate(list);
      }, (error) => {
        console.warn("Shifts onSnapshot listener error:", error.message);
        onUpdate([]);
      });
      return unsubscribe;
    } catch (error) {
      console.warn("Failed to subscribe to shifts:", error.message);
      onUpdate([]);
      return () => {};
    }
  },

  // Subscribe to real-time Holidays directly from Firestore
  subscribeHolidays: (onUpdate) => {
    if (!db) {
      onUpdate([]);
      return () => {};
    }

    try {
      const colRef = collection(db, 'holidays');
      const unsubscribe = onSnapshot(colRef, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        onUpdate(list);
      }, (error) => {
        console.warn("Holidays onSnapshot listener error:", error.message);
        onUpdate([]);
      });
      return unsubscribe;
    } catch (error) {
      console.warn("Failed to subscribe to holidays:", error.message);
      onUpdate([]);
      return () => {};
    }
  },

  // One-time Get Company Details from Firestore
  getCompanyDetails: async () => {
    try {
      if (db) {
        const querySnapshot = await getDocs(collection(db, 'companies'));
        if (!querySnapshot.empty) {
          return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
        }
      }
    } catch (error) {
      console.warn("Company fetch error:", error.message);
    }
    return null;
  },

  // Update/Save Company Details directly to Firestore
  updateCompanyDetails: async (companyData) => {
    const compId = companyData.id || companyData.CompanyID || 'comp_01';
    const payload = {
      CompanyID: compId,
      ...companyData
    };
    console.log(`🔥 [FIREBASE WRITE] Writing Company Payload to Firestore collection 'companies', doc '${compId}':`);
    console.log("🔥 [FIREBASE PAYLOAD]:", JSON.stringify(payload, null, 2));
    
    if (!db) {
      const dbErr = "❌ [FIREBASE ERROR] Firestore 'db' object is NULL/UNDEFINED! Firebase SDK did not initialize in React Native.";
      console.error(dbErr);
      throw new Error(dbErr);
    }

    try {
      console.log(`⏳ [FIREBASE PENDING] Sending setDoc to Cloud Firestore for doc '${compId}'...`);
      const ref = doc(db, 'companies', compId);
      await setDoc(ref, payload, { merge: true });
      console.log(`✅ [FIREBASE WRITE SUCCESS] Document '${compId}' successfully written to Cloud Firestore!`);
    } catch (error) {
      console.error("❌ [FIREBASE WRITE ERROR]:", error.message);
      throw error;
    }
    return payload;
  },

  // One-time Get Departments from Firestore
  getDepartments: async () => {
    try {
      if (db) {
        const snapshot = await getDocs(collection(db, 'departments'));
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (error) {
      console.warn("Department fetch error:", error.message);
    }
    return [];
  },

  // Add Department directly to Firestore
  addDepartment: async (deptData) => {
    const deptId = deptData.DepartmentID || deptData.id || ('dept_' + Date.now());
    const payload = {
      DepartmentID: deptId,
      id: deptId,
      CompanyID: 'comp_01',
      employeeCount: 0,
      IsActive: true,
      CreatedDate: new Date().toISOString(),
      ...deptData
    };

    try {
      if (db) {
        await setDoc(doc(db, 'departments', deptId), payload);
      }
    } catch (error) {
      console.warn("Add department error:", error.message);
      throw error;
    }
    return payload;
  },

  // Delete Department directly from Firestore
  deleteDepartment: async (id) => {
    try {
      if (db && id) {
        await deleteDoc(doc(db, 'departments', id));
      }
    } catch (error) {
      console.warn("Delete department error:", error.message);
      throw error;
    }
    return id;
  },

  // Update Department directly in Firestore
  updateDepartment: async (id, deptData) => {
    try {
      if (db && id) {
        await updateDoc(doc(db, 'departments', id), deptData);
      }
    } catch (error) {
      console.warn("Update department error:", error.message);
      throw error;
    }
    return id;
  },

  // Add Shift directly to Firestore
  addShift: async (shiftData) => {
    const shiftId = shiftData.ShiftID || shiftData.id || ('sh_' + Date.now());
    const payload = {
      ShiftID: shiftId,
      id: shiftId,
      CompanyID: 'comp_01',
      IsActive: true,
      CreatedDate: new Date().toISOString(),
      ...shiftData
    };

    try {
      if (db) {
        await setDoc(doc(db, 'shifts', shiftId), payload);
      }
    } catch (error) {
      console.warn("Add shift error:", error.message);
      throw error;
    }
    return payload;
  },

  // Update Shift directly in Firestore
  updateShift: async (id, shiftData) => {
    try {
      if (db && id) {
        await updateDoc(doc(db, 'shifts', id), shiftData);
      }
    } catch (error) {
      console.warn("Update shift error:", error.message);
      throw error;
    }
    return id;
  },

  // Delete Shift directly from Firestore
  deleteShift: async (id) => {
    try {
      if (db && id) {
        await deleteDoc(doc(db, 'shifts', id));
      }
    } catch (error) {
      console.warn("Delete shift error:", error.message);
      throw error;
    }
    return id;
  },

  // Add Holiday directly to Firestore
  addHoliday: async (holidayData) => {
    const holId = holidayData.id || ('hol_' + Date.now());
    const payload = {
      id: holId,
      CompanyID: 'comp_01',
      CreatedDate: new Date().toISOString(),
      ...holidayData
    };

    try {
      if (db) {
        await setDoc(doc(db, 'holidays', holId), payload);
      }
    } catch (error) {
      console.warn("Add holiday error:", error.message);
      throw error;
    }
    return payload;
  },

  // Update Holiday directly in Firestore
  updateHoliday: async (id, holidayData) => {
    try {
      if (db && id) {
        await updateDoc(doc(db, 'holidays', id), holidayData);
      }
    } catch (error) {
      console.warn("Update holiday error:", error.message);
      throw error;
    }
    return id;
  },

  // Delete Holiday directly from Firestore
  deleteHoliday: async (id) => {
    try {
      if (db && id) {
        await deleteDoc(doc(db, 'holidays', id));
      }
    } catch (error) {
      console.warn("Delete holiday error:", error.message);
      throw error;
    }
    return id;
  }
};
