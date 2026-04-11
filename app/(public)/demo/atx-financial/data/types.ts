export interface AtxAgent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: "agent" | "senior_agent" | "manager";
  teamNumber: number;
  photoInitials: string;
  hireDate: string;
  isActive: boolean;
}

export interface AtxContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  dateOfBirth: string;
  assignedAgentId: string;
  source: "referral" | "web" | "cold_call" | "walk_in" | "social_media";
  tags: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface AtxDeal {
  id: string;
  contactId: string;
  contactName: string;
  agentId: string;
  agentName: string;
  policyType: "life" | "health" | "auto" | "home" | "umbrella" | "annuity";
  carrier: string;
  stage: DealStage;
  annualPremium: number;
  commission: number;
  splitPercent: number;
  applicationNumber: string;
  expectedCloseDate: string;
  createdAt: string;
  updatedAt: string;
  notes: string;
}

export type DealStage = "lead" | "quoted" | "applied" | "underwriting" | "issued" | "paid";

export const DEAL_STAGES: DealStage[] = ["lead", "quoted", "applied", "underwriting", "issued", "paid"];

export const STAGE_LABELS: Record<DealStage, string> = {
  lead: "Lead",
  quoted: "Quoted",
  applied: "Applied",
  underwriting: "Underwriting",
  issued: "Issued",
  paid: "Paid",
};

export const STAGE_COLORS: Record<DealStage, string> = {
  lead: "bg-gray-500/20 text-gray-300 border-gray-600",
  quoted: "bg-blue-500/20 text-blue-300 border-blue-600",
  applied: "bg-indigo-500/20 text-indigo-300 border-indigo-600",
  underwriting: "bg-amber-500/20 text-amber-300 border-amber-600",
  issued: "bg-green-500/20 text-green-300 border-green-600",
  paid: "bg-emerald-500/20 text-emerald-300 border-emerald-600",
};

export interface AtxTask {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string;
  assigneeId: string;
  assigneeName: string;
  relatedContactId?: string;
  relatedDealId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface AtxActivity {
  id: string;
  type: "deal_created" | "deal_stage_changed" | "contact_added" | "task_completed" | "note_added" | "policy_issued";
  description: string;
  agentName: string;
  timestamp: string;
  relatedEntityId?: string;
}

export const PRIORITY_COLORS: Record<AtxTask["priority"], string> = {
  low: "bg-gray-500/20 text-gray-400 border-gray-600",
  medium: "bg-blue-500/20 text-blue-400 border-blue-600",
  high: "bg-amber-500/20 text-amber-400 border-amber-600",
  urgent: "bg-red-500/20 text-red-400 border-red-600",
};

export const POLICY_TYPE_LABELS: Record<AtxDeal["policyType"], string> = {
  life: "Life",
  health: "Health",
  auto: "Auto",
  home: "Home",
  umbrella: "Umbrella",
  annuity: "Annuity",
};

// ── Reducer ────────────────────────────────────────────────────────────────────

export type AtxState = {
  contacts: AtxContact[];
  deals: AtxDeal[];
  tasks: AtxTask[];
  agents: AtxAgent[];
  activities: AtxActivity[];
};

export type AtxAction =
  | { type: "ADD_CONTACT"; contact: AtxContact }
  | { type: "UPDATE_CONTACT"; id: string; updates: Partial<AtxContact> }
  | { type: "DELETE_CONTACT"; id: string }
  | { type: "ADD_DEAL"; deal: AtxDeal }
  | { type: "UPDATE_DEAL"; id: string; updates: Partial<AtxDeal> }
  | { type: "MOVE_DEAL_STAGE"; id: string; stage: DealStage }
  | { type: "DELETE_DEAL"; id: string }
  | { type: "ADD_TASK"; task: AtxTask }
  | { type: "UPDATE_TASK"; id: string; updates: Partial<AtxTask> }
  | { type: "TOGGLE_TASK_STATUS"; id: string }
  | { type: "DELETE_TASK"; id: string }
  | { type: "ADD_ACTIVITY"; activity: AtxActivity };

export function atxReducer(state: AtxState, action: AtxAction): AtxState {
  switch (action.type) {
    case "ADD_CONTACT":
      return { ...state, contacts: [action.contact, ...state.contacts] };
    case "UPDATE_CONTACT":
      return { ...state, contacts: state.contacts.map(c => c.id === action.id ? { ...c, ...action.updates, updatedAt: new Date().toISOString() } : c) };
    case "DELETE_CONTACT":
      return {
        ...state,
        contacts: state.contacts.filter(c => c.id !== action.id),
        deals: state.deals.filter(d => d.contactId !== action.id),
        tasks: state.tasks.filter(t => t.relatedContactId !== action.id),
      };
    case "ADD_DEAL":
      return { ...state, deals: [action.deal, ...state.deals] };
    case "UPDATE_DEAL":
      return { ...state, deals: state.deals.map(d => d.id === action.id ? { ...d, ...action.updates, updatedAt: new Date().toISOString() } : d) };
    case "MOVE_DEAL_STAGE":
      return { ...state, deals: state.deals.map(d => d.id === action.id ? { ...d, stage: action.stage, updatedAt: new Date().toISOString() } : d) };
    case "DELETE_DEAL":
      return { ...state, deals: state.deals.filter(d => d.id !== action.id) };
    case "ADD_TASK":
      return { ...state, tasks: [action.task, ...state.tasks] };
    case "UPDATE_TASK":
      return { ...state, tasks: state.tasks.map(t => t.id === action.id ? { ...t, ...action.updates } : t) };
    case "TOGGLE_TASK_STATUS": {
      return { ...state, tasks: state.tasks.map(t => {
        if (t.id !== action.id) return t;
        const next = t.status === "done" ? "todo" : t.status === "todo" ? "in_progress" : "done";
        return { ...t, status: next, completedAt: next === "done" ? new Date().toISOString() : undefined };
      })};
    }
    case "DELETE_TASK":
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.id) };
    case "ADD_ACTIVITY":
      return { ...state, activities: [action.activity, ...state.activities].slice(0, 50) };
    default:
      return state;
  }
}
