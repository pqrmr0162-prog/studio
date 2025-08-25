"use server";

import { interpretPrompt } from "@/ai/flows/interpret-prompt";

interface FormState {
  response: string | null;
  error: string | null;
}

export async function getAiResponse(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const prompt = formData.get("prompt") as string;

  if (!prompt || prompt.trim().length === 0) {
    return { response: null, error: "Please enter a prompt." };
  }

  try {
    const result = await interpretPrompt({ prompt });
    return { response: result.response, error: null };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { response: null, error: `AI Error: ${errorMessage}` };
  }
}
