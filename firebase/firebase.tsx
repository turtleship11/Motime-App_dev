import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

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
