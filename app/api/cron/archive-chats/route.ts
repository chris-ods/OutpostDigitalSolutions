import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getApps } from "firebase-admin/app";
import "../../../../lib/firebase-admin";

const db = getFirestore(getApps()[0]);

/**
 * Archive and clear all chat messages.
 * Called by Cloud Scheduler every Sunday at 00:00 AM CT.
 *
 * Flow:
 * 1. Read all chats
 * 2. For each chat, read all messages
 * 3. Write messages to chatArchives/{chatId}/weeks/{weekId}
 * 4. Delete all messages from the live chat
 * 5. Update the chat doc (clear lastMessage, reset unread)
 *
 * Auth: requires CRON_SECRET header to prevent unauthorized access.
 */
export async function POST(req: NextRequest) {
  // Verify cron secret
  const secret = req.headers.get("x-cron-secret") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const weekId = now.toISOString().split("T")[0]; // e.g. "2026-04-06"
    let totalArchived = 0;
    let chatsProcessed = 0;

    // Get all chat documents
    const chatsSnap = await db.collection("chats").get();

    for (const chatDoc of chatsSnap.docs) {
      const chatId = chatDoc.id;

      // Get all messages in this chat
      const messagesSnap = await db
        .collection("chats").doc(chatId)
        .collection("messages")
        .orderBy("createdAt", "asc")
        .get();

      if (messagesSnap.empty) continue;

      // Archive messages in batches
      const messages = messagesSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      }));

      // Write archive document with all messages for this week
      await db
        .collection("chatArchives").doc(chatId)
        .collection("weeks").doc(weekId)
        .set({
          chatId,
          archivedAt: now,
          messageCount: messages.length,
          messages,
        });

      // Delete messages in batches (max 500 per batch)
      const BATCH_LIMIT = 499;
      for (let i = 0; i < messagesSnap.docs.length; i += BATCH_LIMIT) {
        const batch = db.batch();
        messagesSnap.docs.slice(i, i + BATCH_LIMIT).forEach(d => {
          batch.delete(d.ref);
        });
        await batch.commit();
      }

      // Reset chat metadata
      await chatDoc.ref.update({
        lastMessage: null,
        lastMessageAt: null,
        lastMessageBy: null,
      });

      totalArchived += messages.length;
      chatsProcessed++;
    }

    // Audit log
    await db.collection("auditLog").add({
      action: "chats.archive",
      weekId,
      chatsProcessed,
      totalArchived,
      timestamp: now,
    });

    return NextResponse.json({
      ok: true,
      weekId,
      chatsProcessed,
      totalArchived,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[archive-chats]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
