import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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
  const ref = doc(db, 'companies', 'comp_01');
  const snap = await getDoc(ref);
  if (snap.exists()) {
    console.log("FIRESTORE_VERIFIED_DATA:", JSON.stringify(snap.data(), null, 2));
  } else {
    console.log("NOT_FOUND");
  }
  process.exit(0);
}

run().catch(err => {
  console.error("ERROR:", err);
  process.exit(1);
});
