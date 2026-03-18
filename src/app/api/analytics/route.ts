import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { NextResponse } from "next/server";

function getClient() {
  const email = process.env.GA_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GA_PRIVATE_KEY;

  if (!email || !rawKey) {
    throw new Error("Missing GA_SERVICE_ACCOUNT_EMAIL or GA_PRIVATE_KEY env vars");
  }

  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: email,
      private_key: rawKey.replace(/\\n/g, "\n"),
    },
  });
}

export async function GET() {
  const propertyId = process.env.GA_PROPERTY_ID;
  if (!propertyId) {
    return NextResponse.json({ error: "Missing GA_PROPERTY_ID env var" }, { status: 500 });
  }

  try {
    const client = getClient();
    const property = `properties/${propertyId}`;

    const [overviewRes, topPagesRes, dailyRes, channelsRes] = await Promise.all([
      client.runReport({
        property,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "engagementRate" },
        ],
      }),
      client.runReport({
        property,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 7,
      }),
      client.runReport({
        property,
        dateRanges: [{ startDate: "14daysAgo", endDate: "today" }],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
      client.runReport({
        property,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 6,
      }),
    ]);

    const mv = overviewRes[0]?.rows?.[0]?.metricValues ?? [];
    const overview = {
      activeUsers: mv[0]?.value ?? "0",
      sessions: mv[1]?.value ?? "0",
      pageViews: mv[2]?.value ?? "0",
      engagementRate: mv[3]?.value ?? "0",
    };

    const topPages = (topPagesRes[0]?.rows ?? []).map((row) => ({
      page: row.dimensionValues?.[0]?.value ?? "/",
      views: parseInt(row.metricValues?.[0]?.value ?? "0"),
    }));

    const dailyUsers = (dailyRes[0]?.rows ?? []).map((row) => {
      const raw = row.dimensionValues?.[0]?.value ?? "00000000";
      const date = `${raw.slice(4, 6)}/${raw.slice(6, 8)}`;
      return { date, users: parseInt(row.metricValues?.[0]?.value ?? "0") };
    });

    const channels = (channelsRes[0]?.rows ?? []).map((row) => ({
      channel: row.dimensionValues?.[0]?.value ?? "Unknown",
      sessions: parseInt(row.metricValues?.[0]?.value ?? "0"),
    }));

    return NextResponse.json({ overview, topPages, dailyUsers, channels });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[analytics route]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
