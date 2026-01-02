import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA3PtcPL--aPrA6wtpWNFOesamr7H5iCRs",
  authDomain: "motime-app.firebaseapp.com",
  projectId: "motime-app",
  storageBucket: "motime-app.firebasestorage.app",
  messagingSenderId: "739027816018",
  appId: "1:739027816018:web:dcb3177139b8fd9330d98b"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// 🔹 Firestore 먼저 가져오기 전에 persistence 활성화
let dbTemp = getFirestore(app);

enableIndexedDbPersistence(dbTemp)
  .then(() => {
    console.log("Firestore offline persistence enabled ✅");
  })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Persistence failed: Multiple tabs open");
    } else if (err.code === 'unimplemented') {
      console.warn("Persistence is not available in this browser");
    } else {
      console.error("Persistence enable failed", err);
    }
  });

export const db = dbTemp; // export는 마지막에
