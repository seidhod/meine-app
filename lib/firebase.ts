"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBhPhGwWdr7UbdbzSfhc7cmBbfmIG1JfnM",
  authDomain: "maschinelles-lernen-10f99.firebaseapp.com",
  databaseURL:
    "https://maschinelles-lernen-10f99-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "maschinelles-lernen-10f99",
  storageBucket: "maschinelles-lernen-10f99.firebasestorage.app",
  messagingSenderId: "242385485616",
  appId: "1:242385485616:web:782d99a6690302f47a92f5",
};

// Vorhandene Firebase-App verwenden oder einmalig initialisieren.
export const firebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Anmeldedienst für unsere spätere Anmeldeseite bereitstellen.
export const auth = getAuth(firebaseApp);