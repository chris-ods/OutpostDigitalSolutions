import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// gemini-2.0-flash: fast, multimodal, supports images and PDFs
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const SYSTEM_PROMPT = `You are a receipt data extractor. Analyze the receipt image or document and extract structured data.

Return ONLY a raw JSON object with no markdown, no code fences, no prose — just the JSON.

Schema:
{
  "merchant": "store or vendor name (string)",
  "date": "YYYY-MM-DD (string, assume current year if missing)",
  "subtotal": number,
  "tax": number,
  "tip": number,
  "total": number,
  "currency": "3-letter ISO code, default USD (string)",
  "category": "exactly one of: Food & Dining, Travel, Transportation, Office Supplies, Utilities, Entertainment, Healthcare, Shopping, Other",
  "paymentMethod": "exactly one of: Credit Card, Debit Card, Cash, Check, Apple Pay, Google Pay, Other",
  "items": [
    { "description": "string", "qty": number, "unitPrice": number, "total": number }
  ],
  "notes": "any extra context not captured above, or empty string"
}

Rules:
- All number fields must be numbers, not strings.
- Use 0 for unknown numbers, "" for unknown strings, [] for unknown arrays.
- Only extract what is actually visible on the receipt — do not invent data.
- Infer category from the merchant type if not explicit.`;

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not set on the server. Add it to your .env.local or Firebase environment variables." },
      { status: 500 }
    );
  }

  // ── Parse the uploaded file ────────────────────────────────────────────────
  let fileData: string;
  let mimeType: string;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a JPG, PNG, WebP, or PDF." },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    fileData = Buffer.from(buffer).toString("base64");
    mimeType = file.type;
  } catch {
    return NextResponse.json(
      { error: "Could not read the uploaded file." },
      { status: 400 }
    );
  }

  // ── Call Gemini ────────────────────────────────────────────────────────────
  try {
    const geminiRes = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: SYSTEM_PROMPT },
              { inline_data: { mime_type: mimeType, data: fileData } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
        },
      }),
    });

    if (!geminiRes.ok) {
      // Surface the real Gemini error so it's visible in the UI
      let detail = `Gemini ${geminiRes.status}`;
      try {
        const body = await geminiRes.json();
        detail = body?.error?.message ?? JSON.stringify(body);
      } catch {
        detail = await geminiRes.text().catch(() => detail);
      }
      console.error("Gemini API error:", detail);
      return NextResponse.json({ error: `Gemini error: ${detail}` }, { status: 502 });
    }

    const geminiData = await geminiRes.json();
    const rawText: string =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!rawText) {
      const finishReason = geminiData?.candidates?.[0]?.finishReason ?? "unknown";
      console.error("Gemini returned empty text. finishReason:", finishReason, JSON.stringify(geminiData));
      return NextResponse.json(
        { error: `Gemini returned no content (finishReason: ${finishReason}). Try a clearer image.` },
        { status: 422 }
      );
    }

    // Strip any accidental markdown code fences
    const cleaned = rawText
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse Gemini response as JSON:", rawText);
      return NextResponse.json(
        { error: "Gemini response could not be parsed as JSON. Try a clearer or higher-resolution image." },
        { status: 422 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("scan-receipt unexpected error:", msg);
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 });
  }
}
