'use server';

/**
 * @fileOverview Implements a Genkit flow that dynamically selects and uses tools based on the user's prompt.
 *
 * - dynamicToolSelection - A function that takes a user prompt and returns a contextually relevant AI response using tools.
 * - DynamicToolSelectionInput - The input type for the dynamicToolSelection function (just the prompt string).
 * - DynamicToolSelectionOutput - The return type for the dynamicToolSelection function (the AI's response).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DynamicToolSelectionInputSchema = z.string().describe('The user prompt.');
export type DynamicToolSelectionInput = z.infer<typeof DynamicToolSelectionInputSchema>;

const DynamicToolSelectionOutputSchema = z.object({
  response: z.string().describe('The AI response to the user prompt.'),
});
export type DynamicToolSelectionOutput = z.infer<typeof DynamicToolSelectionOutputSchema>;

export async function dynamicToolSelection(input: DynamicToolSelectionInput): Promise<DynamicToolSelectionOutput> {
  return dynamicToolSelectionFlow(input);
}

// Example tool: Get current weather
const getCurrentWeather = ai.defineTool(
  {
    name: 'getCurrentWeather',
    description: 'Returns the current weather conditions for a given city.',
    inputSchema: z.object({
      city: z.string().describe('The city to get weather information for.'),
    }),
    outputSchema: z.string(),
  },
  async input => {
    // In a real implementation, this would call an external weather API.
    return `The current weather in ${input.city} is sunny with a temperature of 25 degrees Celsius.`
  }
);

// Example tool: Get stock price
const getStockPrice = ai.defineTool(
  {
    name: 'getStockPrice',
    description: 'Returns the current market value of a stock.',
    inputSchema: z.object({
      ticker: z.string().describe('The ticker symbol of the stock.'),
    }),
    outputSchema: z.number(),
  },
  async input => {
    // In a real implementation, this would call a stock price API.
    return 123.45; // Placeholder value
  }
);

const dynamicToolSelectionFlow = ai.defineFlow(
  {
    name: 'dynamicToolSelectionFlow',
    inputSchema: DynamicToolSelectionInputSchema,
    outputSchema: DynamicToolSelectionOutputSchema,
  },
  async input => {
    const prompt = ai.definePrompt({
      name: 'dynamicToolSelectionPrompt',
      tools: [getCurrentWeather, getStockPrice],
      prompt: `You are a helpful AI assistant.  Based on the user's prompt, you may use tools to provide a more accurate response. If the user asks about weather, use the getCurrentWeather tool. If the user asks about stock prices, use the getStockPrice tool.

User prompt: {{{$input}}}

Response: `,
    });

    const {output} = await prompt(input);
    return {response: output!};
  }
);
