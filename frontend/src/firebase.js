import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {

  apiKey: "AIzaSyCndI0zSoDArX03JH9fpYs4L634mPgyYHw",

  authDomain: "trip-planner-c26a1.firebaseapp.com",

  projectId: "trip-planner-c26a1",

  storageBucket: "trip-planner-c26a1.firebasestorage.app",

  messagingSenderId: "115221443142",

  appId: "1:115221443142:web:3ccfc7081904b27062d047",

  measurementId: "G-CMEMN0XZ4F"

};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;

