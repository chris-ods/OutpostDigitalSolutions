"use client";

import { useState, useEffect, useRef } from "react";
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { db } from "../firebase";

// ── Types ─────────────────────────────────────────────────────────────────

type Category = "Development" | "Design" | "Meeting" | "Review" | "Bug Fix" | "Planning" | "Other";
const CATEGORIES: Category[] = ["Development", "Design", "Meeting", "Review", "Bug Fix", "Planning", "Other"];

type TaskStatus = "todo" | "in-progress" | "done";
type Priority   = "low" | "medium" | "high";

interface TimeEntry {
  id: string;
  clientName: string;
  project: string;
  date: string;
  hours: number;
  category: Category;
  description: string;
  billable: boolean;
}

interface Task {
  id: string;
  clientName: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  notes: string;
  dueDate: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function fmt(seconds: number) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

const PRIORITY_STYLES: Record<Priority, string> = {
  low:    "bg-gray-700 text-gray-300",
  medium: "bg-amber-900/60 text-amber-300",
  high:   "bg-red-900/60 text-red-300",
};

const STATUS_STYLES: Record<TaskStatus, string> = {
  "todo":        "bg-gray-700 text-gray-400",
  "in-progress": "bg-blue-900/60 text-blue-300",
  "done":        "bg-green-900/60 text-green-400",
};

const CAT_COLORS: Record<Category, string> = {
  Development: "bg-blue-900/40 text-blue-300",
  Design:      "bg-violet-900/40 text-violet-300",
  Meeting:     "bg-amber-900/40 text-amber-300",
  Review:      "bg-teal-900/40 text-teal-300",
  "Bug Fix":   "bg-red-900/40 text-red-300",
  Planning:    "bg-indigo-900/40 text-indigo-300",
  Other:       "bg-gray-800 text-gray-400",
};

// ── Subcomponents ─────────────────────────────────────────────────────────

function SectionHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h4 className="text-white font-semibold">{title}</h4>
      {children}
    </div>
  );
}

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${className}`}>{label}</span>
  );
}

// ── Timer Widget ──────────────────────────────────────────────────────────

function Timer({ clients, onLog }: {
  clients: string[];
  onLog: (entry: Omit<TimeEntry, "id">) => void;
}) {
  const [running, setRunning]   = useState(false);
  const [elapsed, setElapsed]   = useState(0);
  const [client, setClient]     = useState("");
  const [project, setProject]   = useState("");
  const [category, setCategory] = useState<Category>("Development");
  const [desc, setDesc]         = useState("");
  const [billable, setBillable] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const handleStop = () => {
    setRunning(false);
    if (elapsed > 0) {
      onLog({
        clientName: client || "Unspecified",
        project: project || "General",
        date: today(),
        hours: Math.round((elapsed / 3600) * 100) / 100,
        category,
        description: desc,
        billable,
      });
      setElapsed(0);
      setDesc("");
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h4 className="text-white font-semibold">Live Timer</h4>
        <Badge
          label={running ? "● Recording" : "Stopped"}
          className={running ? "bg-red-900/60 text-red-400 animate-pulse" : "bg-gray-700 text-gray-500"}
        />
      </div>

      {/* Clock */}
      <div className="text-center py-4">
        <p className={`text-6xl font-mono font-bold tracking-wider ${running ? "text-white" : "text-gray-600"}`}>
          {fmt(elapsed)}
        </p>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
        <div>
          <label className="text-gray-400 text-xs block mb-1">Client</label>
          <select
            value={client}
            onChange={e => setClient(e.target.value)}
            disabled={running}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 disabled:opacity-50"
          >
            <option value="">— Select client —</option>
            {clients.map(c => <option key={c}>{c}</option>)}
            <option value="Internal">Internal</option>
          </select>
        </div>
        <div>
          <label className="text-gray-400 text-xs block mb-1">Project / Feature</label>
          <input
            type="text"
            value={project}
            onChange={e => setProject(e.target.value)}
            disabled={running}
            placeholder="e.g. Auth flow redesign"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="text-gray-400 text-xs block mb-1">Category</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value as Category)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
          >
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-end gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none pb-2">
            <input
              type="checkbox"
              checked={billable}
              onChange={e => setBillable(e.target.checked)}
              className="w-4 h-4 accent-blue-500"
            />
            <span className="text-gray-300 text-sm">Billable</span>
          </label>
        </div>
        <div className="sm:col-span-2">
          <label className="text-gray-400 text-xs block mb-1">What are you working on?</label>
          <input
            type="text"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Brief description of the work…"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600"
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 mt-5">
        {!running ? (
          <button
            onClick={() => setRunning(true)}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            Start Timer
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            Stop & Log
          </button>
        )}
        {!running && elapsed > 0 && (
          <button onClick={() => setElapsed(0)} className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-xl transition text-sm">
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

// ── Manual Entry Form ─────────────────────────────────────────────────────

function ManualEntryForm({ clients, onLog }: {
  clients: string[];
  onLog: (entry: Omit<TimeEntry, "id">) => void;
}) {
  const [open, setOpen]         = useState(false);
  const [client, setClient]     = useState("");
  const [project, setProject]   = useState("");
  const [date, setDate]         = useState(today());
  const [hours, setHours]       = useState("");
  const [category, setCategory] = useState<Category>("Development");
  const [desc, setDesc]         = useState("");
  const [billable, setBillable] = useState(true);

  const save = () => {
    if (!hours || parseFloat(hours) <= 0) return;
    onLog({
      clientName: client || "Unspecified",
      project: project || "General",
      date,
      hours: parseFloat(hours),
      category,
      description: desc,
      billable,
    });
    setHours(""); setDesc(""); setOpen(false);
  };

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 rounded-xl text-sm transition"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
      </svg>
      Manual Entry
    </button>
  );

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="text-white font-semibold text-sm">Manual Time Entry</h5>
        <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-300 transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-gray-400 text-xs block mb-1">Client</label>
          <select value={client} onChange={e => setClient(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200">
            <option value="">— Select —</option>
            {clients.map(c => <option key={c}>{c}</option>)}
            <option value="Internal">Internal</option>
          </select>
        </div>
        <div>
          <label className="text-gray-400 text-xs block mb-1">Project</label>
          <input type="text" value={project} onChange={e => setProject(e.target.value)} placeholder="Project name" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600"/>
        </div>
        <div>
          <label className="text-gray-400 text-xs block mb-1">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"/>
        </div>
        <div>
          <label className="text-gray-400 text-xs block mb-1">Hours</label>
          <input type="number" value={hours} onChange={e => setHours(e.target.value)} min="0.1" step="0.25" placeholder="0.00" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600"/>
        </div>
        <div>
          <label className="text-gray-400 text-xs block mb-1">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value as Category)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200">
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={billable} onChange={e => setBillable(e.target.checked)} className="w-4 h-4 accent-blue-500"/>
            <span className="text-gray-300 text-sm">Billable</span>
          </label>
        </div>
        <div className="col-span-2">
          <label className="text-gray-400 text-xs block mb-1">Description / Notes</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="What did you build or accomplish?" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 resize-none"/>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={() => setOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm transition">Cancel</button>
        <button onClick={save} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition">Save Entry</button>
      </div>
    </div>
  );
}

// ── Time Entries List ─────────────────────────────────────────────────────

function TimeEntries({ entries, onDelete }: {
  entries: TimeEntry[];
  onDelete: (id: string) => void;
}) {
  const [filter, setFilter] = useState("all");
  const clients = ["all", ...Array.from(new Set(entries.map(e => e.clientName)))];
  const filtered = filter === "all" ? entries : entries.filter(e => e.clientName === filter);
  const totalHours = filtered.reduce((s, e) => s + e.hours, 0);
  const billableHours = filtered.filter(e => e.billable).reduce((s, e) => s + e.hours, 0);

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Hours", value: totalHours.toFixed(1) },
          { label: "Billable", value: billableHours.toFixed(1) },
          { label: "Entries", value: filtered.length.toString() },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-center">
            <p className="text-white font-bold text-xl">{s.value}</p>
            <p className="text-gray-500 text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {clients.map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition capitalize ${
              filter === c ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-600 text-sm">No entries yet. Start the timer or add a manual entry.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(entry => (
            <div key={entry.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-white font-medium text-sm">{entry.clientName}</span>
                  <span className="text-gray-600 text-xs">·</span>
                  <span className="text-gray-400 text-sm">{entry.project}</span>
                  <Badge label={entry.category} className={CAT_COLORS[entry.category]} />
                  {entry.billable && <Badge label="Billable" className="bg-emerald-900/40 text-emerald-400" />}
                </div>
                {entry.description && <p className="text-gray-500 text-xs mt-0.5 truncate">{entry.description}</p>}
                <p className="text-gray-600 text-xs mt-1">{entry.date}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-white font-bold">{entry.hours}h</p>
                <button
                  onClick={() => onDelete(entry.id)}
                  className="text-gray-700 hover:text-red-400 transition mt-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tasks ─────────────────────────────────────────────────────────────────

function Tasks({ clients, tasks, onAdd, onUpdate, onDelete }: {
  clients: string[];
  tasks: Task[];
  onAdd: (t: Omit<Task, "id">) => void;
  onUpdate: (id: string, changes: Partial<Task>) => void;
  onDelete: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle]   = useState("");
  const [client, setClient] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [notes, setNotes]   = useState("");
  const [dueDate, setDueDate] = useState("");
  const [filter, setFilter] = useState<TaskStatus | "all">("all");

  const save = () => {
    if (!title.trim()) return;
    onAdd({ title, clientName: client || "General", status: "todo", priority, notes, dueDate });
    setTitle(""); setNotes(""); setDueDate(""); setAdding(false);
  };

  const cols: { status: TaskStatus; label: string }[] = [
    { status: "todo",        label: "To Do" },
    { status: "in-progress", label: "In Progress" },
    { status: "done",        label: "Done" },
  ];

  const filteredTasks = filter === "all" ? tasks : tasks.filter(t => t.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
          {(["all", "todo", "in-progress", "done"] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded text-xs font-medium transition capitalize ${
                filter === s ? "bg-gray-600 text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {s === "all" ? "All" : s === "in-progress" ? "In Progress" : s === "todo" ? "To Do" : "Done"}
            </button>
          ))}
        </div>
        <button
          onClick={() => setAdding(true)}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          Add Task
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3">
          <input
            type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Task title…" autoFocus
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600"
          />
          <div className="grid grid-cols-3 gap-2">
            <select value={client} onChange={e => setClient(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300">
              <option value="">Client</option>
              {clients.map(c => <option key={c}>{c}</option>)}
              <option value="Internal">Internal</option>
            </select>
            <select value={priority} onChange={e => setPriority(e.target.value as Priority)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300"/>
          </div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Notes…" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 resize-none"/>
          <div className="flex justify-end gap-2">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-gray-400 hover:text-white text-sm transition">Cancel</button>
            <button onClick={save} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition">Add</button>
          </div>
        </div>
      )}

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-10 text-gray-600 text-sm">
          {filter === "all" ? "No tasks yet." : `No ${filter} tasks.`}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map(task => (
            <div key={task.id} className={`bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-start gap-3 ${task.status === "done" ? "opacity-60" : ""}`}>
              {/* Status toggle */}
              <button
                onClick={() => {
                  const next: Record<TaskStatus, TaskStatus> = { todo: "in-progress", "in-progress": "done", done: "todo" };
                  onUpdate(task.id, { status: next[task.status] });
                }}
                className="mt-0.5 shrink-0"
                title="Cycle status"
              >
                {task.status === "done" ? (
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                ) : task.status === "in-progress" ? (
                  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 6v6l4 2"/></svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/></svg>
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-medium ${task.status === "done" ? "line-through text-gray-500" : "text-white"}`}>{task.title}</span>
                  <Badge label={task.priority} className={PRIORITY_STYLES[task.priority]} />
                  {task.clientName && task.clientName !== "General" && (
                    <span className="text-gray-500 text-xs">{task.clientName}</span>
                  )}
                  {task.dueDate && (
                    <span className={`text-xs ${new Date(task.dueDate) < new Date() && task.status !== "done" ? "text-red-400" : "text-gray-500"}`}>
                      Due {task.dueDate}
                    </span>
                  )}
                </div>
                {task.notes && <p className="text-gray-500 text-xs mt-1">{task.notes}</p>}
              </div>

              <button onClick={() => onDelete(task.id)} className="text-gray-700 hover:text-red-400 transition shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────

