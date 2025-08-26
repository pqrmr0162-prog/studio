import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable not found. Please add it to your .env file or hosting provider's environment variables.");
}

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});
