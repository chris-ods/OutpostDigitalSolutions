import { NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";

const GA4_PROPERTY_ID = "525314290";
const GA4_URL = `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`;

async function getAccessToken(): Promise<string> {
  const raw = process.env.GA4_SERVICE_ACCOUNT;
  if (!raw) throw new Error("GA4_SERVICE_ACCOUNT secret is not configured.");

  const credentials = JSON.parse(raw);
  const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  if (!token) throw new Error("Failed to obtain access token.");
  return token;
}

export async function GET() {
  try {
    const token = await getAccessToken();

    const res = await fetch(GA4_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: "29daysAgo", endDate: "yesterday" }],
        dimensions: [{ name: "date" }, { name: "platform" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
      // Never cache at the fetch level — we want fresh data each page load
      cache: "no-store",
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GA4 API error ${res.status}: ${err}`);
    }

    const json = await res.json();

    // Build a map: date (YYYYMMDD) -> { web, ios, android, total }
    const byDate: Record<string, { web: number; ios: number; android: number; total: number }> = {};

    for (const row of json.rows ?? []) {
      const date: string = row.dimensionValues[0].value;
      const platform: string = row.dimensionValues[1].value.toLowerCase();
      const users = parseInt(row.metricValues[0].value, 10) || 0;

      if (!byDate[date]) byDate[date] = { web: 0, ios: 0, android: 0, total: 0 };

      if (platform === "web")           byDate[date].web     += users;
      else if (platform === "ios")      byDate[date].ios     += users;
      else if (platform === "android")  byDate[date].android += users;

      byDate[date].total += users;
    }

    const rows = Object.entries(byDate)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ rows, fetchedAt: new Date().toISOString() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[analytics]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
