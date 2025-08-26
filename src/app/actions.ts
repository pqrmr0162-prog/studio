"use server";

import { interpretPrompt } from "@/ai/flows/interpret-prompt";
import type { InterpretPromptInput } from "@/ai/flows/interpret-prompt";

interface FormState {
  response: string | null;
  error: string | null;
}

async function fileToDataUri(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return `data:${file.type};base64,${buffer.toString("base64")}`;
}

export async function getAiResponse(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const prompt = formData.get("prompt") as string;
  const attachment = formData.get("attachment") as File | null;

  if ((!prompt || prompt.trim().length === 0) && !attachment) {
    return { response: null, error: "Please enter a prompt or upload a file." };
  }

  try {
    const input: InterpretPromptInput = { prompt };
    
    if (attachment && attachment.size > 0) {
        input.attachmentDataUri = await fileToDataUri(attachment);
    }

    const result = await interpretPrompt(input);
    return { response: result.response, error: null };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { response: null, error: `AI Error: ${errorMessage}` };
  }
}
