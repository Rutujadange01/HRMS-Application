import { db } from '../config/firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { 
  INITIAL_COMPANY, 
  INITIAL_DEPARTMENTS, 
  INITIAL_EMPLOYEES, 
  INITIAL_ATTENDANCE, 
  INITIAL_LEAVES 
} from '../utils/seedData';

export const seedService = {
  seedIfEmpty: async () => {
    if (!db) {
      console.warn("Firestore db instance unavailable for seeding");
      return;
    }

    try {
      // Check if companies collection exists
      const compSnapshot = await getDocs(collection(db, 'companies'));
      if (compSnapshot.empty) {
        console.log("Seeding Cloud Firestore with initial HRMS data...");

        // 1. Seed Company
        await setDoc(doc(db, 'companies', 'comp_01'), INITIAL_COMPANY);

        // 2. Seed Departments
        for (const dept of INITIAL_DEPARTMENTS) {
          const id = dept.DepartmentID || dept.id;
          await setDoc(doc(db, 'departments', id), dept);
        }

        // 3. Seed Employees
        for (const emp of INITIAL_EMPLOYEES) {
          const id = emp.UserID || emp.id;
          await setDoc(doc(db, 'employees', id), emp);
        }

        // 4. Seed Leaves
        for (const leave of INITIAL_LEAVES) {
          await setDoc(doc(db, 'leaves', leave.id), leave);
        }

        console.log("Firestore database seeding completed successfully!");
      } else {
        console.log("Firestore database already populated. Checking for company details update...");
        // Auto-update if comp_01 has the old default dummy name
        const compRef = doc(db, 'companies', 'comp_01');
        await setDoc(compRef, {
          CompanyName: 'Technosync Innovation',
          name: 'Technosync Innovation',
          Email: 'hr@technosync.com',
          email: 'hr@technosync.com'
        }, { merge: true });
        console.log("Updated company name in Firestore to Technosync Innovation");
      }
    } catch (error) {
      console.warn("Auto-seeding skipped or permission limited:", error.message);
    }
  }
};
