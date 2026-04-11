export interface OdsTeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: "developer" | "senior_developer" | "lead" | "designer" | "project_manager";
  department: "engineering" | "design" | "management";
  photoInitials: string;
  hireDate: string;
  isActive: boolean;
}

export interface OdsClient {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
  industry: string;
  assignedMemberId: string;
  source: "referral" | "website" | "linkedin" | "cold_outreach" | "conference";
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface OdsProject {
  id: string;
  clientId: string;
  clientName: string;
  memberId: string;
  memberName: string;
  projectType: "web_app" | "mobile_app" | "saas_platform" | "api_integration" | "consulting" | "maintenance";
  techStack: string;
  stage: ProjectStage;
  contractValue: number;
  monthlyRecurring: number;
  estimatedHours: number;
  startDate: string;
  expectedDelivery: string;
  createdAt: string;
  updatedAt: string;
  notes: string;
}

export type ProjectStage = "discovery" | "proposal" | "in_progress" | "review" | "deployed" | "completed";

export const PROJECT_STAGES: ProjectStage[] = ["discovery", "proposal", "in_progress", "review", "deployed", "completed"];

export const STAGE_LABELS: Record<ProjectStage, string> = {
  discovery: "Discovery",
  proposal: "Proposal",
  in_progress: "In Progress",
  review: "Review",
  deployed: "Deployed",
  completed: "Completed",
};

export const STAGE_COLORS: Record<ProjectStage, string> = {
  discovery: "bg-gray-500/20 text-gray-300 border-gray-600",
  proposal: "bg-blue-500/20 text-blue-300 border-blue-600",
  in_progress: "bg-indigo-500/20 text-indigo-300 border-indigo-600",
  review: "bg-amber-500/20 text-amber-300 border-amber-600",
  deployed: "bg-green-500/20 text-green-300 border-green-600",
  completed: "bg-emerald-500/20 text-emerald-300 border-emerald-600",
};

export interface OdsTask {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string;
  assigneeId: string;
  assigneeName: string;
  relatedClientId?: string;
  relatedProjectId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface OdsActivity {
  id: string;
  type: "project_created" | "project_stage_changed" | "client_added" | "task_completed" | "note_added" | "project_deployed";
  description: string;
  memberName: string;
  timestamp: string;
  relatedEntityId?: string;
}

export const PRIORITY_COLORS: Record<OdsTask["priority"], string> = {
  low: "bg-gray-500/20 text-gray-400 border-gray-600",
  medium: "bg-blue-500/20 text-blue-400 border-blue-600",
  high: "bg-amber-500/20 text-amber-400 border-amber-600",
  urgent: "bg-red-500/20 text-red-400 border-red-600",
};

export const PROJECT_TYPE_LABELS: Record<OdsProject["projectType"], string> = {
  web_app: "Web App",
  mobile_app: "Mobile App",
  saas_platform: "SaaS Platform",
  api_integration: "API Integration",
  consulting: "Consulting",
  maintenance: "Maintenance",
};

// ── Reducer ────────────────────────────────────────────────────────────────────

export type OdsState = {
  clients: OdsClient[];
  projects: OdsProject[];
  tasks: OdsTask[];
  members: OdsTeamMember[];
  activities: OdsActivity[];
};

export type OdsAction =
  | { type: "ADD_CLIENT"; client: OdsClient }
  | { type: "UPDATE_CLIENT"; id: string; updates: Partial<OdsClient> }
  | { type: "DELETE_CLIENT"; id: string }
  | { type: "ADD_PROJECT"; project: OdsProject }
  | { type: "UPDATE_PROJECT"; id: string; updates: Partial<OdsProject> }
  | { type: "MOVE_PROJECT_STAGE"; id: string; stage: ProjectStage }
  | { type: "DELETE_PROJECT"; id: string }
  | { type: "ADD_TASK"; task: OdsTask }
  | { type: "UPDATE_TASK"; id: string; updates: Partial<OdsTask> }
  | { type: "TOGGLE_TASK_STATUS"; id: string }
  | { type: "DELETE_TASK"; id: string }
  | { type: "ADD_ACTIVITY"; activity: OdsActivity };

export function odsReducer(state: OdsState, action: OdsAction): OdsState {
  switch (action.type) {
    case "ADD_CLIENT":
      return { ...state, clients: [action.client, ...state.clients] };
    case "UPDATE_CLIENT":
      return { ...state, clients: state.clients.map(c => c.id === action.id ? { ...c, ...action.updates, updatedAt: new Date().toISOString() } : c) };
    case "DELETE_CLIENT":
      return {
        ...state,
        clients: state.clients.filter(c => c.id !== action.id),
        projects: state.projects.filter(p => p.clientId !== action.id),
        tasks: state.tasks.filter(t => t.relatedClientId !== action.id),
      };
    case "ADD_PROJECT":
      return { ...state, projects: [action.project, ...state.projects] };
    case "UPDATE_PROJECT":
      return { ...state, projects: state.projects.map(p => p.id === action.id ? { ...p, ...action.updates, updatedAt: new Date().toISOString() } : p) };
    case "MOVE_PROJECT_STAGE":
      return { ...state, projects: state.projects.map(p => p.id === action.id ? { ...p, stage: action.stage, updatedAt: new Date().toISOString() } : p) };
    case "DELETE_PROJECT":
      return { ...state, projects: state.projects.filter(p => p.id !== action.id) };
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
