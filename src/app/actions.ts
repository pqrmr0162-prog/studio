"use server";

import { interpretPrompt } from "@/ai/flows/interpret-prompt";
import type { InterpretPromptInput, InterpretPromptOutput } from "@/ai/flows/interpret-prompt";
import { generateImage } from "@/ai/flows/generate-image";
import type { GenerateImageInput } from "@/ai/flows/generate-image";

interface FormState {
  response: string | null;
  suggestions: string[] | null;
  sources: { title: string; url: string }[] | null;
  imageUrl: string | null;
  error: string | null;
}

async function fileToDataUri(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return `data:${file.type};base64,${buffer.toString("base64")}`;
}

export async function getAiResponse(
  formData: FormData
): Promise<FormState> {
  const prompt = formData.get("prompt") as string;
  const uploadedImage = formData.get("uploadedImage") as File | null;
  
  const isImageGeneration = prompt.toLowerCase().startsWith('generate image') || prompt.toLowerCase().startsWith('create image');

  if ((!prompt || prompt.trim().length === 0) && !uploadedImage) {
    return { response: null, suggestions: null, sources: null, imageUrl: null, error: "Please enter a prompt or upload an image." };
  }

  try {
    if (isImageGeneration) {
      const imagePrompt = prompt.replace(/^(generate image|create image)/i, '').trim();
      if (!imagePrompt) {
        return { response: null, suggestions: null, sources: null, imageUrl: null, error: "Please provide a description for the image you want to generate." };
      }
      const input: GenerateImageInput = { prompt: imagePrompt };
      const result = await generateImage(input);
      return { response: null, suggestions: null, sources: null, imageUrl: result.imageUrl, error: null };
    } else {
      const input: InterpretPromptInput = { prompt };
      
      if (uploadedImage && uploadedImage.size > 0) {
          input.attachmentDataUri = await fileToDataUri(uploadedImage);
      }

      const result: InterpretPromptOutput = await interpretPrompt(input);
      return { 
        response: result.response, 
        suggestions: result.suggestions ?? null, 
        sources: result.sources ?? null,
        imageUrl: null, 
        error: null 
      };
    }
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { response: null, suggestions: null, sources: null, imageUrl: null, error: `AI Error: ${errorMessage}` };
  }
}
