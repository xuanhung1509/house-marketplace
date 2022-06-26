import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyAvmOj18AkD5Kzifk1d__GWWs03uwtSVpY',
  authDomain: 'house-marketplace-app-1509.firebaseapp.com',
  projectId: 'house-marketplace-app-1509',
  storageBucket: 'house-marketplace-app-1509.appspot.com',
  messagingSenderId: '4288204809',
  appId: '1:4288204809:web:9569de5e216b7c8f3328d8',
};

// Initialize Firebase
initializeApp(firebaseConfig);

export const db = getFirestore();
