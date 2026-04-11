"use client";

import { useReducer } from "react";
import { odsReducer } from "./data/types";
import type { OdsState } from "./data/types";
import { mockMembers } from "./data/mockMembers";
import { mockClients } from "./data/mockClients";
import { mockProjects } from "./data/mockProjects";
import { mockTasks } from "./data/mockTasks";
import { mockActivity } from "./data/mockActivity";
import { OdsLayout } from "./components/OdsLayout";

const initialState: OdsState = {
  members: mockMembers,
  clients: mockClients,
  projects: mockProjects,
  tasks: mockTasks,
  activities: mockActivity,
};

export default function OdsOwnerPortalDemo() {
  const [state, dispatch] = useReducer(odsReducer, initialState);

  return <OdsLayout state={state} dispatch={dispatch} />;
}
