import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

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

async function run() {
  console.log("Updating Firebase Firestore comp_01 document to Technosync Innovation...");
  const ref = doc(db, 'companies', 'comp_01');
  await setDoc(ref, {
    CompanyName: 'Technosync Innovation',
    name: 'Technosync Innovation',
    Email: 'hr@technosync.com',
    email: 'hr@technosync.com'
  }, { merge: true });
  console.log("SUCCESS_FIRESTORE_UPDATED");
  process.exit(0);
}

run().catch(err => {
  console.error("ERROR_FIRESTORE_UPDATE:", err);
  process.exit(1);
});
