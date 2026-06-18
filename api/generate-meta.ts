import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(455).json({ error: 'Method Not Allowed' });
  }

  const { action, data } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is not configured.' });
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    if (action === 'suggest') {
      const { topics } = data;
      const promptText = `Based on these themes/moods/genres/details: "${topics}", suggest 3 creative, coherent, and evocative music generation prompts (1-2 sentences each). Return them separated by a pipe character "|". Do not include quotation marks or numbers in the output. Example output: An upbeat energetic synthwave track for late night driving | A melancholic lonely piano solo with rain sounds | A heavy aggressive trap beat with dark brass elements`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: promptText,
      });
      return res.status(200).json({ result: response.text?.trim() || '' });
    }

    if (action === 'title') {
      const { musicPrompt, lyricContext } = data;
      const promptText = `Based on this music prompt: "${musicPrompt}" and these lyrics: "${(lyricContext || '').substring(0, 500)}", generate a catchy, evocative, short song title (3 words max). Return ONLY the title string, no quotes or extra text.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: promptText,
      });
      return res.status(200).json({ result: response.text?.trim() || 'Untitled Track' });
    }

    if (action === 'cover') {
      const { musicPrompt, lyricContext, title } = data;
      const imagePrompt = `A high-quality, professional square song cover for a music track titled "${title || 'Music'}". Atmosphere: ${musicPrompt}. Context: ${(lyricContext || '').substring(0, 200)}. Abstract, cinematic aesthetic. IMPORTANT: Ignore any mention of BPM or musical scale in the prompt; do NOT print any numbers, BPM, or scale text on the image.`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: imagePrompt }] },
        config: { imageConfig: { aspectRatio: '1:1' } },
      });

      let base64Image = null;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            base64Image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
      }
      return res.status(200).json({ result: base64Image });
    }

    return res.status(400).json({ error: `Invalid action: ${action}` });
  } catch (err: any) {
    console.error('API Error:', err);
    return res.status(500).json({ error: err.message || 'Error executing API request' });
  }
}
