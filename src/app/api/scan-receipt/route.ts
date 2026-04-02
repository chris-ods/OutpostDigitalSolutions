import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const SYSTEM_PROMPT = `You are a receipt parser. Analyze the receipt image and extract the following fields.
Return ONLY a valid JSON object — no markdown, no prose, no code fences.

Required fields:
{
  "merchant": "string — store or vendor name",
  "date": "string — YYYY-MM-DD format. If year is missing, assume current year.",
  "subtotal": number,
  "tax": number,
  "tip": number,
  "total": number,
  "currency": "string — 3-letter ISO code, default USD",
  "category": "one of: Food & Dining | Travel | Transportation | Office Supplies | Utilities | Entertainment | Healthcare | Shopping | Other",
  "paymentMethod": "one of: Credit Card | Debit Card | Cash | Check | Apple Pay | Google Pay | Other",
  "items": [
    {
      "description": "string",
      "qty": number,
      "unitPrice": number,
      "total": number
    }
  ],
  "notes": "string — any relevant info not captured above, or empty string"
}

Rules:
- All numeric fields must be numbers (not strings).
- If a field cannot be determined, use 0 for numbers, "" for strings, [] for arrays.
- Do not invent data. Only extract what is visible on the receipt.
- For category, infer from the merchant type if the category is not explicit.`;

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

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
        { error: "Unsupported file type. Use JPG, PNG, WebP, or PDF." },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    fileData = Buffer.from(buffer).toString("base64");
    mimeType = file.type;
  } catch {
    return NextResponse.json(
      { error: "Failed to read uploaded file." },
      { status: 400 }
    );
  }

  try {
    const geminiRes = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: SYSTEM_PROMPT },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: fileData,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", errText);
      return NextResponse.json(
        { error: "Gemini API returned an error. Check server logs." },
        { status: 502 }
      );
    }

    const geminiData = await geminiRes.json();
    const rawText: string =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Strip any accidental markdown fences
    const cleaned = rawText
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse Gemini JSON response:", rawText);
      return NextResponse.json(
        { error: "Gemini returned unparseable JSON. Try a clearer image." },
        { status: 422 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("scan-receipt error:", err);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