type Tab = "timesheet" | "tasks";

export default function TimeSheetSection() {
  const [tab, setTab] = useState<Tab>("timesheet");
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [tasks, setTasks]     = useState<Task[]>([]);
  const [clients, setClients] = useState<string[]>([]);

  // Load clients for dropdowns
  useEffect(() => {
    const q = query(collection(db, "clients"), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap => {
      setClients(snap.docs.map(d => (d.data() as { name: string }).name).filter(Boolean));
    });
  }, []);

  // Load time entries
  useEffect(() => {
    const q = query(collection(db, "timeEntries"), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() } as TimeEntry)));
    });
  }, []);

  // Load tasks
  useEffect(() => {
    const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    });
  }, []);

  const addEntry = async (entry: Omit<TimeEntry, "id">) => {
    await addDoc(collection(db, "timeEntries"), { ...entry, createdAt: serverTimestamp() });
  };

  const deleteEntry = async (id: string) => {
    await deleteDoc(doc(db, "timeEntries", id));
  };

  const addTask = async (task: Omit<Task, "id">) => {
    await addDoc(collection(db, "tasks"), { ...task, createdAt: serverTimestamp() });
  };

  const updateTask = async (id: string, changes: Partial<Task>) => {
    await updateDoc(doc(db, "tasks", id), changes);
  };

  const deleteTask = async (id: string) => {
    await deleteDoc(doc(db, "tasks", id));
  };

  const openTasks  = tasks.filter(t => t.status !== "done").length;
  const todayHours = entries
    .filter(e => e.date === today())
    .reduce((s, e) => s + e.hours, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-white font-semibold text-lg">Time & Tasks</h3>
          <p className="text-gray-500 text-sm mt-0.5">Track work hours and manage client tasks</p>
        </div>
        <div className="flex gap-3">
          <div className="text-center bg-gray-900 border border-gray-800 rounded-xl px-4 py-2">
            <p className="text-white font-bold">{todayHours.toFixed(1)}h</p>
            <p className="text-gray-500 text-xs">today</p>
          </div>
          <div className="text-center bg-gray-900 border border-gray-800 rounded-xl px-4 py-2">
            <p className="text-white font-bold">{openTasks}</p>
            <p className="text-gray-500 text-xs">open tasks</p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {([["timesheet", "Time Sheet"], ["tasks", "Tasks"]] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              tab === id ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "timesheet" && (
        <div className="space-y-5">
          <Timer clients={clients} onLog={addEntry} />
          <div className="flex items-center justify-between">
            <SectionHeader title="Time Log" />
            <ManualEntryForm clients={clients} onLog={addEntry} />
          </div>
          <TimeEntries entries={entries} onDelete={deleteEntry} />
        </div>
      )}

      {tab === "tasks" && (
        <Tasks
          clients={clients}
          tasks={tasks}
          onAdd={addTask}
          onUpdate={updateTask}
          onDelete={deleteTask}
        />
      )}
    </div>
  );
}
