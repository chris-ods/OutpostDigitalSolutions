import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getApps } from "firebase-admin/app";
import {
  encryptFields, decryptFields, mask,
  IDENTITY_FIELDS, BANKING_FIELDS,
} from "../../../../lib/encryption";

// Ensure admin app is initialized (firebase-admin.ts does this)
import "../../../../lib/firebase-admin";

const db = getFirestore(getApps()[0]);

// ── Write encrypted secrets ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { uid, type, data, callerUid } = await req.json() as {
      uid: string;
      type: "identity" | "banking";
      data: Record<string, unknown>;
      callerUid: string;
    };

    if (!uid || !type || !data) {
      return NextResponse.json({ error: "Missing uid, type, or data" }, { status: 400 });
    }

    const fields = type === "identity" ? IDENTITY_FIELDS : BANKING_FIELDS;
    const encrypted = encryptFields(data, fields);

    await db.doc(`users/${uid}/secrets/${type}`).set(encrypted, { merge: true });

    // Denormalize birthday (MM-DD) to user profile for the birthdays feature
    if (type === "identity" && typeof data.dob === "string" && data.dob.length >= 5) {
      await db.doc(`users/${uid}`).update({ birthday: data.dob.slice(5) });
    }

    // Audit log
    await db.collection("auditLog").add({
      action: "secrets.write",
      targetUid: uid,
      secretType: type,
      callerUid: callerUid || "unknown",
      fieldsWritten: fields.filter(f => data[f]),
      timestamp: new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[secrets/write]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── Read secrets (masked or full) ──────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");
    const type = searchParams.get("type") as "identity" | "banking" | null;
    const reveal = searchParams.get("reveal") === "true";
    const callerUid = searchParams.get("callerUid") || "unknown";

    if (!uid || !type) {
      return NextResponse.json({ error: "Missing uid or type" }, { status: 400 });
    }

    const snap = await db.doc(`users/${uid}/secrets/${type}`).get();
    if (!snap.exists) {
      return NextResponse.json({ data: null });
    }

    const raw = snap.data() as Record<string, unknown>;
    const fields = type === "identity" ? IDENTITY_FIELDS : BANKING_FIELDS;

    if (reveal) {
      // Full decrypt — log the access
      const decrypted = decryptFields(raw, fields);

      await db.collection("auditLog").add({
        action: "secrets.reveal",
        targetUid: uid,
        secretType: type,
        callerUid,
        timestamp: new Date(),
      });

      return NextResponse.json({ data: decrypted });
    }

    // Masked read — decrypt then mask
    const decrypted = decryptFields(raw, fields);
    const masked: Record<string, unknown> = { ...decrypted };
    for (const f of fields) {
      const val = decrypted[f];
      if (typeof val === "string") {
        if (f === "ssn") masked[f] = mask(val, 4); // •••-••-1234
        else if (f === "routingNumber") masked[f] = mask(val, 4);
        else if (f === "accountNumber") masked[f] = mask(val, 4);
        else if (f === "dob") masked[f] = val; // DOB shown in full (not sensitive like SSN)
        else masked[f] = mask(val, 6); // address fields show more
      }
    }

    return NextResponse.json({ data: masked });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[secrets/read]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
