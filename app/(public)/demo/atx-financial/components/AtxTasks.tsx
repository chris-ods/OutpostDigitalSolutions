"use client";

import React, { useState, useMemo, useCallback } from "react";
import type {
  AtxState,
  AtxAction,
  AtxTask,
} from "../data/types";
import { PRIORITY_COLORS } from "../data/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function uid(): string {
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const STATUS_LABELS: Record<AtxTask["status"], string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

const STATUS_ORDER: AtxTask["status"][] = ["todo", "in_progress", "done"];
const PRIORITY_OPTIONS: AtxTask["priority"][] = ["low", "medium", "high", "urgent"];

const PRIORITY_LABELS: Record<AtxTask["priority"], string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

function isOverdue(task: AtxTask): boolean {
  if (task.status === "done") return false;
  return new Date(task.dueDate) < new Date(new Date().toISOString().slice(0, 10));
}

// ── Component ───────────────────────────────────────────────────────────────

export function AtxTasks({
  state,
  dispatch,
}: {
  state: AtxState;
  dispatch: React.Dispatch<AtxAction>;
}) {
  const { tasks, agents, contacts } = state;

  const [statusFilter, setStatusFilter] = useState<"all" | AtxTask["status"]>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | AtxTask["priority"]>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<AtxTask | null>(null);

  // Filtered + grouped tasks
  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (statusFilter !== "all") result = result.filter((t) => t.status === statusFilter);
    if (priorityFilter !== "all") result = result.filter((t) => t.priority === priorityFilter);
    return result;
  }, [tasks, statusFilter, priorityFilter]);

  const groupedTasks = useMemo(() => {
    const groups: Record<AtxTask["status"], AtxTask[]> = { todo: [], in_progress: [], done: [] };
    for (const t of filteredTasks) groups[t.status].push(t);
    // Sort within groups: overdue first, then by due date
    for (const s of STATUS_ORDER) {
      groups[s].sort((a, b) => {
        const aOver = isOverdue(a) ? 0 : 1;
        const bOver = isOverdue(b) ? 0 : 1;
        if (aOver !== bOver) return aOver - bOver;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    }
    return groups;
  }, [filteredTasks]);

  const toggleStatus = useCallback(
    (id: string) => dispatch({ type: "TOGGLE_TASK_STATUS", id }),
    [dispatch]
  );

  // Form state
  const emptyForm = {
    title: "",
    description: "",
    priority: "medium" as AtxTask["priority"],
    dueDate: "",
    assigneeId: "",
    relatedContactId: "",
    relatedDealId: "",
  };

  const [form, setForm] = useState(emptyForm);

  const openAddForm = useCallback(() => {
    setForm(emptyForm);
    setEditingTask(null);
    setShowForm(true);
  }, []);

  const openEditForm = useCallback((task: AtxTask) => {
    setForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      assigneeId: task.assigneeId,
      relatedContactId: task.relatedContactId || "",
      relatedDealId: task.relatedDealId || "",
    });
    setEditingTask(task);
    setShowForm(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!form.title.trim()) return;

    const assignee = agents.find((a) => a.id === form.assigneeId);
    const assigneeName = assignee ? `${assignee.firstName} ${assignee.lastName}` : "";

    if (editingTask) {
      dispatch({
        type: "UPDATE_TASK",
        id: editingTask.id,
        updates: {
          title: form.title,
          description: form.description,
          priority: form.priority,
          dueDate: form.dueDate,
          assigneeId: form.assigneeId,
          assigneeName,
          relatedContactId: form.relatedContactId || undefined,
          relatedDealId: form.relatedDealId || undefined,
        },
      });
    } else {
      dispatch({
        type: "ADD_TASK",
        task: {
          id: uid(),
          title: form.title,
          description: form.description,
          status: "todo",
          priority: form.priority,
          dueDate: form.dueDate,
          assigneeId: form.assigneeId,
          assigneeName,
          relatedContactId: form.relatedContactId || undefined,
          relatedDealId: form.relatedDealId || undefined,
          createdAt: new Date().toISOString(),
        },
      });
    }
    setShowForm(false);
    setEditingTask(null);
  }, [form, editingTask, agents, dispatch]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-gray-700 overflow-hidden">
          {(["all", ...STATUS_ORDER] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-[11px] font-medium transition-colors ${
                statusFilter === s
                  ? "bg-[#d4a843] text-[#0a1628]"
                  : "bg-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              {s === "all" ? "All" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)}
          className="rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-1.5 text-xs text-gray-300 outline-none focus:border-[#d4a843]/50"
        >
          <option value="all">All Priorities</option>
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
          ))}
        </select>

        <div className="flex-1" />

        <button
          onClick={openAddForm}
          className="rounded-lg bg-[#d4a843] px-4 py-2 text-xs font-semibold text-[#0a1628] hover:bg-[#c49a3a] transition-colors"
        >
          + Add Task
        </button>
      </div>

      {/* Task groups */}
      <div className="space-y-6">
        {STATUS_ORDER.map((status) => {
          const group = groupedTasks[status];
          if (statusFilter !== "all" && statusFilter !== status) return null;
          return (
            <div key={status}>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    status === "done" ? "bg-green-500" : status === "in_progress" ? "bg-blue-500" : "bg-gray-500"
                  }`}
                />
                <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  {STATUS_LABELS[status]}
                </h3>
                <span className="text-[10px] text-gray-600">({group.length})</span>
              </div>

              {group.length === 0 ? (
                <p className="text-xs text-gray-600 pl-5">No tasks.</p>
              ) : (
                <div className="space-y-2">
                  {group.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={toggleStatus}
                      onEdit={openEditForm}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-md bg-[#0f1a2e] border border-gray-700 rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-semibold text-gray-100 mb-4">
              {editingTask ? "Edit Task" : "Add Task"}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 outline-none focus:border-[#d4a843]/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 outline-none focus:border-[#d4a843]/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as AtxTask["priority"] })}
                    className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 outline-none focus:border-[#d4a843]/50"
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Due Date</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 outline-none focus:border-[#d4a843]/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Assignee</label>
                <select
                  value={form.assigneeId}
                  onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
                  className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 outline-none focus:border-[#d4a843]/50"
                >
                  <option value="">Unassigned</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Related Contact</label>
                <select
                  value={form.relatedContactId}
                  onChange={(e) => setForm({ ...form, relatedContactId: e.target.value })}
                  className="w-full rounded-lg bg-[#0d1526] border border-gray-700 px-3 py-2 text-xs text-gray-200 outline-none focus:border-[#d4a843]/50"
                >
                  <option value="">None</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => { setShowForm(false); setEditingTask(null); }}
                className="rounded-lg border border-gray-600 px-4 py-2 text-xs text-gray-300 hover:bg-gray-700/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded-lg bg-[#d4a843] px-4 py-2 text-xs font-semibold text-[#0a1628] hover:bg-[#c49a3a] transition-colors"
              >
                {editingTask ? "Save Changes" : "Add Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Task Card ───────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onToggle,
  onEdit,
}: {
  task: AtxTask;
  onToggle: (id: string) => void;
  onEdit: (task: AtxTask) => void;
}) {
  const overdue = isOverdue(task);

  return (
    <div
      className={`rounded-lg border p-3 flex items-start gap-3 cursor-pointer transition-colors ${
        overdue
          ? "border-red-600/50 bg-red-900/10"
          : "border-gray-700/50 bg-[#0f1a2e]/60 hover:bg-[#1a2a4a]/40"
      }`}
      onClick={() => onEdit(task)}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
        className={`mt-0.5 w-4.5 h-4.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
          task.status === "done"
            ? "bg-green-500 border-green-500 text-white"
            : task.status === "in_progress"
            ? "bg-blue-500/20 border-blue-500"
            : "bg-transparent border-gray-600 hover:border-gray-400"
        }`}
        style={{ width: "18px", height: "18px" }}
      >
        {task.status === "done" && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {task.status === "in_progress" && (
          <span className="w-2 h-2 rounded-full bg-blue-400" />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium leading-snug ${task.status === "done" ? "text-gray-500 line-through" : "text-gray-200"}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold border ${PRIORITY_COLORS[task.priority]}`}>
            {PRIORITY_LABELS[task.priority]}
          </span>
          {task.dueDate && (
            <span className={`text-[10px] ${overdue ? "text-red-400 font-semibold" : "text-gray-500"}`}>
              {overdue ? "Overdue: " : "Due: "}{task.dueDate}
            </span>
          )}
          {task.assigneeName && (
            <span className="w-5 h-5 rounded-full bg-[#1a2a4a] border border-gray-600 flex items-center justify-center text-[8px] font-bold text-gray-400 shrink-0">
              {task.assigneeName
                .split(" ")
                .map((n) => n.charAt(0))
                .join("")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
