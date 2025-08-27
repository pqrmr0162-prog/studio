
"use client";

import { useActionState, useEffect, useRef, useState, useLayoutEffect } from "react";
import { useFormStatus } from "react-dom";
import { getAiResponse } from "@/app/actions";
import { AeonLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizonal, Mic, Paperclip, User, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

interface Message {
  role: "user" | "ai";
  content: string;
  imageUrl?: string | null;
  sources?: { title: string; url: string }[] | null;
}

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

const ChatView = ({ messages, pending }: { messages: Message[], pending: boolean }) => {
    const viewportRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (viewportRef.current) {
            viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
        }
    }, [messages, pending]);

    return (
        <ScrollArea className="flex-1 w-full" viewportRef={viewportRef}>
            <div className="max-w-4xl mx-auto p-4 space-y-6">
                {messages.map((message, index) => (
                    <div key={index} className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}>
                        {message.role === 'ai' && (
                            <Avatar className="w-8 h-8 border">
                                <AvatarFallback><Bot size={20} /></AvatarFallback>
                            </Avatar>
                        )}
                        <div className={`flex flex-col gap-2 ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <Card className={`max-w-xl ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                                <CardContent className="p-3">
                                    {message.imageUrl ? (
                                        <img src={message.imageUrl} alt="Generated" className="rounded-md" />
                                    ) : (
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {message.content}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            {message.sources && message.sources.length > 0 && (
                                <div className="flex gap-2 flex-wrap">
                                    {message.sources.map((source, i) => (
                                        <a key={i} href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary underline">
                                            {source.title}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                        {message.role === 'user' && (
                            <Avatar className="w-8 h-8 border">
                                <AvatarFallback><User size={20} /></AvatarFallback>
                            </Avatar>
                        )}
                    </div>
                ))}
                {pending && (
                     <div className="flex items-start gap-4">
                        <Avatar className="w-8 h-8 border">
                            <AvatarFallback><Bot size={20} /></AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-2 w-full max-w-xl">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-3/4" />
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>
    );
};

function AppContent({ state, formAction }) {
    const formRef = useRef<HTMLFormElement>(null);
    const { toast } = useToast();
    const [prompt, setPrompt] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const { pending } = useFormStatus();

    useEffect(() => {
        if (state?.error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: state.error,
            });
        }
    }, [state?.error, toast]);

    const handleFormAction = async (formData: FormData) => {
        const currentPrompt = formData.get("prompt") as string;
        if (!currentPrompt?.trim()) {
            return;
        }

        setMessages(prev => [...prev, { role: 'user', content: currentPrompt }]);
        setPrompt("");

        formAction(formData);
    };
    
    useEffect(() => {
        if(state?.response || state?.imageUrl) {
            setMessages(prev => [...prev, { 
                role: 'ai', 
                content: state.response ?? "",
                imageUrl: state.imageUrl,
                sources: state.sources,
             }]);
        }
    }, [state?.response, state?.imageUrl, state?.sources]);


    useLayoutEffect(() => {
        document.documentElement.classList.add('dark');
    }, []);


    return (
        <form ref={formRef} action={handleFormAction} className="contents">
                <div className="h-screen flex flex-col">
                    <main className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
                        {messages.length === 0 && !pending ? (
                            <WelcomeView onSuggestionClick={() => {}} />
                        ) : (
                            <ChatView messages={messages} pending={pending} />
                        )}
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
    const { pending } = useFormStatus();
    
    return <AppContent state={state} formAction={formAction} />;
}

export default Home;

    