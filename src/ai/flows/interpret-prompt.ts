
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
import {getFlowState} from 'genkit/experimental/state';

const InterpretPromptInputSchema = z.object({
  prompt: z.string().describe('The user prompt to be interpreted.'),
  attachmentDataUri: z
    .string()
    .optional()
    .describe(
      "An optional file attachment (image, PDF, or text), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
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
  async ({ query }) => {
    // In a real implementation, this would call a search engine API.
    // For this prototype, we'll generate more realistic mock data based on the query.
    console.log(`Simulating web search for: ${query}`);

    const generateUrl = (site: string) => `https://www.${site.toLowerCase().replace(/\s/g, '')}.com/search?q=${encodeURIComponent(query)}`;
    const generateTitle = (prefix: string) => `${prefix}: ${query}`;
    const generateSnippet = (site: string) => `A detailed article from ${site} explaining various aspects of ${query}.`;

    const mockData = [
      { 
        title: generateTitle('Wikipedia'), 
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
        snippet: `The Wikipedia entry for ${query}, providing a comprehensive overview.`
      },
      { 
        title: generateTitle('TechCrunch'), 
        url: generateUrl('TechCrunch'), 
        snippet: generateSnippet('TechCrunch') 
      },
      { 
        title: generateTitle('Investopedia'), 
        url: generateUrl('Investopedia'), 
        snippet: generateSnippet('Investopedia') 
      },
    ];

    // If the query is about a known technology, provide more specific links.
    if (/next\.js|genkit|tailwind/i.test(query)) {
        return [
            { title: 'Official Next.js Documentation', url: 'https://nextjs.org/docs', snippet: 'The official documentation for Next.js, a popular React framework.' },
            { title: 'Genkit AI Developer Docs', url: 'https://firebase.google.com/docs/genkit', snippet: 'Genkit is an open source framework from Google that helps you build, deploy, and monitor production-ready AI apps.' },
            { title: 'Tailwind CSS - Official Site', url: 'https://tailwindcss.com/', snippet: 'A utility-first CSS framework for rapidly building custom designs.' },
        ];
    }
    
    return mockData;
  }
);

// Tool: Get Latest News
const getLatestNews = ai.defineTool(
  {
    name: 'getLatestNews',
    description: 'Gets the latest news articles for a given topic.',
    inputSchema: z.object({
      query: z.string().describe('The topic to search for news on.'),
    }),
    outputSchema: z.array(
      z.object({
        title: z.string(),
        url: z.string(),
        snippet: z.string(),
      })
    ),
  },
  async ({query}) => {
    const apiKey = process.env.NEWSDATA_API_KEY;
    if (!apiKey) {
      return [{title: 'API Key not configured', url: '#', snippet: 'The NewsData.io API key is not configured.'}];
    }

    const url = `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent(query)}&language=en`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        return [{title: 'API Error', url: '#', snippet: `Failed to fetch news: ${errorData.results?.message || response.statusText}`}];
      }

      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        return [{title: 'No news found', url: '#', snippet: `No recent news articles found for "${query}".`}];
      }

      return data.results.slice(0, 5).map((article: any) => ({
        title: article.title,
        url: article.link || '#',
        snippet: article.description || 'No snippet available.',
      }));

    } catch (error) {
      console.error('Error fetching news:', error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      return [{title: 'Request Failed', url: '#', snippet: `Failed to fetch news from NewsData.io: ${errorMessage}`}];
    }
  }
);


const interpretPromptPrompt = ai.definePrompt({
  name: 'interpretPromptPrompt',
  input: {schema: InterpretPromptInputSchema},
  output: {schema: InterpretPromptOutputSchema},
  tools: [searchWeb, getLatestNews],
  prompt: `You are AeonAI, a polite, logical, and factual AI assistant. Your primary goal is to provide accurate, well-reasoned, and helpful responses. Always be courteous and respectful in your interactions.

- **Interaction Context:** You are interacting with a user from India. Be mindful of cultural context and use Indian English where appropriate. You can also understand and respond to Hinglish (a mix of Hindi and English).
- **Logical Analysis:** First, deeply analyze the user's prompt to understand the core question and intent. Break down complex questions into logical steps.
- **Factual Responses:** Prioritize factual accuracy. If the prompt requires current or specific information, use your tools to find it.
- **Strategic Tool Use:** Use 'getLatestNews' for news and 'searchWeb' for general queries. Do not just present the tool's output; you must synthesize the information and use it to construct a comprehensive, logical answer.
- **Cite Your Sources:** After using a tool, you MUST populate the 'sources' field with the title and URL for any web page you used. This provides transparency and allows the user to do further research.
- **Formatting:** Use markdown to format your response for clarity and readability (e.g., **bold**, lists, tables).

{{#if attachmentDataUri}}
The user has provided an attachment. You MUST analyze its content and use it to inform your response.
Attachment:
{{media url=attachmentDataUri}}
{{/if}}

Prompt:
{{prompt}}

If the user asks "how is your owner" or a similar question about your creator or owner, you must respond with "I am a large language model, developed by Bissu and fine-tuned by Google.".

If the user asks about your capabilities, your identity, or how you compare to other AIs like ChatGPT, Grok, or Perplexity, respond with: "I am AeonAI, a helpful assistant created by Bissu using Google's powerful data and models. My own unique model is known as Aeon-1s."

If the user asks specifically about the "Aeon-1s" model, you must respond with: "I apologize, but due to restrictions from my developer, I am not able to share specific details about the Aeon-1s model. My purpose is to assist you with your questions to the best of my ability."

If an attachment is provided, your primary task is to analyze it.
- If there is also a prompt, answer the prompt based on the attachment's content.
- If there is no prompt, describe the image or summarize the document.
In all cases involving an attachment, you must provide a response.

If no attachment is provided, generate a comprehensive and helpful response to the prompt.

After your main response, generate a few (2-3) insightful, relevant follow-up questions or actions the user might want to take next and provide them in the 'suggestions' field. These should anticipate the user's next steps, such as "Compare the pros and cons of X", "Draft an email about this topic", or "What are the key takeaways for a beginner?".`,
});

const interpretPromptFlow = ai.defineFlow(
  {
    name: 'interpretPromptFlow',
    inputSchema: InterpretPromptInputSchema,
    outputSchema: InterpretPromptOutputSchema,
  },
  async input => {
    const {output} = await interpretPromptPrompt(input);
    
    if (!output) {
        return {
            response: "My apologies, but I'm unable to provide a response to that right now. Please try rephrasing your request.",
            suggestions: ["Can you explain that differently?", "What are your capabilities?"],
        }
    }

    return output;
  }
);
