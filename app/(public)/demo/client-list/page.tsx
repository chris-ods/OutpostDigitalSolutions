"use client";

import { useState, useCallback } from "react";
import { OdsList, DEFAULT_PERMISSIONS } from "ods-ui-library";
import type { OdsRecord, AppRole, OdsListView, PermissionsMatrix, ChangeRecord, OdsColDef } from "ods-ui-library";
// Nav and Footer provided by (public) layout

// ─── Column definitions ──────────────────────────────────────────────────────

const CARRIERS = ["Americo", "Ethos", "Instabrain", "Corebridge", "Trans", "Aetna", "CICA", "MOO", "AMAM", "Chubb", "North American"];
const AGENT_STATUSES = ["Pending", "Approved", "Sent UW", "Declined", "Cancelled"];
const ADMIN_STATUSES = ["Pending", "Issued", "Pending Client Payment", "Pending UW", "Comp Paid", "Client Paid | Waiting on Comp", "Client Paid | Comp Paid", "Comp Paid | Client Not Paid", "UW or Requirements", "Declined", "CXL"];

const DEMO_COLUMNS: OdsColDef[] = [
  { key: "date",            label: "Date",           sortable: true,  editable: true, filterType: "date" },
  { key: "clientName",      label: "Client Name",    sortable: true,  editable: true, filterType: "text" },
  { key: "phone",           label: "Phone",          editable: true, filterType: "text" },
  { key: "email",           label: "Email",          editable: true, filterType: "text" },
  { key: "agentName",       label: "Agent",          sortable: true,  filterType: "text",   adminOnly: true },
  { key: "carrier",         label: "Carrier",        sortable: true,  editable: true, filterType: "enum",   enumValues: CARRIERS },
  { key: "appNumber",       label: "App #",          editable: true, filterType: "text" },
  { key: "annualPremium",   label: "Annual Premium", sortable: true,  editable: true, filterType: "number" },
  { key: "splitPercent",    label: "Split %",        sortable: true,  editable: true, filterType: "number" },
  { key: "state",           label: "State",          sortable: true,  editable: true, filterType: "enum" },
  { key: "startDate",       label: "Start Date",     sortable: true,  editable: true, filterType: "date" },
  { key: "agentStatus",     label: "Agent Status",   sortable: true,  editable: true, filterType: "enum",   enumValues: AGENT_STATUSES },
  { key: "adminStatus",     label: "Admin Status",   sortable: true,  editable: true, filterType: "enum",   enumValues: ADMIN_STATUSES },
  { key: "notes",           label: "Notes",          editable: true, filterType: "text", multiline: true },
];

// ─── Sample Data (22 clients + 3 pending) ─────────────────────────────────────

