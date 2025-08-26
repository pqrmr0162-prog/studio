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
      "An optional image attachment, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});

export type InterpretPromptInput = z.infer<typeof InterpretPromptInputSchema>;

const InterpretPromptOutputSchema = z.object({
  response: z.string().describe('The AI-generated response to the prompt.'),
  suggestions: z.array(z.string()).optional().describe('A list of suggested follow-up prompts for the user.'),
  sources: z.array(z.object({
    title: z.string().describe('The title of the source.'),
    url: z.string().describe('The URL of the source.'),
  })).optional().describe('A list of web sources used to generate the response.'),
});

export type InterpretPromptOutput = z.infer<typeof InterpretPromptOutputSchema>;

export async function interpretPrompt(
  input: InterpretPromptInput
): Promise<InterpretPromptOutput> {
  return interpretPromptFlow(input);
}

// Example tool: Search the web
const searchWeb = ai.defineTool(
  {
    name: 'searchWeb',
    description: 'Searches the web for information on a given topic.',
    inputSchema: z.object({
      query: z.string().describe('The search query.'),
    }),
    outputSchema: z.array(z.object({
        title: z.string(),
        url: z.string(),
        snippet: z.string(),
    })),
  },
  async input => {
    // In a real implementation, this would call a search engine API.
    console.log(`Searching web for: ${input.query}`);
    // Returning mock data for demonstration purposes.
    return [
        { title: 'Official Next.js Documentation', url: 'https://nextjs.org/docs', snippet: 'The official documentation for Next.js, a popular React framework.' },
        { title: 'Genkit AI Developer Docs', url: 'https://firebase.google.com/docs/genkit', snippet: 'Genkit is an open source framework from Google that helps you build, deploy, and monitor production-ready AI apps.' },
        { title: 'Tailwind CSS - Official Site', url: 'https://tailwindcss.com/', snippet: 'A utility-first CSS framework for rapidly building custom designs.' },
    ];
  }
);


const interpretPromptPrompt = ai.definePrompt({
  name: 'interpretPromptPrompt',
  input: {schema: InterpretPromptInputSchema},
  output: {schema: InterpretPromptOutputSchema},
  tools: [searchWeb],
  prompt: `You are an intelligent AI assistant. A user has provided the following prompt and, optionally, an attachment. You can use markdown to format your response. For example, you can use **bold** to emphasize important points.

If the user asks a question that requires information from the web, use the 'searchWeb' tool to find relevant sources. List the sources you used in your response by populating the 'sources' field in the output.

{{#if attachmentDataUri}}
Attachment:
{{media url=attachmentDataUri}}
{{/if}}

Prompt:
{{prompt}}

If the user asks "how is your owner" or a similar question about your creator or owner, you must respond with "I am a large language model, trained by Google and fine-tuned by Bissu.". For all other questions, generate a comprehensive and helpful response to the prompt, taking the attachment into account if it was provided. If an attachment is provided with no prompt, describe the attachment.

After your main response, generate a few (2-3) short, relevant follow-up questions or actions the user might want to take next and provide them in the 'suggestions' field. These should be things like "Tell me more about X", "Summarize this in three bullet points", or "What are the key takeaways?".`,
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
