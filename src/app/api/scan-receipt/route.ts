import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

// Models to try in order — newest first, stops at first that works
const MODEL_CANDIDATES = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.5-flash-preview-05-20",
  "gemini-2.5-flash-preview-04-17",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
];

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
  "category": "exactly one of: AI & API Services, Software & Subscriptions, Cloud & Infrastructure, Hardware & Equipment, Contractors & Freelancers, Marketing & Advertising, Travel & Lodging, Meals & Entertainment, Education & Training, Legal & Professional, Office & Supplies, Utilities & Internet, Other",
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

async function tryModel(
  model: string,
  mimeType: string,
  fileData: string
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; error: string; notAvailable: boolean }> {
  const url = `${BASE_URL}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  let res: Response;
  try {
    res = await fetch(url, {
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
        generationConfig: { temperature: 0.1 },
      }),
    });
  } catch (err) {
    return { ok: false, error: String(err), notAvailable: false };
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body?.error?.message ?? JSON.stringify(body);
    } catch {
      detail = await res.text().catch(() => detail);
    }
    // "not found" or "no longer available" = skip to next model
    const notAvailable =
      detail.includes("not found") ||
      detail.includes("no longer available") ||
      detail.includes("not supported");
    return { ok: false, error: detail, notAvailable };
  }

  const geminiData = await res.json();
  const rawText: string =
    geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  if (!rawText) {
    const reason = geminiData?.candidates?.[0]?.finishReason ?? "unknown";
    return { ok: false, error: `Empty response (finishReason: ${reason})`, notAvailable: false };
  }

  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    return { ok: true, data: parsed };
  } catch {
    return { ok: false, error: `Could not parse JSON: ${rawText.slice(0, 200)}`, notAvailable: false };
  }
}

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not set on the server. Add it to your .env.local or Firebase environment variables." },
      { status: 500 }
    );
  }

  // ── Parse upload ───────────────────────────────────────────────────────────
  let fileData: string;
  let mimeType: string;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
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
    return NextResponse.json({ error: "Could not read the uploaded file." }, { status: 400 });
  }

  // ── Try models in order ────────────────────────────────────────────────────
  const errors: string[] = [];

  for (const model of MODEL_CANDIDATES) {
    const result = await tryModel(model, mimeType, fileData);

    if (result.ok) {
      console.log(`scan-receipt: used model ${model}`);
      return NextResponse.json(result.data);
    }

    errors.push(`${model}: ${result.error}`);

    if (!result.notAvailable) {
      // Hard failure (bad key, parse error, etc.) — don't bother trying other models
      break;
    }
    // notAvailable = try the next model
  }

  console.error("scan-receipt: all models failed:", errors);
  return NextResponse.json(
    { error: `No available Gemini model found for this API key. Tried: ${MODEL_CANDIDATES.join(", ")}. Last error: ${errors[errors.length - 1]}` },
    { status: 502 }
  );
}
