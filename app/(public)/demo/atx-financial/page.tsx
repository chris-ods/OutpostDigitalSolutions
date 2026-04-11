"use client";

import { useReducer } from "react";
import { atxReducer } from "./data/types";
import type { AtxState } from "./data/types";
import { mockAgents } from "./data/mockAgents";
import { mockContacts } from "./data/mockContacts";
import { mockDeals } from "./data/mockDeals";
import { mockTasks } from "./data/mockTasks";
import { mockActivity } from "./data/mockActivity";
import { AtxLayout } from "./components/AtxLayout";

const initialState: AtxState = {
  agents: mockAgents,
  contacts: mockContacts,
  deals: mockDeals,
  tasks: mockTasks,
  activities: mockActivity,
};

export default function AtxFinancialDemo() {
  const [state, dispatch] = useReducer(atxReducer, initialState);

  return <AtxLayout state={state} dispatch={dispatch} />;
}
