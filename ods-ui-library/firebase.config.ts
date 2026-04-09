/**
 * firebase.config.ts
 *
 * Single place to configure Firebase for this library.
 * Copy this file into each client portal and fill in the project credentials.
 *
 * The hooks (useClientList) import from here, so updating this one file
 * is all that is needed to switch portals.
 *
 * To get your config:
 *   Firebase Console → Project Settings → Your apps → SDK setup and configuration
 */

// When consumed by a Next.js app that sets NEXT_PUBLIC_FIREBASE_* env vars,
// those values are picked up here. The getDB() guard in useClientList.ts
// reuses the already-initialized Firebase app so there's no double-init.
export const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            ?? "",
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        ?? "",
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         ?? "",
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID              ?? "",
};

/**
 * Permissions are stored in Firestore at:
 *   /permissions/{collectionId}
 */
export const PERMISSIONS_COLLECTION = "permissions";
