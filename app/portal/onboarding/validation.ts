export interface BasicInfoForm {
  firstName: string;
  lastName: string;
  email: string;
  phoneDigits: string;
  selectedTeam: number;
}

export interface IdentityBankingForm {
  ssn: string;
  dob: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  accountType: string;
}

export function validateBasicInfo(form: BasicInfoForm): Record<string, string> {
  const e: Record<string, string> = {};
  if (!form.firstName.trim())         e.firstName = "First name is required.";
  if (!form.lastName.trim())          e.lastName  = "Last name is required.";
  if (!form.email.trim())             e.email     = "Email is required.";
  if (form.phoneDigits.length !== 10) e.phone     = "Enter a valid 10-digit US phone number.";
  if (form.selectedTeam === 0)        e.team      = "Please select your team.";
  return e;
}

export function validateIdentityBanking(form: IdentityBankingForm): Record<string, string> {
  const e: Record<string, string> = {};
  if (form.ssn.replace(/\D/g, "").length !== 9) e.ssn = "Enter a valid 9-digit SSN.";
  if (!form.dob)                    e.dob           = "Date of birth is required.";
  if (!form.address.trim())         e.address       = "Mailing address is required.";
  if (!form.city.trim())            e.city          = "City is required.";
  if (!form.state)                  e.state         = "State is required.";
  if (!/^\d{5}$/.test(form.zip))          e.zip    = "Enter a valid 5-digit ZIP code.";
  if (!form.bankName.trim())        e.bankName      = "Bank name is required.";
  if (form.routingNumber.replace(/\D/g, "").length !== 9) e.routingNumber = "Enter a valid 9-digit routing number.";
  if (!form.accountNumber.trim())   e.accountNumber = "Account number is required.";
  if (!form.accountType)            e.accountType   = "Select an account type.";
  return e;
}

export function formatSSN(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 9);
  if (d.length <= 3) return d;
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
}

export function stripSSN(display: string): string {
  return display.replace(/\D/g, "").slice(0, 9);
}

export function formatPhoneDisplay(digits: string): string {
  const d = digits.slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export function stripDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

export function toE164(digits: string): string {
  return `+1${digits}`;
}

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
] as const;
