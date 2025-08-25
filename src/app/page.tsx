"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useState } from "react";
import { getAiResponse } from "@/app/actions";
import { TigerLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Sparkles, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const initialState = {
  response: null,
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? (
        <>
          <Wand2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        "Get Response"
      )}
    </Button>
  );
}

export default function Home() {
  const [state, formAction] = useFormState(getAiResponse, initialState);
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    if (state.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: state.error,
      });
    }
  }, [state.error, toast]);

  const handleCopy = () => {
    if (state.response) {
      navigator.clipboard.writeText(state.response);
      toast({
        title: "Copied!",
        description: "AI response copied to clipboard.",
      });
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-3xl space-y-8">
        <header className="flex flex-col items-center text-center">
          <TigerLogo className="w-16 h-16 mb-4" />
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            AeonAI Assistant
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Your intelligent assistant for dynamic task handling and generation.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try prompts like "What's the weather in London?" or "What's the stock price for GOOGL?".
          </p>
        </header>

        <Card className="w-full border-2 border-primary/20 shadow-lg shadow-primary/10">
          <CardHeader>
            <CardTitle className="text-xl">Enter Your Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <Textarea
                name="prompt"
                placeholder="e.g., What is the current weather in Paris?"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                required
                className="min-h-[120px] text-base"
              />
              <SubmitButton />
            </form>
          </CardContent>
        </Card>

        {state.response && (
          <Card className="w-full animate-in fade-in-0 zoom-in-95 duration-500">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-7 h-7 text-primary" />
                <CardTitle className="text-xl">AI Response</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCopy} aria-label="Copy response">
                <Copy className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {state.response}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
