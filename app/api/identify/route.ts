import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

function stripCodeFences(text: string): string {
  return text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const imageUrl = body.imageUrl as string | undefined;

    if (!imageUrl) {
      return Response.json({ error: 'missing_imageUrl' }, { status: 400 });
    }

    // Fetch image from Vercel Blob URL
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      return Response.json({ error: `failed_to_fetch_image_from_url: ${imageRes.statusText}` }, { status: 400 });
    }

    const mimeType = imageRes.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await imageRes.arrayBuffer();
    const imageBase64 = Buffer.from(arrayBuffer).toString('base64');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'server_missing_gemini_key' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = [
      'You are a field biologist assistant. Identify the main wild organism in the image.',
      'Reply with ONLY valid JSON (no markdown), keys:',
      '{"nameKo","nameEn","nameScientific","category","rarity","description","confidence"}',
      'category: one of animal, plant, fungus, insect, bird, reptile, amphibian, fish, other.',
      'rarity: one of common, uncommon, rare, endangered (best-effort if unsure use common).',
      'confidence: high | low | unknown.',
      'Use Korean for nameKo when possible.',
    ].join(' ');

    const result = await model.generateContent([
      { inlineData: { mimeType, data: imageBase64 } },
      prompt,
    ]);

    const text = result.response.text();
    const cleaned = stripCodeFences(text);

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return Response.json(
        { error: 'gemini_non_json', raw: text.slice(0, 500) },
        { status: 502 },
      );
    }

    return Response.json(parsed);
  } catch (e) {
    console.error('identify error', e);
    return Response.json({ error: 'identify_failed', detail: String(e) }, { status: 500 });
  }
}
