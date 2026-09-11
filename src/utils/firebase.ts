import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBc9nJKtdIkDLvEu_8-rfD0tITdPe4uP84",
  authDomain: "rdo-huzurnagar-files.firebaseapp.com",
  projectId: "rdo-huzurnagar-files",
  storageBucket: "rdo-huzurnagar-files.firebasestorage.app",
  messagingSenderId: "867615199377",
  appId: "1:867615199377:web:1f0e291a1c1ebb5efd6f30"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);