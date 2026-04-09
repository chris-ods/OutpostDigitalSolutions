/**
 * useClientListMock
 *
 * Local-state version of useClientList — same interface, no Firebase.
 * Use this in Storybook stories and unit tests.
 *
 * Drop-in swap:
 *   // Production portal
 *   const props = useClientList("clients");
 *
 *   // Storybook / tests
 *   const props = useClientListMock("clients", { initialClients: SAMPLE_CLIENTS });
 */

import { useState, useCallback } from "react";
import type { OdsRecord, OdsListView, ChangeRecord, PermissionsMatrix } from "../ClientList";
import { DEFAULT_PERMISSIONS } from "../ClientList";
import type { UseClientListResult } from "./useClientList";

export interface MockOptions {
  /** Seed client records. */
  initialClients?: OdsRecord[];
  /** Seed saved views. */
  initialViews?: OdsListView[];
  /** Initial list title. Defaults to collectionId. */
  initialTitle?: string;
  /** Seed permissions matrix. Defaults to DEFAULT_PERMISSIONS. */
  initialPermissions?: PermissionsMatrix;
  /** Simulate initial loading state. */
  loading?: boolean;
  /** Simulate a paginated list with more records available. */
  hasMore?: boolean;
}

/**
 * @param collectionId  Ignored for mock — only here so you can swap
 *                      `useClientList` ↔ `useClientListMock` without changing call sites.
 */
export function useClientListMock(
  _collectionId: string,
  options: MockOptions = {},
): UseClientListResult {
  const {
    initialClients = [],
    initialViews = [],
    initialTitle,
    initialPermissions = DEFAULT_PERMISSIONS,
    loading: initialLoading = false,
    hasMore: initialHasMore = false,
  } = options;

  const [clients, setClients] = useState<OdsRecord[]>(initialClients);
  const [views, setViews] = useState<OdsListView[]>(initialViews);
  const [listTitle, setListTitle] = useState(initialTitle ?? _collectionId);
  const [permissions, setPermissions] = useState<PermissionsMatrix>(initialPermissions);
  const [loading] = useState(initialLoading);
  const [hasMore] = useState(initialHasMore);

  const onSave = useCallback(async (
    id: string,
    field: string,
    value: string | number,
    updaterName: string,
    fromValue?: string | number,
  ) => {
    const changeEntry: ChangeRecord = {
      at: { seconds: Math.floor(Date.now() / 1000) },
      by: updaterName,
      field,
      from: String(fromValue ?? ""),
      to: String(value),
    };
    setClients((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              [field]: value,
              updatedByName: updaterName,
              updatedAt: changeEntry.at,
              changeLog: [...(c.changeLog ?? []), changeEntry],
            }
          : c,
      ),
    );
  }, []);

  const onSaveView = useCallback(async (view: Omit<OdsListView, "id">): Promise<string> => {
    const id = `mock-view-${Date.now()}`;
    setViews((prev) => [...prev, { id, ...view }]);
    return id;
  }, []);

  const onDeleteView = useCallback(async (id: string) => {
    setViews((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const onRenameList = useCallback(async (name: string) => {
    setListTitle(name);
  }, []);

  const onSavePermissions = useCallback(async (matrix: PermissionsMatrix) => {
    setPermissions(matrix);
  }, []);

  const onLoadMore = useCallback(async () => {}, []);

  return {
    data: clients,
    views,
    permissions,
    loading,
    hasMore,
    listTitle,
    onSave,
    onSaveView,
    onDeleteView,
    onSavePermissions,
    onRenameList,
    onLoadMore,
  };
}
