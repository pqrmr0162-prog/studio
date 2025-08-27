"use client";

import { useActionState, useEffect, useRef, useState, useLayoutEffect } from "react";
import { useFormStatus } from "react-dom";
import { getAiResponse } from "@/app/actions";
import { AeonLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, Mic, SendHorizonal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const initialState = {
  response: null,
  suggestions: null,
  sources: null,
  imageUrl: null,
  error: null,
};

const SubmitButton = ({ disabled }: { disabled: boolean }) => {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" size="icon" disabled={disabled || pending} className="shrink-0 rounded-full w-10 h-10 bg-primary hover:bg-primary/90 text-primary-foreground">
            {pending ? (
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-current"></div>
            ) : (
                <SendHorizonal className="h-5 w-5" />
            )}
            <span className="sr-only">Send message</span>
        </Button>
    );
}

const MessageInput = ({ prompt, setPrompt, formRef }) => {
    const { pending } = useFormStatus();

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' && !event.shiftKey && prompt.trim() && !pending) {
        event.preventDefault();
        if (formRef.current) {
          const submitButton = formRef.current.querySelector('button[type="submit"]') as HTMLButtonElement;
          submitButton?.click();
        }
      }
    };
    
    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="relative flex items-center gap-2 rounded-full bg-[#1e1f20] border border-border/50 shadow-lg px-4 py-2">
                <button type="button" className="shrink-0 text-muted-foreground hover:text-foreground">
                    <Paperclip className="h-5 w-5" />
                    <span className="sr-only">Attach file</span>
                </button>
                <Input
                    name="prompt"
                    placeholder="Ask about an image or just chat. Try 'generate image of a cat'"
                    autoComplete="off"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 text-base placeholder:text-muted-foreground/80"
                    disabled={pending}
                />
                 <button type="button" className="shrink-0 text-muted-foreground hover:text-foreground">
                    <Mic className="h-5 w-5" />
                    <span className="sr-only">Use microphone</span>
                </button>
                <SubmitButton disabled={!prompt.trim()}/>
            </div>
        </div>
    );
};

const WelcomeView = ({ setPrompt, formRef }) => {
  const [prompt, setLocalPrompt] = useState("");
  
  const handleFormSubmit = (e) => {
    e.preventDefault();
    setPrompt(prompt);
    if (formRef.current) {
      const submitButton = formRef.current.querySelector('button[type="submit"]') as HTMLButtonElement;
      submitButton?.click();
    }
  };
  
  return (
    <div className="h-screen flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <div className="flex items-center gap-4 mb-6">
            <AeonLogo className="w-16 h-16" />
            <h1 className="text-6xl font-semibold">AeonAI</h1>
        </div>
        <h2 className="text-4xl font-medium text-muted-foreground mb-12">How can I help you today?</h2>
      </main>
      <footer className="p-4 z-10 w-full flex flex-col items-center gap-4">
          <form onSubmit={handleFormSubmit} className="w-full contents">
             <MessageInput prompt={prompt} setPrompt={setLocalPrompt} formRef={formRef} />
          </form>
          <p className="text-sm text-muted-foreground/50">Created by Bissu</p>
      </footer>
    </div>
  );
};

// ... a placeholder ChatView in case we need it later
const ChatView = ({ messages, pending }: { messages: any[], pending: boolean }) => {
    return <div></div>;
};

function Home() {
    const [state, formAction] = useActionState(getAiResponse, initialState);
    const formRef = useRef<HTMLFormElement>(null);
    const { toast } = useToast();
    const [prompt, setPrompt] = useState("");
    const [messages, setMessages] = useState<any[]>([]); // Will be used later

    useEffect(() => {
        if (state?.error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: state.error,
            });
        }
    }, [state?.error, toast]);
    
    // This effect will be used to switch to chat view
    useEffect(() => {
        if (prompt) { // A simple way to detect when to switch view
            formRef.current?.requestSubmit();
        }
    }, [prompt]);

    useLayoutEffect(() => {
        document.documentElement.classList.add('dark');
    }, []);

    const handleFormAction = async (formData: FormData) => {
        // This will be properly implemented later to handle chat messages
        const currentPrompt = formData.get("prompt") as string;
        if (!currentPrompt) return;
        setMessages(prev => [...prev, { role: 'user', content: currentPrompt }]);
        formAction(formData);
    };

    return (
        <form ref={formRef} action={handleFormAction} className="contents">
            {messages.length === 0 ? (
                <WelcomeView setPrompt={setPrompt} formRef={formRef} />
            ) : (
                <ChatView messages={messages} pending={false} />
            )}
        </form>
    );
}

export default Home;
