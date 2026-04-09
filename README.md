# ATX Financial

Internal platform for ATX Financial Group — tracks insurance sales, agent performance, commissions, and team operations.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Backend**: Firebase (Auth, Firestore, Storage, App Hosting)
- **Styling**: Tailwind CSS 4
- **UI Library**: ODS UI Library (co-located at `ods-ui-library/`)

## Getting Started

1. Copy `.env.local.example` to `.env.local` and fill in your Firebase config values:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

2. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  portal/
    clients/       # Client records list (OdsList), new client form, import
    agents/        # Agent roster (OdsList), onboarding, sub-collections
    dashboard/     # Role-specific dashboards (rep, manager, admin)
    documents/     # Document library (OdsList) with file upload
    settings/      # App config, team management, bulk operations
    payroll/       # Commission tracking and payroll runs
lib/
  firebase.ts      # Firebase app initialization
  types.ts         # Shared TypeScript interfaces (Client, UserProfile, etc.)
  hooks/           # useUserClaim, useTeamConfig, useAuthGuard, useListUserPrefs
  components/      # Shared components (Spinner, etc.)
  formatters.ts    # Currency and date formatters
ods-ui-library/    # Co-located UI component library
  ClientList.tsx   # OdsList — generic sortable/filterable/editable data table
  OdsCard.tsx      # OdsCard + OdsStatCard — themed card components
  SimpleDataTable/ # Lightweight read-only data table
  hooks/           # useClientList, useReceiptList (Firestore-backed)
scripts/
  seedClients.mjs  # Bulk CSV import for client records
```

## Firebase Data-Fetching Architecture

The app uses two Firestore query patterns, chosen strategically per use case:

### Real-time listeners (`onSnapshot`)

Used for data users actively watch — client lists, documents, dashboard stats. Firestore pushes changes to the client automatically. The listener fires once on attach (initial load), then again whenever any matching document changes on the server. Results go into `useState`, so React re-renders automatically. The listener stays open until the component unmounts, cleaned up in the `useEffect` return.

```tsx
// Example: documents page
useEffect(() => {
  const q = query(collection(db, "documents"), orderBy("uploadedAt", "desc"));
  return onSnapshot(q, (snap) => {
    setDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}, []);
```

### One-time fetches (`getDocs`)

Used for data that rarely changes — user profiles, schemas, permissions, team config. Fetches once on mount, stores in state, done. No open connection.

```tsx
// Example: agents page
const [schemaSnap, permsSnap] = await Promise.all([
  getDoc(doc(db, "settings", "agentListSchema")),
  getDoc(doc(db, "settings", "agentListPermissions")),
]);
```

### Role-scoped queries

Every data-fetching page checks the user's role and adjusts queries accordingly. This is both a security boundary (enforced by Firestore rules) and a cost optimization:

- **Rep**: `where("agentId", "==", uid)` — own records only
- **Manager**: `where("agentTeamNumber", "==", teamNumber)` — team records
- **Admin**: no filter — all records

### No external caching layer

There is no SWR, React Query, or custom caching layer. The real-time listeners *are* the cache — Firestore's SDK handles local caching under the hood and only sends deltas over the wire after the initial snapshot. Once a listener is attached, subsequent updates are lightweight.

### Optimistic local state updates

When a user edits a cell, the page calls `updateDoc()` *and* immediately updates local state, so the UI feels instant without waiting for the server roundtrip:

```tsx
await updateDoc(doc(db, "users", id), { [field]: value });
setAgents((prev) => prev.map((a) => a.uid === id ? { ...a, [field]: value } : a));
```

## Deployment

Deployed via Firebase App Hosting to `atx-financial--atx-financial.us-central1.hosted.app`. Pushes to `main` trigger automatic deploys.
