import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Modality } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(455).json({ error: 'Method Not Allowed' });
  }

  const { modelId, contents } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is not configured.' });
  }

  const ai = new GoogleGenAI({ apiKey });

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');

  try {
    const responseStream = await ai.models.generateContentStream({
      model: modelId,
      contents: contents,
      config: { responseModalities: [Modality.AUDIO] },
    });

    for await (const chunk of responseStream) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;
      
      // Send parts to client
      res.write(JSON.stringify(parts) + '\n');
    }
    res.end();
  } catch (err: any) {
    console.error('Audio Generation Error:', err);
    res.write(JSON.stringify({ error: err.message || 'Error generating audio' }) + '\n');
    res.end();
  }
}
