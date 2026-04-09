import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "../../../../lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { uid, disabled } = await req.json() as { uid: string; disabled: boolean };
    if (!uid || typeof disabled !== "boolean") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    await adminAuth.updateUser(uid, { disabled });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
