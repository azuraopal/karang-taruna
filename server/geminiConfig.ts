import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

export function readGeminiConfig(env: NodeJS.ProcessEnv = process.env, envFile = path.join(process.cwd(), '.env')) {
  let local: Record<string, string> = {};
  // Vite restarts retain process.env values previously populated by dotenv.
  // Read only Gemini settings afresh locally; deployed servers use their environment.
  if (env.NODE_ENV === 'development' && fs.existsSync(envFile)) {
    local = dotenv.parse(fs.readFileSync(envFile));
  }
  return {
    apiKey: (local.GEMINI_API_KEY ?? env.GEMINI_API_KEY ?? '').trim(),
    model: (local.GEMINI_MODEL ?? env.GEMINI_MODEL ?? '').trim() || 'gemini-3.8-flash',
  };
}
