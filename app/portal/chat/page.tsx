"use client";

import { ChatApp } from "ods-ui-library";
import { db, storage } from "../../../lib/firebase";
import { useUserClaim } from "../../../lib/hooks/useUserClaim";
import { isAdminLevel } from "../../../lib/types";
import { PageSpinner } from "../../../lib/components/Spinner";

export default function ChatPage() {
  const claim = useUserClaim();

  if (claim.loading) return <PageSpinner />;

  if (!claim.uid || !claim.profile) return null;

  const p = claim.profile;

  return (
    <ChatApp
      db={db}
      storage={storage}
      currentUser={{
        uid:         claim.uid,
        firstName:   p.firstName,
        lastName:    p.lastName,
        photoURL:    p.photoURL,
        role:        p.role,
        teamNumber:  p.teamNumber,
        active:      p.active,
        level:       p.level,
      }}
      isAdminLevel={isAdminLevel}
    />
  );
}
