"use client";

import { LeaderboardApp } from "ods-ui-library";
import { db } from "../../../lib/firebase";
import { useUserClaim } from "../../../lib/hooks/useUserClaim";
import { isAdminLevel, CAREER_LEVELS } from "../../../lib/types";
import { useTeamColors } from "../../../lib/teamColorContext";
import { PageSpinner } from "../../../lib/components/Spinner";

export default function LeaderboardPage() {
  const claim = useUserClaim();
  const teamColors = useTeamColors();

  if (claim.loading) return <PageSpinner />;

  const isOwner =
    claim.profile?.role === "owner" || claim.profile?.role === "developer";

  return (
    <LeaderboardApp
      db={db}
      isOwner={isOwner}
      isAdminLevel={isAdminLevel}
      careerLevels={CAREER_LEVELS}
      teamColors={teamColors}
    />
  );
}