const SAMPLE_CLIENTS: OdsRecord[] = [
  { id: "m-001", clientName: "Reginald Okafor", phone: "312-555-0147", email: "r.okafor@mailbox.dev", state: "IL", carrier: "Americo", appNumber: "AM09125001", annualPremium: 1344, agentId: "ag-1", agentName: "Priya Nair", contractorId: "CT-11", agentTeamNumber: 1, date: "2025-10-04", startDate: "2025-11-01", agentStatus: "Approved", adminStatus: "Issued", portalName: "Portal A", createdAt: { seconds: 1759622400 }, updatedAt: { seconds: 1759708800 } },
  { id: "m-002", clientName: "Denise Calloway", phone: "404-555-0283", email: "dcalloway@devmail.io", state: "GA", carrier: "Ethos", appNumber: "PTSN009900012", annualPremium: 828, agentId: "ag-2", agentName: "Marcus Webb", contractorId: "CT-22", agentTeamNumber: 2, date: "2025-10-11", startDate: "2025-11-01", agentStatus: "Approved", adminStatus: "Pending Client Payment", portalName: "Portal B", createdAt: { seconds: 1760227200 } },
  { id: "m-003", clientName: "Hector Villanueva", phone: "713-555-0391", state: "TX", carrier: "Instabrain", appNumber: "0102100041", annualPremium: 2136.48, agentId: "ag-1", agentName: "Priya Nair", contractorId: "CT-11", agentTeamNumber: 1, date: "2025-10-19", startDate: "2025-11-15", agentStatus: "Approved", adminStatus: "Comp Paid", portalName: "Portal A", notes: "Requested paper policy copy", createdAt: { seconds: 1760918400 } },
  { id: "m-004", clientName: "Fatima Osei", phone: "614-555-0472", email: "fatima.osei@devmail.io", state: "OH", carrier: "Corebridge", appNumber: "CB20251904", annualPremium: 1980, splitPercent: 50, agentId: "ag-3", agentName: "Lindsey Park", contractorId: "CT-33", agentTeamNumber: 3, date: "2025-11-02", startDate: "2025-12-01", agentStatus: "Sent UW", adminStatus: "Pending UW", portalName: "Portal C", createdAt: { seconds: 1762128000 } },
  { id: "m-005", clientName: "Gerald Tran", phone: "503-555-0519", email: "g.tran@sandbox.net", state: "OR", carrier: "MOO", appNumber: "MOO-2025-5519", annualPremium: 756, agentId: "ag-2", agentName: "Marcus Webb", contractorId: "CT-22", agentTeamNumber: 2, date: "2025-11-10", startDate: "2025-12-01", agentStatus: "Approved", adminStatus: "Client Paid | Waiting on Comp", portalName: "Portal B", createdAt: { seconds: 1762819200 } },
  { id: "m-006", clientName: "Naomi Baptiste", phone: "504-555-0638", state: "LA", carrier: "Trans", appNumber: "TR2025110638", annualPremium: 1512, agentId: "ag-4", agentName: "Devon Osei", contractorId: "CT-44", agentTeamNumber: 1, date: "2025-11-17", agentStatus: "Declined", adminStatus: "Declined", notes: "UW declined — health history. May reapply in 6 months.", createdAt: { seconds: 1763424000 } },
  { id: "m-007", clientName: "Roderick Blanchard", phone: "617-555-0754", email: "rblanchard@devmail.io", state: "MA", carrier: "Aetna", appNumber: "AET20251107", annualPremium: 3240, agentId: "ag-1", agentName: "Priya Nair", contractorId: "CT-11", agentTeamNumber: 1, date: "2025-11-24", startDate: "2026-01-01", agentStatus: "Approved", adminStatus: "Issued", portalName: "Portal A", createdAt: { seconds: 1764028800 } },
  { id: "m-008", clientName: "Celeste Drummond", phone: "702-555-0862", email: "celeste.d@sandbox.net", state: "NV", carrier: "CICA", appNumber: "CICA-NV-2025-08", annualPremium: 924, agentId: "ag-3", agentName: "Lindsey Park", contractorId: "CT-33", agentTeamNumber: 3, date: "2025-12-01", startDate: "2026-01-01", agentStatus: "Approved", adminStatus: "Client Paid | Comp Paid", portalName: "Portal C", createdAt: { seconds: 1764633600 } },
  { id: "m-009", clientName: "Wyatt Hollingsworth", phone: "208-555-0973", state: "ID", carrier: "Americo", appNumber: "AM12125009", annualPremium: 1656, agentId: "ag-2", agentName: "Marcus Webb", contractorId: "CT-22", agentTeamNumber: 2, date: "2025-12-08", startDate: "2026-01-01", agentStatus: "Approved", adminStatus: "Pending Client Payment", portalName: "Portal B", notes: "Left voicemail — awaiting callback", createdAt: { seconds: 1765238400 } },
  { id: "m-010", clientName: "Simone Achebe", phone: "646-555-1082", email: "simone.achebe@mailbox.dev", state: "NY", carrier: "Ethos", appNumber: "PTSN009900102", annualPremium: 1188, splitPercent: 50, agentId: "ag-4", agentName: "Devon Osei", contractorId: "CT-44", agentTeamNumber: 1, date: "2025-12-15", startDate: "2026-01-15", agentStatus: "Approved", adminStatus: "Issued", portalName: "Portal D", createdAt: { seconds: 1765843200 } },
  { id: "m-011", clientName: "Alonzo Ferreira", phone: "305-555-1193", email: "a.ferreira@sandbox.net", state: "FL", carrier: "AMAM", appNumber: "M003500211", annualPremium: 2604, agentId: "ag-1", agentName: "Priya Nair", contractorId: "CT-11", agentTeamNumber: 1, date: "2025-12-22", startDate: "2026-02-01", agentStatus: "Sent UW", adminStatus: "UW or Requirements", portalName: "Portal A", notes: "Awaiting lab results", createdAt: { seconds: 1766448000 } },
  { id: "m-012", clientName: "Tamara Kowalczyk", phone: "414-555-1204", state: "WI", carrier: "Instabrain", appNumber: "0102100122", annualPremium: 897.60, agentId: "ag-3", agentName: "Lindsey Park", contractorId: "CT-33", agentTeamNumber: 3, date: "2026-01-05", startDate: "2026-02-01", agentStatus: "Approved", adminStatus: "Comp Paid | Client Not Paid", portalName: "Portal C", createdAt: { seconds: 1767657600 } },
  { id: "m-013", clientName: "Everett Nwosu", phone: "919-555-1315", email: "e.nwosu@devmail.io", state: "NC", carrier: "Chubb", appNumber: "CHB-2026-1315", annualPremium: 4320, agentId: "ag-2", agentName: "Marcus Webb", contractorId: "CT-22", agentTeamNumber: 2, date: "2026-01-12", startDate: "2026-02-01", agentStatus: "Approved", adminStatus: "Issued", portalName: "Portal B", createdAt: { seconds: 1768262400 } },
  { id: "m-014", clientName: "Brianna Okonkwo", phone: "206-555-1426", email: "bokonkwo@mailbox.dev", state: "WA", carrier: "Americo", appNumber: "AM01265014", annualPremium: 1104, agentId: "ag-4", agentName: "Devon Osei", contractorId: "CT-44", agentTeamNumber: 1, date: "2026-01-19", startDate: "2026-03-01", agentStatus: "Cancelled", adminStatus: "CXL", portalName: "Portal D", notes: "Client changed mind — job loss", createdAt: { seconds: 1768867200 } },
  { id: "m-015", clientName: "Phillip Stanhope", phone: "512-555-1537", state: "TX", carrier: "MOO", appNumber: "MOO-2026-1537", annualPremium: 1440, agentId: "ag-1", agentName: "Priya Nair", contractorId: "CT-11", agentTeamNumber: 1, date: "2026-01-26", startDate: "2026-03-01", agentStatus: "Approved", adminStatus: "Client Paid | Waiting on Comp", portalName: "Portal A", createdAt: { seconds: 1769472000 } },
  { id: "m-016", clientName: "Yolanda Mercier", phone: "602-555-1648", email: "y.mercier@sandbox.net", state: "AZ", carrier: "Ethos", appNumber: "PTSN009900163", annualPremium: 660, agentId: "ag-3", agentName: "Lindsey Park", contractorId: "CT-33", agentTeamNumber: 3, date: "2026-02-02", startDate: "2026-03-01", agentStatus: "Approved", adminStatus: "Client Paid | Comp Paid", portalName: "Portal C", createdAt: { seconds: 1770076800 } },
  { id: "m-017", clientName: "Otis Threadgill", phone: "901-555-1759", state: "TN", carrier: "Aetna", appNumber: "AET20260217", annualPremium: 2280, agentId: "ag-2", agentName: "Marcus Webb", contractorId: "CT-22", agentTeamNumber: 2, date: "2026-02-09", agentStatus: "Sent UW", adminStatus: "Pending UW", portalName: "Portal B", createdAt: { seconds: 1770681600 } },
  { id: "m-018", clientName: "Camille Jourdain", phone: "504-555-1860", email: "cjourdain@mailbox.dev", state: "LA", carrier: "CICA", appNumber: "CICA-LA-2026-18", annualPremium: 1368, agentId: "ag-4", agentName: "Devon Osei", contractorId: "CT-44", agentTeamNumber: 1, date: "2026-02-16", startDate: "2026-03-15", agentStatus: "Approved", adminStatus: "Pending Client Payment", portalName: "Portal D", createdAt: { seconds: 1771286400 } },
  { id: "m-019", clientName: "Darnell Whitfield", phone: "313-555-1971", email: "d.whitfield@devmail.io", state: "MI", carrier: "Trans", appNumber: "TR2026022019", annualPremium: 1824, agentId: "ag-1", agentName: "Priya Nair", contractorId: "CT-11", agentTeamNumber: 1, date: "2026-02-23", startDate: "2026-04-01", agentStatus: "Approved", adminStatus: "Issued", portalName: "Portal A", createdAt: { seconds: 1771891200 } },
  { id: "m-020", clientName: "Ingrid Oyelaran", phone: "773-555-2082", state: "IL", carrier: "Instabrain", appNumber: "0102100201", annualPremium: 516.48, agentId: "ag-3", agentName: "Lindsey Park", contractorId: "CT-33", agentTeamNumber: 3, date: "2026-03-02", agentStatus: "Pending", adminStatus: "Pending", portalName: "Portal C", notes: "Application submitted — awaiting confirmation number", createdAt: { seconds: 1772496000 } },
  { id: "m-021", clientName: "Warren Espinoza", phone: "720-555-2193", email: "w.espinoza@sandbox.net", state: "CO", carrier: "Corebridge", appNumber: "CB20260321", annualPremium: 2952, agentId: "ag-2", agentName: "Marcus Webb", contractorId: "CT-22", agentTeamNumber: 2, date: "2026-03-09", startDate: "2026-04-01", agentStatus: "Approved", adminStatus: "Client Paid | Waiting on Comp", portalName: "Portal B", createdAt: { seconds: 1773100800 } },
  { id: "m-022", clientName: "Latasha Boudreaux", phone: "225-555-2304", email: "l.boudreaux@mailbox.dev", state: "LA", carrier: "Americo", appNumber: "AM03265022", annualPremium: 1092, agentId: "ag-4", agentName: "Devon Osei", contractorId: "CT-44", agentTeamNumber: 1, date: "2026-03-16", agentStatus: "Pending", adminStatus: "Pending", portalName: "Portal D", createdAt: { seconds: 1773705600 } },
];

