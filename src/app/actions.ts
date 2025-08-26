"use server";

import { interpretPrompt } from "@/ai/flows/interpret-prompt";
import type { InterpretPromptInput } from "@/ai/flows/interpret-prompt";
import { generateImage } from "@/ai/flows/generate-image";
import type { GenerateImageInput } from "@/ai/flows/generate-image";

interface FormState {
  response: string | null;
  imageUrl: string | null;
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
    return { response: null, imageUrl: null, error: "Please enter a prompt or upload a file." };
  }

  try {
    if (prompt.toLowerCase().startsWith("generate image") || prompt.toLowerCase().startsWith("create an image")) {
      const imagePrompt = prompt.replace(/^(generate image of|create an image of|generate image|create an image)/i, '').trim();
      const input: GenerateImageInput = { prompt: imagePrompt };
      const result = await generateImage(input);
      return { response: null, imageUrl: result.imageUrl, error: null };
    } else {
      const input: InterpretPromptInput = { prompt };
      
      if (attachment && attachment.size > 0) {
          input.attachmentDataUri = await fileToDataUri(attachment);
      }

      const result = await interpretPrompt(input);
      return { response: result.response, imageUrl: null, error: null };
    }
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { response: null, imageUrl: null, error: `AI Error: ${errorMessage}` };
  }
}
