import { initializeApp, getApps, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  // On Firebase App Hosting (Cloud Run), ADC is automatically available.
  // Locally, set GOOGLE_APPLICATION_CREDENTIALS env var.
  return initializeApp();
}

export const adminAuth = getAuth(getAdminApp());
