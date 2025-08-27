
"use client";

import { useActionState, useEffect, useRef, useState, useLayoutEffect } from "react";
import { useFormStatus } from "react-dom";
import { getAiResponse } from "@/app/actions";
import { AeonLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizonal, Mic, Paperclip } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import React from "react";

const initialState = {
  response: null,
  suggestions: null,
  sources: null,
  imageUrl: null,
  error: null,
};

function SubmitButton({ disabled }: { disabled: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" size="icon" disabled={disabled || pending} className="shrink-0 rounded-full w-10 h-10 bg-primary">
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
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);
    const { toast } = useToast();

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey && prompt.trim() && !pending) {
        event.preventDefault();
        if (formRef.current) {
          const submitButton = formRef.current.querySelector('button[type="submit"]') as HTMLButtonElement;
          submitButton?.click();
        }
      }
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // This is a placeholder for file handling logic.
        const file = event.target.files?.[0];
        if (file) {
            toast({ title: `File "${file.name}" attached.`});
        }
    };

    const handleMicClick = () => {
        if (pending) return;
        
        if (isRecording) {
            recognitionRef.current?.stop();
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast({
                variant: "destructive",
                title: "Unsupported Browser",
                description: "Speech recognition is not supported in your browser.",
            });
            return;
        }

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-IN';

        recognitionRef.current.onstart = () => {
            setIsRecording(true);
        };

        recognitionRef.current.onend = () => {
            setIsRecording(false);
        };

        recognitionRef.current.onerror = (event: any) => {
            setIsRecording(false);
            toast({
                variant: "destructive",
                title: "Speech Recognition Error",
                description: event.error,
            });
        };

        recognitionRef.current.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setPrompt(transcript);
        };

        recognitionRef.current.start();
    };

    return (
        <div className="w-full">
            <div className="relative flex items-center gap-2 md:gap-4 px-3 py-2 rounded-full bg-secondary border shadow-sm max-w-2xl mx-auto">
                <Button type="button" variant="ghost" size="icon" className="shrink-0 rounded-full" onClick={() => fileInputRef.current?.click()} disabled={pending}>
                    <Paperclip className="h-5 w-5" />
                    <span className="sr-only">Upload file</span>
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} name="uploadedFile" accept="image/*,application/pdf,.txt,.md" className="hidden" disabled={pending} />

                <Textarea
                    ref={textareaRef}
                    name="prompt"
                    placeholder="Ask about an image or just chat. Try 'generate image of a cat'"
                    autoComplete="off"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 resize-none max-h-48"
                    rows={1}
                    disabled={pending}
                />
                <Button type="button" variant="ghost" size="icon" className="shrink-0 rounded-full" onClick={handleMicClick} disabled={pending}>
                    <Mic className="h-5 w-5" />
                    <span className="sr-only">Use microphone</span>
                </Button>
                <SubmitButton disabled={!prompt.trim()}/>
            </div>
        </div>
    );
};

const WelcomeView = ({ onSuggestionClick }) => {
  return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <div className="flex items-center gap-4 mb-4">
            <AeonLogo className="w-12 h-12" />
            <h1 className="text-5xl font-bold">AeonAI</h1>
        </div>
        <h2 className="text-3xl font-semibold text-muted-foreground mb-12">How can I help you today?</h2>
      </div>
  );
};


function AppContent({ state, formAction }) {
    const formRef = useRef<HTMLFormElement>(null);
    const [prompt, setPrompt] = useState("");
    
    useLayoutEffect(() => {
        document.documentElement.classList.add('dark');
    }, []);

    const handleFormSubmit = (formData: FormData) => {
        // This is a placeholder for form submission. 
        // In a real app, this would show the chat view.
        const currentPrompt = formData.get("prompt") as string;
        if (!currentPrompt?.trim()) {
            return;
        }
        alert(`You submitted: ${currentPrompt}`);
        // We are not calling formAction(formData) yet to keep the UI simple as requested.
        setPrompt("");
    };

    return (
        <form ref={formRef} action={handleFormSubmit} className="contents">
                <div className="h-screen flex flex-col">
                    <main className="flex-1 flex flex-col items-center justify-center p-4">
                      <WelcomeView onSuggestionClick={() => {}} />
                    </main>
                    <footer className="p-4 bg-transparent z-10 w-full">
                        <MessageInput 
                            prompt={prompt} 
                            setPrompt={setPrompt} 
                            formRef={formRef}
                        />
                        <p className="text-center text-xs text-muted-foreground mt-4">Created by Bissu</p>
                    </footer>
                </div>
        </form>
    );
}

function Home() {
    const [state, formAction] = useActionState(getAiResponse, initialState);
    return <AppContent state={state} formAction={formAction} />;
}

export default Home;
