import { NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";

const PROPERTY_ID = "525314290";
const BATCH_URL = `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:batchRunReports`;

async function getAccessToken(): Promise<string> {
  const raw = process.env.GA4_SERVICE_ACCOUNT;
  if (!raw) throw new Error("GA4_SERVICE_ACCOUNT secret is not configured.");
  const auth = new GoogleAuth({
    credentials: JSON.parse(raw),
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  if (!token) throw new Error("Failed to obtain access token.");
  return token;
}

function iv(row: { metricValues: { value: string }[] }, index = 0): number {
  return parseInt(row?.metricValues?.[index]?.value || "0", 10) || 0;
}
function fv(row: { metricValues: { value: string }[] }, index = 0): number {
  return parseFloat(row?.metricValues?.[index]?.value || "0") || 0;
}

export async function GET() {
  try {
    const token = await getAccessToken();

    const res = await fetch(BATCH_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        requests: [
          // 0 — MAU + session metrics (28-day window)
          {
            dateRanges: [{ startDate: "27daysAgo", endDate: "yesterday" }],
            metrics: [
              { name: "activeUsers" },
              { name: "newUsers" },
              { name: "sessions" },
              { name: "averageSessionDuration" },
            ],
          },
          // 1 — DAU (yesterday)
          {
            dateRanges: [{ startDate: "yesterday", endDate: "yesterday" }],
            metrics: [{ name: "activeUsers" }],
          },
          // 2 — New users this week (last 7 days)
          {
            dateRanges: [{ startDate: "6daysAgo", endDate: "yesterday" }],
            metrics: [{ name: "newUsers" }],
          },
          // 3 — New users previous week (for growth % comparison)
          {
            dateRanges: [{ startDate: "13daysAgo", endDate: "7daysAgo" }],
            metrics: [{ name: "newUsers" }],
          },
          // 4 — Platform breakdown (28 days, unique users per platform)
          {
            dateRanges: [{ startDate: "27daysAgo", endDate: "yesterday" }],
            dimensions: [{ name: "platform" }],
            metrics: [{ name: "activeUsers" }],
          },
          // 5 — Daily data by platform, last 56 days (for chart + trend)
          {
            dateRanges: [{ startDate: "55daysAgo", endDate: "yesterday" }],
            dimensions: [{ name: "date" }, { name: "platform" }],
            metrics: [{ name: "activeUsers" }, { name: "newUsers" }],
            orderBys: [{ dimension: { dimensionName: "date" } }],
          },
          // 6 — Top 5 countries (28 days)
          {
            dateRanges: [{ startDate: "27daysAgo", endDate: "yesterday" }],
            dimensions: [{ name: "country" }],
            metrics: [{ name: "activeUsers" }],
            orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
            limit: 5,
          },
        ],
      }),
    });

    if (!res.ok) throw new Error(`GA4 batch error ${res.status}: ${await res.text()}`);
    const batch = await res.json();
    const [mauR, dauR, thisWeekR, lastWeekR, platformR, dailyR, countriesR] = batch.reports ?? [];

    // — Summary metrics —
    const mauRow = mauR?.rows?.[0];
    const mau              = mauRow ? iv(mauRow, 0) : 0;
    const monthNewUsers    = mauRow ? iv(mauRow, 1) : 0;
    const monthSessions    = mauRow ? iv(mauRow, 2) : 0;
    const avgSessionSec    = mauRow ? fv(mauRow, 3) : 0;
    const avgSessionMin    = Math.round((avgSessionSec / 60) * 10) / 10;

    const dau = dauR?.rows?.[0] ? iv(dauR.rows[0], 0) : 0;
    const dauMauRatio = mau > 0 ? Math.round((dau / mau) * 100) : 0;

    const newUsersThisWeek = thisWeekR?.rows?.[0] ? iv(thisWeekR.rows[0], 0) : 0;
    const newUsersLastWeek = lastWeekR?.rows?.[0] ? iv(lastWeekR.rows[0], 0) : 0;
    const weekGrowthPct =
      newUsersLastWeek > 0
        ? Math.round(((newUsersThisWeek - newUsersLastWeek) / newUsersLastWeek) * 100)
        : null;

    // — Platform breakdown —
    const rawPlatforms = (platformR?.rows ?? []).map((r: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
      name: r.dimensionValues[0].value,
      users: iv(r, 0),
    }));
    const totalPlatformUsers = rawPlatforms.reduce((s: number, p: { users: number }) => s + p.users, 0);
    const platforms = rawPlatforms
      .map((p: { name: string; users: number }) => ({
        name: p.name,
        users: p.users,
        pct: totalPlatformUsers > 0 ? Math.round((p.users / totalPlatformUsers) * 100) : 0,
      }))
      .sort((a: { users: number }, b: { users: number }) => b.users - a.users);

    // — Daily data (date × platform aggregation) —
    const byDate: Record<string, { web: number; ios: number; android: number; total: number; newUsers: number }> = {};
    for (const row of dailyR?.rows ?? []) {
      const date: string = row.dimensionValues[0].value;
      const platform: string = row.dimensionValues[1].value.toLowerCase();
      const active = iv(row, 0);
      const newU   = iv(row, 1);
      if (!byDate[date]) byDate[date] = { web: 0, ios: 0, android: 0, total: 0, newUsers: 0 };
      if (platform === "web")          byDate[date].web     += active;
      else if (platform === "ios")     byDate[date].ios     += active;
      else if (platform === "android") byDate[date].android += active;
      byDate[date].total    += active;
      byDate[date].newUsers += newU;
    }
    const daily = Object.entries(byDate)
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // — Weekly trend (8 weeks from the last 56 days of daily data) —
    const last56 = daily.slice(-56);
    const weeklyTrend: { weekStart: string; newUsers: number; avgDau: number }[] = [];
    for (let i = 0; i < last56.length; i += 7) {
      const week = last56.slice(i, i + 7);
      if (week.length) {
        weeklyTrend.push({
          weekStart: week[0].date,
          newUsers: week.reduce((s, d) => s + d.newUsers, 0),
          avgDau: Math.round(week.reduce((s, d) => s + d.total, 0) / week.length),
        });
      }
    }

    // — Top countries —
    const topCountries = (countriesR?.rows ?? []).slice(0, 5).map((r: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
      country: r.dimensionValues[0].value,
      users: iv(r, 0),
    }));

    return NextResponse.json({
      summary: {
        mau, dau, dauMauRatio,
        newUsersThisWeek, newUsersLastWeek, weekGrowthPct,
        monthNewUsers, monthSessions, avgSessionMin,
      },
      platforms,
      weeklyTrend,
      topCountries,
      daily: daily.slice(-30), // last 30 days for the reports table
      fetchedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[analytics]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
