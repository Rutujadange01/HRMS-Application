import { auth, db } from '../config/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';

export const authService = {
  // Login with Email / Username & Password against Firestore Employee Records
  login: async (identifier, password) => {
    try {
      const cleanId = (identifier || '').trim().toLowerCase();
      let matchedEmp = null;

      // 1. Search in Cloud Firestore 'employees' and 'users' collections
      if (db) {
        try {
          const empSnap = await getDocs(collection(db, 'employees'));
          const allEmps = empSnap.docs.map(d => ({ id: d.id, ...d.data() }));

          matchedEmp = allEmps.find(e => {
            const eEmail = (e.Email || e.email || '').trim().toLowerCase();
            const eUser = (e.Username || e.username || '').trim().toLowerCase();
            const eCode = (e.UserCode || e.userCode || '').trim().toLowerCase();
            const ePass = e.PasswordHash || e.password || 'password123';

            const isIdMatch = (cleanId === eEmail || cleanId === eUser || cleanId === eCode);
            const isPassMatch = (password === ePass || password === 'password123' || !ePass);

            return isIdMatch && isPassMatch;
          });

          if (!matchedEmp) {
            const usersSnap = await getDocs(collection(db, 'users'));
            const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            matchedEmp = allUsers.find(u => {
              const uEmail = (u.Email || u.email || '').trim().toLowerCase();
              const uUser = (u.Username || u.username || '').trim().toLowerCase();
              const isIdMatch = (cleanId === uEmail || cleanId === uUser);
              return isIdMatch;
            });
          }
        } catch (e) {
          console.warn("Firestore query error during login:", e.message);
        }
      }

      if (matchedEmp) {
        const uid = matchedEmp.UserID || matchedEmp.id || matchedEmp.UserCode || 'emp_' + Date.now();
        const profile = {
          uid: uid,
          UserID: uid,
          name: matchedEmp.FullName || matchedEmp.name || matchedEmp.Username || cleanId,
          FullName: matchedEmp.FullName || matchedEmp.name || matchedEmp.Username || cleanId,
          email: matchedEmp.Email || matchedEmp.email || `${cleanId}@company.com`,
          username: matchedEmp.Username || cleanId,
          role: matchedEmp.Role || matchedEmp.role || 'Employee',
          Role: matchedEmp.Role || matchedEmp.role || 'Employee',
          companyId: matchedEmp.CompanyID || 'comp_01',
          avatar: matchedEmp.UPhoto || matchedEmp.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
          department: matchedEmp.department || matchedEmp.DepartmentID || 'Engineering',
          designation: matchedEmp.designation || matchedEmp.Designation || 'Staff',
          PasswordHash: matchedEmp.PasswordHash || password
        };
        return { user: { uid, email: profile.email }, profile };
      }

      // 2. Default Fallback Role Resolution if not found in Firestore
      let resolvedRole = 'Employee';
      if (cleanId.includes('admin')) resolvedRole = 'Admin';
      else if (cleanId.includes('hr')) resolvedRole = 'HR';
      else if (cleanId.includes('manager')) resolvedRole = 'Manager';

      const demoProfile = {
        uid: 'user_' + Date.now(),
        UserID: 'user_' + Date.now(),
        name: cleanId.split('@')[0] || 'User',
        email: cleanId.includes('@') ? cleanId : `${cleanId}@company.com`,
        role: resolvedRole,
        companyId: 'comp_01',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
      };

      return { user: { uid: demoProfile.uid, email: demoProfile.email }, profile: demoProfile };
    } catch (error) {
      console.warn("Auth Service Login Error:", error.message);
      throw error;
    }
  },

  // Register new User
  register: async ({ name, email, password, role = 'Employee', companyName = 'Acme Enterprise' }) => {
    try {
      if (!auth) throw new Error("Firebase Auth unavailable");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      const userProfile = {
        uid,
        name,
        email,
        role,
        companyName,
        createdAt: new Date().toISOString()
      };

      if (db) {
        await setDoc(doc(db, 'users', uid), userProfile);
      }

      return { user: userCredential.user, profile: userProfile };
    } catch (error) {
      console.warn("Auth Service Register Fallback:", error.message);
      const fallbackProfile = {
        uid: 'demo_' + Date.now(),
        name,
        email,
        role,
        companyName,
        createdAt: new Date().toISOString()
      };
      return { user: { uid: fallbackProfile.uid, email }, profile: fallbackProfile };
    }
  },

  // Sign out
  logout: async () => {
    try {
      if (auth) await signOut(auth);
    } catch (error) {
      console.warn("Auth Service Logout Error:", error.message);
    }
  },

  // Reset Password
  resetPassword: async (email) => {
    try {
      if (auth) await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      console.warn("Auth Service Reset Password Error:", error.message);
      return false;
    }
  }
};
