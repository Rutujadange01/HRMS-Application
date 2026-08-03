const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCDrlpwsgZw783NXvfwLUFFKgXwhjuSPWw",
  authDomain: "hrmsapp-ba93d.firebaseapp.com",
  projectId: "hrmsapp-ba93d",
  storageBucket: "hrmsapp-ba93d.firebasestorage.app",
  messagingSenderId: "388754253779",
  appId: "1:388754253779:web:54a80b491a530b050b3126"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 1. CompanyMaster Table
const COMPANY_DATA = {
  CompanyID: 'comp_01',
  CompanyCode: 'CMP100',
  CompanyName: 'Acme Enterprise Solutions',
  Address1: '200 Tech Park Way, Suite 400, CA',
  PhoneNo: '+1 (555) 019-2831',
  Email: 'hr@acmeenterprise.com',
  OfficeStartTime: '09:00 AM',
  OfficeEndTime: '06:00 PM',
  GraceMinutes: '15',
  FullDayHours: '8',
  SalaryCycleDay: '25',
  GeoFenceRequired: true,
  PhotoRequired: true,
  WeekOffDay: 'Sunday',
  IsActive: true,
  CreatedOn: new Date().toISOString(),
  Location: 'Tech Park HQ Tower 1',
  Latitude: '37.7749',
  Longitude: '-122.4194',
  GeoFenceRadius: '100',
  CreatedByUId: 'demo_admin_123'
};

// 2. Master_DepartmentMaster Table
const DEPTS = [
  {
    DepartmentID: 'dept_01',
    id: 'dept_01',
    DepartmentName: 'Engineering & Tech',
    name: 'Engineering & Tech',
    CompanyID: 'comp_01',
    ShortName: 'ENG',
    code: 'ENG',
    Description: 'Software Development & Systems Architecture',
    IsActive: true,
    CreatedByUId: 'demo_admin_123',
    CreatedByUName: 'Sarah Jenkins',
    CreatedDate: new Date().toISOString(),
    head: 'Alex Rivers',
    employeeCount: 14
  },
  {
    DepartmentID: 'dept_02',
    id: 'dept_02',
    DepartmentName: 'Human Resources',
    name: 'Human Resources',
    CompanyID: 'comp_01',
    ShortName: 'HR',
    code: 'HR',
    Description: 'People Operations & Talent Acquisition',
    IsActive: true,
    CreatedByUId: 'demo_admin_123',
    CreatedByUName: 'Sarah Jenkins',
    CreatedDate: new Date().toISOString(),
    head: 'Sarah Jenkins',
    employeeCount: 5
  },
  {
    DepartmentID: 'dept_03',
    id: 'dept_03',
    DepartmentName: 'Sales & Business Development',
    name: 'Sales & Business Development',
    CompanyID: 'comp_01',
    ShortName: 'SALES',
    code: 'SALES',
    Description: 'Enterprise Client Accounts & Growth',
    IsActive: true,
    CreatedByUId: 'demo_admin_123',
    CreatedByUName: 'Sarah Jenkins',
    CreatedDate: new Date().toISOString(),
    head: 'Michael Chang',
    employeeCount: 10
  }
];

// 3. Users Table (Employees)
const USERS = [
  {
    CompanyID: 'comp_01',
    UserID: 'emp_001',
    id: 'emp_001',
    UserCode: 'USR101',
    Username: 'sarah.j',
    PasswordHash: 'scrypt:salted_pass_123',
    Role: 'Admin',
    role: 'Admin',
    FullName: 'Sarah Jenkins',
    name: 'Sarah Jenkins',
    Email: 'sarah.j@acmeenterprise.com',
    email: 'sarah.j@acmeenterprise.com',
    DOJ: '2021-03-15',
    joiningDate: '2021-03-15',
    DOB: '1992-06-18',
    DepartmentID: 'dept_02',
    department: 'Human Resources',
    MobileNo: '+1 (555) 234-5678',
    phone: '+1 (555) 234-5678',
    AdharNo: '9874-5612-3012',
    PanNo: 'ABCDE1234F',
    UANNo: '100987654321',
    Designation: 'VP of People Operations',
    designation: 'VP of People Operations',
    InTime: '09:00 AM',
    OutTime: '06:00 PM',
    IsActive: true,
    CreatedOn: new Date().toISOString(),
    CreatedUserID: 'demo_admin_123',
    UPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    Status: 'Active',
    status: 'Active',
    Gender: 'Female',
    Location: 'Tech Park HQ Tower 1',
    EmploymentType: 'Full-Time',
    ShiftID: 'sh_01',
    MonthlyPayAmt: 10000,
    salaryTier: '$120,000 / yr',
    WorkHrs: 8,
    IsPerDay: false
  },
  {
    CompanyID: 'comp_01',
    UserID: 'emp_002',
    id: 'emp_002',
    UserCode: 'USR102',
    Username: 'alex.r',
    PasswordHash: 'scrypt:salted_pass_123',
    Role: 'Manager',
    role: 'Manager',
    FullName: 'Alex Rivers',
    name: 'Alex Rivers',
    Email: 'alex.r@acmeenterprise.com',
    email: 'alex.r@acmeenterprise.com',
    DOJ: '2022-01-10',
    joiningDate: '2022-01-10',
    DOB: '1988-11-22',
    DepartmentID: 'dept_01',
    department: 'Engineering & Tech',
    MobileNo: '+1 (555) 345-6789',
    phone: '+1 (555) 345-6789',
    AdharNo: '8765-4321-9012',
    PanNo: 'FGHIJ5678K',
    UANNo: '100987654322',
    Designation: 'Lead Software Architect',
    designation: 'Lead Software Architect',
    InTime: '09:00 AM',
    OutTime: '06:00 PM',
    IsActive: true,
    CreatedOn: new Date().toISOString(),
    CreatedUserID: 'demo_admin_123',
    UPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    Status: 'Active',
    status: 'Active',
    Gender: 'Male',
    Location: 'Tech Park HQ Tower 1',
    EmploymentType: 'Full-Time',
    ShiftID: 'sh_01',
    MonthlyPayAmt: 12000,
    salaryTier: '$140,000 / yr',
    WorkHrs: 8,
    IsPerDay: false
  }
];

async function seed() {
  console.log("🚀 Starting direct SSMS schema seeding to Firebase Project: hrmsapp-ba93d...");
  try {
    await setDoc(doc(db, 'companies', 'comp_01'), COMPANY_DATA);
    console.log("✅ Collection 'companies' (CompanyMaster) seeded");

    for (const d of DEPTS) {
      await setDoc(doc(db, 'departments', d.DepartmentID), d);
      console.log(`✅ Collection 'departments' seeded doc: ${d.DepartmentID} [${d.DepartmentName}]`);
    }

    for (const u of USERS) {
      await setDoc(doc(db, 'employees', u.UserID), u);
      console.log(`✅ Collection 'employees' seeded doc: ${u.UserID} [${u.FullName}]`);
    }

    console.log("\n🎉 ALL DEPARTMENTS AND EMPLOYEES SEEDED DIRECTLY TO FIREBASE!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Firebase SSMS Seeding Failed:", error.message);
    process.exit(1);
  }
}

seed();