// ─── Role metadata ─────────────────────────────────────────────────────────────

const ROLES: { role: AppRole; label: string; color: string; badge: string; description: string; can: string[]; cannot: string[] }[] = [
  {
    role: "rep",
    label: "Rep",
    color: "text-slate-300",
    badge: "bg-slate-700/50 border-slate-600",
    description: "Field reps — see their own pipeline, update contact and status fields.",
    can: ["View own clients", "Edit phone, email, notes", "Update agent status"],
    cannot: ["See agent/contractor columns", "See commission data", "Export CSV", "Edit admin status"],
  },
  {
    role: "manager",
    label: "Manager",
    color: "text-blue-300",
    badge: "bg-blue-900/40 border-blue-700/50",
    description: "Team leads — full client visibility, can edit most fields except admin-only controls.",
    can: ["View all clients & agents", "Edit most fields", "See team numbers"],
    cannot: ["Export CSV", "Rename the list", "Configure permissions"],
  },
  {
    role: "admin",
    label: "Admin",
    color: "text-violet-300",
    badge: "bg-violet-900/40 border-violet-700/50",
    description: "Back-office — same visibility as manager, full edit access including admin status.",
    can: ["View all columns", "Edit admin status & dates", "Full audit log"],
    cannot: ["Export CSV", "Rename the list", "Configure permissions"],
  },
  {
    role: "owner",
    label: "Owner",
    color: "text-cyan-300",
    badge: "bg-cyan-900/40 border-cyan-700/50",
    description: "Full access — configure permissions, export, rename, and see every column.",
    can: ["All columns & editing", "Export CSV", "Configure permissions per role", "Rename the list"],
    cannot: [],
  },
];

