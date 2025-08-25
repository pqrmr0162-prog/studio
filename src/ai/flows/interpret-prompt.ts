// This file uses server-side code.
'use server';

/**
 * @fileOverview A flow that interprets a user prompt and returns an intelligent AI-generated response.
 *
 * - interpretPrompt - A function that accepts a user prompt and returns an AI-generated response.
 * - InterpretPromptInput - The input type for the interpretPrompt function.
 * - InterpretPromptOutput - The return type for the interpretPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InterpretPromptInputSchema = z.object({
  prompt: z.string().describe('The user prompt to be interpreted.'),
  attachmentDataUri: z
    .string()
    .optional()
    .describe(
      "An optional image attachment, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

export type InterpretPromptInput = z.infer<typeof InterpretPromptInputSchema>;

const InterpretPromptOutputSchema = z.object({
  response: z.string().describe('The AI-generated response to the prompt.'),
});

export type InterpretPromptOutput = z.infer<typeof InterpretPromptOutputSchema>;

export async function interpretPrompt(
  input: InterpretPromptInput
): Promise<InterpretPromptOutput> {
  return interpretPromptFlow(input);
}

const interpretPromptPrompt = ai.definePrompt({
  name: 'interpretPromptPrompt',
  input: {schema: InterpretPromptInputSchema},
  output: {schema: InterpretPromptOutputSchema},
  prompt: `You are an intelligent AI assistant. A user has provided the following prompt and, optionally, an attachment.

{{#if attachmentDataUri}}
Attachment:
{{media url=attachmentDataUri}}
{{/if}}

Prompt:
{{prompt}}

If the user asks "how is your owner" or a similar question about your creator or owner, you must respond with "I am a large language model, trained by Google and fine-tuned by Bissu.". For all other questions, generate a comprehensive and helpful response to the prompt, taking the attachment into account if it was provided. If an attachment is provided with no prompt, describe the attachment.`,
});

const interpretPromptFlow = ai.defineFlow(
  {
    name: 'interpretPromptFlow',
    inputSchema: InterpretPromptInputSchema,
    outputSchema: InterpretPromptOutputSchema,
  },
  async input => {
    const {output} = await interpretPromptPrompt(input);
    return output!;
  }
);
