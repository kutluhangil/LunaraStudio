/**
 * GenAI Service
 *
 * This module communicates with Vercel Serverless Functions to perform metadata generation tasks securely,
 * hiding the Google Gemini API Key from the client.
 */
import { logFunctionCall } from '../utils/logger';

/**
 * Parses the raw text output from the model to separate lyrics from metadata.
 * @param text The raw text output from the model.
 * @returns An object containing the separated lyrics and metadata.
 */
export const parseModelOutput = (text: string): { lyrics: string, metadata: string } => {
  logFunctionCall('parseModelOutput', { textLength: text.length });
  const metaMarkers = /Caption:|Instruments:|Metadata:|Structure:|Description:|Mood:|mosic:|bpm:/i;
  const match = text.search(metaMarkers);
  if (match !== -1) return { lyrics: text.substring(0, match).trim(), metadata: text.substring(match).trim() };
  return { lyrics: text, metadata: '' };
};

/**
 * Suggests creative prompts based on topics.
 * @param topics The musical details/genres/moods.
 */
export const suggestPrompts = async (topics: string): Promise<string[]> => {
  logFunctionCall('suggestPrompts', { topics });
  try {
    const res = await fetch('/api/generate-meta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'suggest', data: { topics } }),
    });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    const text = data.result || "";
    return text.split('|').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
  } catch (err) {
    console.error("Failed to suggest prompts:", err);
    return [];
  }
};

/**
 * Generates a song title based on the prompt and lyrics.
 * @param musicPrompt The original prompt used to generate the music.
 * @param lyricContext A snippet of the generated lyrics.
 * @returns A promise that resolves to the generated title string.
 */
export const generateSongTitle = async (musicPrompt: string, lyricContext: string): Promise<string> => {
  logFunctionCall('generateSongTitle', { musicPrompt, lyricContextLength: lyricContext.length });
  try {
    const res = await fetch('/api/generate-meta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'title', data: { musicPrompt, lyricContext } }),
    });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    return data.result || "Untitled Track";
  } catch (err) {
    console.error("Failed to generate title:", err);
    return "Lyria Composition";
  }
};

/**
 * Generates cover art for the song.
 * @param musicPrompt The original prompt used to generate the music.
 * @param lyricContext A snippet of the generated lyrics.
 * @param title The generated title of the song.
 * @returns A promise that resolves to a base64 encoded image string, or null if generation fails.
 */
export const generateCoverArt = async (musicPrompt: string, lyricContext: string, title?: string): Promise<string | null> => {
  logFunctionCall('generateCoverArt', { musicPrompt, lyricContextLength: lyricContext.length, title });
  try {
    const res = await fetch('/api/generate-meta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cover', data: { musicPrompt, lyricContext, title } }),
    });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    return data.result || null;
  } catch (imgErr) {
    console.error("Visual synthesis skipped.", imgErr);
    return null;
  }
};