function propsForRole(role: AppRole) {
  return {
    isAdmin:   role === "owner" || role === "dev" || role === "admin",
    isManager: role === "manager",
  };
}

// ─── Add Client Modal ──────────────────────────────────────────────────────────

const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

type AddForm = {
  clientName: string; phone: string; email: string; state: string;
  carrier: string; appNumber: string; annualPremium: string;
  date: string; agentStatus: string; adminStatus: string; notes: string;
};

const EMPTY_FORM: AddForm = {
  clientName: "", phone: "", email: "", state: "TX",
  carrier: "Americo", appNumber: "", annualPremium: "",
  date: new Date().toISOString().slice(0, 10),
  agentStatus: "Pending", adminStatus: "Pending", notes: "",
};

function AddClientModal({ onClose, onAdd }: { onClose: () => void; onAdd: (c: OdsRecord) => void }) {
  const [form, setForm] = useState<AddForm>(EMPTY_FORM);
  const [error, setError] = useState("");

  const set = (field: keyof AddForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const submit = () => {
    if (!form.clientName.trim()) { setError("Client name is required."); return; }
    const newClient: OdsRecord = {
      id: `new-${Date.now()}`,
      clientName: form.clientName.trim(),
      phone: form.phone || undefined,
      email: form.email || undefined,
      state: form.state || undefined,
      carrier: form.carrier || undefined,
      appNumber: form.appNumber || undefined,
      annualPremium: form.annualPremium ? parseFloat(form.annualPremium) : undefined,
      date: form.date || undefined,
      agentStatus: form.agentStatus || undefined,
      adminStatus: form.adminStatus || undefined,
      notes: form.notes || undefined,
      agentId: "ag-1",
      agentName: "Priya Nair",
      contractorId: "CT-11",
      agentTeamNumber: 1,
      createdAt: { seconds: Math.floor(Date.now() / 1000) },
    };
    onAdd(newClient);
    onClose();
  };

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/20 text-sm focus:outline-none focus:border-white/30 transition-colors";
  const labelCls = "block text-white/40 text-xs font-semibold uppercase tracking-wide mb-1.5";
  const selectCls = inputCls + " appearance-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-950 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <h2 className="text-white font-semibold">Add Client</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div>
            <label className={labelCls}>Client Name *</label>
            <input className={inputCls} placeholder="Full name" value={form.clientName} onChange={set("clientName")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Phone</label>
              <input className={inputCls} placeholder="555-555-5555" value={form.phone} onChange={set("phone")} />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input className={inputCls} placeholder="email@example.com" value={form.email} onChange={set("email")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>State</label>
              <select className={selectCls} value={form.state} onChange={set("state")}>
                {STATES.map(s => <option key={s} value={s} className="bg-gray-900">{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Carrier</label>
              <select className={selectCls} value={form.carrier} onChange={set("carrier")}>
                {CARRIERS.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>App Number</label>
              <input className={inputCls} placeholder="App #" value={form.appNumber} onChange={set("appNumber")} />
            </div>
            <div>
              <label className={labelCls}>Annual Premium</label>
              <input className={inputCls} type="number" placeholder="0.00" value={form.annualPremium} onChange={set("annualPremium")} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Date</label>
              <input className={inputCls} type="date" value={form.date} onChange={set("date")} />
            </div>
            <div>
              <label className={labelCls}>Agent Status</label>
              <select className={selectCls} value={form.agentStatus} onChange={set("agentStatus")}>
                {AGENT_STATUSES.map(s => <option key={s} value={s} className="bg-gray-900">{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Admin Status</label>
              <select className={selectCls} value={form.adminStatus} onChange={set("adminStatus")}>
                {ADMIN_STATUSES.map(s => <option key={s} value={s} className="bg-gray-900">{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Notes</label>
            <textarea className={inputCls + " resize-none"} rows={3} placeholder="Optional notes..." value={form.notes} onChange={set("notes")} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-white/10">
          <button onClick={onClose} className="px-5 py-2 text-sm text-white/50 hover:text-white transition-colors">
            Cancel
          </button>
          <button onClick={submit} className="px-6 py-2 bg-blue-500 hover:bg-blue-400 text-white font-semibold text-sm rounded-full transition-colors">
            Add Client
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Default demo state (the shape everything resets to) ──────────────────────

const DEFAULT_STATE = {
  clients: SAMPLE_CLIENTS,
  views: [] as OdsListView[],
  permissions: DEFAULT_PERMISSIONS,
  listTitle: "Client List",
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function DesignPage() {
  const [role, setRole] = useState<AppRole>("owner");
  const [clients, setClients] = useState<OdsRecord[]>(DEFAULT_STATE.clients);
  const [views, setViews] = useState<OdsListView[]>(DEFAULT_STATE.views);
  const [permissions, setPermissions] = useState<PermissionsMatrix>(DEFAULT_STATE.permissions);
  const [listTitle, setListTitle] = useState<string>(DEFAULT_STATE.listTitle);
  const [showModal, setShowModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const selectedRoleMeta = ROLES.find((r) => r.role === role)!;

  // Reset all demo state back to defaults — mock clients, no saved views, default permissions
  const handleReset = useCallback(() => {
    setClients(DEFAULT_STATE.clients);
    setViews(DEFAULT_STATE.views);
    setPermissions(DEFAULT_STATE.permissions);
    setListTitle(DEFAULT_STATE.listTitle);
    setIsDirty(false);
  }, []);

  const onSave = useCallback(async (
    id: string, field: string, value: string | number, updaterName: string, fromValue?: string | number,
  ) => {
    const change: ChangeRecord = {
      at: { seconds: Math.floor(Date.now() / 1000) },
      by: updaterName,
      field,
      from: String(fromValue ?? ""),
      to: String(value),
    };
    setClients((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, [field]: value, updatedByName: updaterName, updatedAt: change.at, changeLog: [...(c.changeLog ?? []), change] }
          : c,
      ),
    );
    setIsDirty(true);
  }, []);

  const onSaveView = useCallback(async (view: Omit<OdsListView, "id">): Promise<string> => {
    const id = `view-${Date.now()}`;
    setViews((prev) => [...prev, { id, ...view }]);
    setIsDirty(true);
    return id;
  }, []);

  const onDeleteView = useCallback(async (id: string) => {
    setViews((prev) => prev.filter((v) => v.id !== id));
    setIsDirty(true);
  }, []);

  const onSavePermissions = useCallback(async (matrix: PermissionsMatrix) => {
    setPermissions(matrix);
    setIsDirty(true);
  }, []);

  const onRenameList = useCallback(async (name: string) => {
    setListTitle(name);
    setIsDirty(true);
  }, []);

  const handleAddClient = useCallback((c: OdsRecord) => {
    setClients((prev) => [c, ...prev]);
    setIsDirty(true);
  }, []);

  return (
    <div>
      {/* ── Hero ── */}
      <section className="pt-32 pb-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 mb-6">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-cyan-400 text-xs font-semibold">Live Product Demo</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-5">
            ClientList
          </h1>
          <p className="text-white/50 text-lg leading-relaxed max-w-2xl mx-auto mb-4">
            A production-ready data table for insurance agencies — built on Firebase.
            Filter, sort, inline-edit, and export. Every column respects the viewer&apos;s role.
          </p>
          <p className="text-white/30 text-sm">
            This is a fully interactive demo with {SAMPLE_CLIENTS.length} mock clients. Switch roles to see how the table changes.
          </p>
        </div>
      </section>

      {/* ── Role Picker + Controls ── */}
      <div className="sticky top-14 z-40 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Segmented picker */}
          <div className="flex items-center gap-2">
            <span className="text-white/30 text-xs font-semibold uppercase tracking-widest mr-1 shrink-0">View as</span>
            <div className="flex rounded-xl bg-white/5 border border-white/10 p-1 gap-1">
              {ROLES.map(({ role: r, label }) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    role === r
                      ? "bg-white text-black shadow"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Reset — only shown when demo has been modified */}
            {isDirty && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-white/40 hover:text-white border border-white/10 hover:border-white/20 text-sm px-4 py-2 rounded-full transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Reset demo
              </button>
            )}

            {/* Add client — only owners/admins */}
            {(role === "owner" || role === "admin") && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-semibold text-sm px-5 py-2 rounded-full transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Client
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Role Callout ── */}
      <div className="max-w-7xl mx-auto px-6 pt-5 pb-2">
        <div className={`flex flex-col sm:flex-row sm:items-start gap-4 rounded-2xl border px-5 py-4 ${selectedRoleMeta.badge}`}>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold mb-0.5 ${selectedRoleMeta.color}`}>{selectedRoleMeta.label}</p>
            <p className="text-white/50 text-sm">{selectedRoleMeta.description}</p>
          </div>
          <div className="flex gap-6 shrink-0 text-xs">
            {selectedRoleMeta.can.length > 0 && (
              <div>
                <p className="text-white/30 font-semibold uppercase tracking-widest mb-1.5">Can</p>
                <ul className="space-y-1">
                  {selectedRoleMeta.can.map((item) => (
                    <li key={item} className="flex items-center gap-1.5 text-white/60">
                      <svg className="w-3 h-3 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {selectedRoleMeta.cannot.length > 0 && (
              <div>
                <p className="text-white/30 font-semibold uppercase tracking-widest mb-1.5">Cannot</p>
                <ul className="space-y-1">
                  {selectedRoleMeta.cannot.map((item) => (
                    <li key={item} className="flex items-center gap-1.5 text-white/60">
                      <svg className="w-3 h-3 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Live ClientList ── */}
      <div className="max-w-7xl mx-auto px-6 py-4 pb-20">
        <OdsList
          columns={DEMO_COLUMNS}
          clients={clients}
          views={views}
          permissions={permissions}
          uid="demo-user"
          userName="Demo User"
          currentRole={role}
          phase="live"
          listTitle={listTitle}
          onSave={onSave}
          onSaveView={onSaveView}
          onDeleteView={onDeleteView}
          onSavePermissions={onSavePermissions}
          onRenameList={onRenameList}
          {...propsForRole(role)}
        />
      </div>

      {/* ── Features Grid ── */}
      <section className="border-t border-white/10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-white/30 text-xs font-semibold uppercase tracking-widest text-center mb-4">What you just used</p>
          <h2 className="text-4xl font-bold text-center tracking-tight mb-16">Every feature, production-ready.</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: "Role-based columns", desc: "Rep, Manager, Admin, and Owner each see a different set of columns based on a configurable permissions matrix." },
              { title: "Inline cell editing", desc: "Click any editable cell to update it. Changes write to Firestore with a full audit trail of who changed what and when." },
              { title: "Per-column filters", desc: "Checkbox filters for enums, text search, and date/number ranges — all composable and combinable." },
              { title: "Column drag-to-reorder", desc: "Every user can rearrange columns to fit their workflow. Order persists per session." },
              { title: "Saved views", desc: "Save any combination of filters, sort, and column order as a named view. Switch between them instantly." },
              { title: "CSV export", desc: "Export the current filtered view to CSV with one click. Respects role permissions — reps can't export." },
            ].map(({ title, desc }) => (
              <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-4">
                  <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold mb-2">{title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {showModal && (
        <AddClientModal onClose={() => setShowModal(false)} onAdd={handleAddClient} />
      )}
    </div>
  );
}
