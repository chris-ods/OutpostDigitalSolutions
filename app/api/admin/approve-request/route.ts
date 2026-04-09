import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "../../../../lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getApps } from "firebase-admin/app";

const db = getFirestore(getApps()[0]);

export async function POST(req: NextRequest) {
  try {
    const { requestId } = await req.json() as { requestId: string };
    if (!requestId) return NextResponse.json({ error: "Missing requestId" }, { status: 400 });

    // 1. Load the onboarding request
    const reqDoc = await db.doc(`onboardingRequests/${requestId}`).get();
    if (!reqDoc.exists) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    const data = reqDoc.data()!;

    const email = (data.email ?? "").trim().toLowerCase();
    const firstName = (data.firstName ?? "").trim();
    const lastName = (data.lastName ?? "").trim();
    const phone = (data.phone ?? "").trim();
    const teamNumber = data.teamNumber ?? 0;
    const comments = (data.comments ?? "").trim();

    if (!email) return NextResponse.json({ error: "No email on request" }, { status: 400 });

    // 2. Check if Firebase Auth user already exists
    let uid: string;
    let alreadyExists = false;
    try {
      const existing = await adminAuth.getUserByEmail(email);
      uid = existing.uid;
      alreadyExists = true;
    } catch {
      // User doesn't exist — create one with a temp password
      const tempPassword = `ODS-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const newUser = await adminAuth.createUser({
        email,
        password: tempPassword,
        displayName: `${firstName} ${lastName}`.trim(),
      });
      uid = newUser.uid;
    }

    // 3. Generate contractor ID
    const tt = String(teamNumber).padStart(2, "0");
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = String(now.getFullYear());
    const ii = ((firstName.charAt(0) || "X") + (lastName.charAt(0) || "X")).toUpperCase();
    let contractorId = `${tt}${dd}${mm}${yyyy}${ii}`;

    // Check uniqueness
    const idDoc = await db.doc(`contractorIds/${contractorId}`).get();
    if (idDoc.exists) {
      for (let n = 2; n <= 99; n++) {
        const candidate = `${contractorId}${n}`;
        const snap = await db.doc(`contractorIds/${candidate}`).get();
        if (!snap.exists) { contractorId = candidate; break; }
      }
    }
    // Claim the ID
    await db.doc(`contractorIds/${contractorId}`).set({ uid, claimedAt: new Date() });

    // 4. Create or update user profile (don't overwrite if already exists)
    const userRef = db.doc(`users/${uid}`);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      await userRef.set({
        firstName,
        lastName,
        email,
        phone,
        comments,
        role: "rep",
        teamNumber,
        contractorId,
        active: true,
        photoURL: data.photoDataURL || "",
        createdAt: new Date(),
        mustChangePassword: false,
        level: 1,
        companyRole: "",
        npnPersonal: "",
        hideFromPayroll: false,
        subRole: "",
        acceptedTermsVersion: 0,
        acceptedTermsAt: null,
        onboardingPacketSigned: false,
        onboardingSignedAt: null,
      });
    }

    // 5. Auto-join team chat channel
    try {
      const channelQuery = await db.collection("chatChannels")
        .where("teamNumber", "==", teamNumber)
        .limit(1)
        .get();
      if (!channelQuery.empty) {
        const channelRef = channelQuery.docs[0].ref;
        const channelData = channelQuery.docs[0].data();
        const members: string[] = channelData.members ?? [];
        if (!members.includes(uid)) {
          await channelRef.update({ members: [...members, uid] });
        }
      }
    } catch { /* chat channel join is best-effort */ }

    // 6. Update the request status
    await db.doc(`onboardingRequests/${requestId}`).update({
      status: "approved",
      approvedAt: new Date(),
      approvedUid: uid,
    });

    // 7. Generate password reset link so user can set their password
    const resetLink = await adminAuth.generatePasswordResetLink(email);

    return NextResponse.json({
      ok: true,
      uid,
      contractorId,
      alreadyExists,
      resetLink,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[approve-request]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
