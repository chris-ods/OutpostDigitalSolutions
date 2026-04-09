import { Timestamp } from "firebase/firestore";

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;              // E.164 format: +1XXXXXXXXXX
  comments: string;
  role: "developer" | "owner" | "admin" | "manager" | "rep";
  subRole: string;            // "TL" | "COO" | "" — TL = licensed CSR ($680 base); COO = company ALP tier pay
  hideFromPayroll: boolean;   // true = excluded from payroll page (owners/principals)
  teamNumber: number;         // which team the user belongs to (1-based)
  contractorId: string;
  active: boolean;            // false = deactivated (hidden from portal dropdowns)
  photoURL: string;           // Firebase Storage URL; empty until storage is connected
  createdAt: Timestamp;
  mustChangePassword: boolean; // deprecated — kept for backward compatibility
  level: number;              // 1–9 career progression level (manual override by admin)
  companyRole: string;        // Company title/position (e.g., "Managing Partner", "VP of Sales")
  npnPersonal: string;        // Denormalized from secrets/identity — used for licensed/unlicensed grouping
  acceptedTermsVersion: number; // version of T&C the user last accepted (0 = never)
  acceptedTermsAt: Timestamp | null; // when they accepted
  onboardingPacketSigned: boolean;   // true = signed all onboarding agreements
  onboardingSignedAt: Timestamp | null; // when they signed
  birthday: string;                  // MM-DD format, derived from encrypted dob in secrets/identity
}

export type UserWithId = UserProfile & { uid: string };

export function isAdminLevel(role: string | undefined): boolean {
  return role === "developer" || role === "owner" || role === "admin";
}

export const CAREER_LEVELS = [
  { level: 1,  tag: "CSR",     title: "Account Representative" },
  { level: 2,  tag: "JUNIOR",  title: "Junior Closer" },
  { level: 3,  tag: "SENIOR",  title: "Senior Closer" },
  { level: 4,  tag: "ELITE",   title: "Elite Closer" },
  { level: 5,  tag: "MASTER",  title: "Master Closer" },
  { level: 6,  tag: "LEAD",    title: "Team Lead" },
  { level: 7,  tag: "CAPTAIN", title: "Team Captain" },
  { level: 8,  tag: "SQUAD",   title: "Squad Leader" },
  { level: 9,  tag: "COMPANY", title: "Commander" },
  { level: 10, tag: "DEV",     title: "Developer" },
] as const;

export type CareerLevel = typeof CAREER_LEVELS[number];

// Deterministic avatar background color from a person's full name
const AVATAR_PALETTE = [
  "#ef4444","#f97316","#eab308","#22c55e","#14b8a6",
  "#3b82f6","#8b5cf6","#ec4899","#06b6d4","#f59e0b",
  "#10b981","#6366f1","#a855f7","#f43f5e","#84cc16",
];
export function avatarColor(name: string): string {
  let h = 0;
  for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h);
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

export interface PayrollEntry {
  hours:          number;
  payrollChecked: boolean;
  baseManual?:    number;
  halfCredit?:    boolean;
  adjustment?:    number;        // +/- dollar amount manual adjustment
  adjustmentNotes?: string;      // reason for adjustment
}

export interface ImportedPayrollRow {
  name:          string;
  contractorId:  string;
  section:       string;
  teamNumber:    number;
  base:          number;
  appBonus:      number;
  appCount:      number;
  hours:         number;
  volumeBonus:   number;
  producerBonus: number;
  total:         number;
  paid:          boolean;
  twoWeekPay:    number;
  notes:         string;
}

export interface Client {
  id?: string;
  agentId: string;
  agentName: string;
  agentEmail?: string;   // rep's email — written when rep claims the record
  agentPhone?: string;   // rep's phone — written when rep claims the record
  csv_updated?: string[]; // UIDs of every user who has ever claimed this imported record
  contractorId: string;
  agentTeamNumber: number;
  date: string;
  clientName: string;
  phone: string;            // E.164 (+1XXXXXXXXXX) or free-form if phoneSpecialCase
  phoneSpecialCase?: boolean; // true = non-standard number (intl, extension, etc.)
  email: string;
  startDate: string;
  state: string;
  carrier: "Americo" | "AMAM" | "Aetna" | "CICA" | "Chubb" | "Corebridge" | "Ethos" | "MOO" | "Trans" | "Instabrain" | "Other";
  appNumber: string;
  annualPremium: number;
  portal: string; // uid of the portal/split manager
  portalName: string; // display name: "First Last"
  agentStatus: "Approved" | "Declined" | "Sent UW" | "Pending" | "Cancelled";
  adminStatus:
    | "Client Paid|Comp Paid"
    | "Client Paid|Waiting on Comp"
    | "Comp Paid|Client Not Paid"
    | "Pending Client Payment"
    | "UW or Requirements"
    | "Decline - Rewrite"
    | "Lapsed"
    | "CXL";
  splitPercent: number; // 0 = no split; >0 = split with portal member at this %
  payroll?: boolean;    // true = commission paid through payroll cycle
  clientPaidDate: string;
  compDate: string;
  notes: string;
  firedCSR?: string;    // CSR status at time of sale (e.g. "Fired")
  weekStart: string;
  historical?: boolean; // true = pre-2026 or manually archived; hidden from default view
  // Metadata
  createdAt: Timestamp;
  createdBy?: string;
  createdByName?: string;
  updatedAt?: Timestamp;
  updatedBy?: string;
  updatedByName?: string;
}
