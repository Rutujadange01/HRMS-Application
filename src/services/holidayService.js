import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export const holidayService = {
  // Real‑time listener for a company's holidays
  subscribeHolidays: (companyId, onUpdate) => {
    if (!companyId) return () => {};
    const colRef = collection(db, 'holidays'); // <-- will use the confirmed collection name
    const q = query(colRef, where('CompanyID', '==', companyId));
    const unsub = onSnapshot(
      q,
      snap => {
        const list = snap.docs.map(d => {
          const { HolidayID, HolidayName, CompanyID, HolidayDate, Description, IsActive, CreatedByUId, CreatedDate, UpdatedByUId, UpdatedDate } = d.data();
          return { id: d.id, HolidayID, HolidayName, CompanyID, HolidayDate, Description, IsActive, CreatedByUId, CreatedDate, UpdatedByUId, UpdatedDate };
        });
        onUpdate(list);
      },
      err => {
        console.warn('Holiday listener error:', err);
        onUpdate([]);
      },
    );
    return unsub;
  },

  // Add a new holiday
  addHoliday: async data => {
    const holidayId = data.HolidayID || uuidv4();
    const docRef = doc(db, 'holidays', holidayId);
    await setDoc(docRef, {
      ...data,
      HolidayID: holidayId,
      CreatedDate: new Date().toISOString(),
      UpdatedDate: new Date().toISOString(),
    });
  },

  // Update an existing holiday
  updateHoliday: async (holidayId, updates) => {
    const docRef = doc(db, 'holidays', holidayId);
    await updateDoc(docRef, {
      ...updates,
      UpdatedDate: new Date().toISOString(),
    });
  },

  // Delete a holiday
  deleteHoliday: async holidayId => {
    const docRef = doc(db, 'holidays', holidayId);
    await deleteDoc(docRef);
  },
};
