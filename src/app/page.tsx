
"use client";

import { useActionState, useEffect, useRef, useState, useLayoutEffect } from "react";
import { useFormStatus } from "react-dom";
import { getAiResponse } from "@/app/actions";
import { AeonLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizonal, Mic, Plus, Sun, User, Bot, X } from "lucide-react";
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
    const textareaRef = useRef<HTMLTextAreaElement>(null);
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
        <div className="w-full max-w-4xl mx-auto">
            <div className="relative flex items-center gap-2 rounded-full bg-secondary border border-border shadow-sm px-4 py-2">
                <Textarea
                    ref={textareaRef}
                    name="prompt"
                    placeholder="Message AeonAI..."
                    autoComplete="off"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 resize-none max-h-48 text-base"
                    rows={1}
                    disabled={pending}
                />
                 <Button type="button" variant="ghost" size="icon" className="shrink-0 rounded-full text-muted-foreground" onClick={handleMicClick} disabled={pending}>
                    <Mic className="h-5 w-5" />
                    <span className="sr-only">Use microphone</span>
                </Button>
                <SubmitButton disabled={!prompt.trim()}/>
            </div>
        </div>
    );
};


const WelcomeView = ({ setPrompt }) => {
  const suggestions = [
    "Explain quantum computing in simple terms",
    "Got any creative ideas for a 10 year old’s birthday?",
    "How do I make an HTTP request in Javascript?",
    "What's the meaning of life?",
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="mb-8">
        <AeonLogo className="w-24 h-24 mx-auto" />
      </div>
      <h1 className="text-4xl font-bold mb-12">How can I help you today?</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
        {suggestions.map((s, i) => (
          <Button key={i} variant="outline" className="h-auto text-left justify-start p-4 bg-secondary hover:bg-white/10 border-border" onClick={() => setPrompt(s)}>
            {s}
          </Button>
        ))}
      </div>
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
            <div className="max-w-4xl mx-auto p-4 space-y-8">
                {messages.map((message, index) => (
                    <div key={index} className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}>
                        {message.role === 'ai' && (
                            <Avatar className="w-8 h-8 border-none">
                                <AvatarFallback className="bg-transparent text-primary"><AeonLogo className="w-8 h-8" /></AvatarFallback>
                            </Avatar>
                        )}
                        <div className={`flex flex-col gap-2 ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                             <div className={`max-w-xl rounded-2xl px-4 py-3 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                                {message.imageUrl ? (
                                    <img src={message.imageUrl} alt="Generated" className="rounded-md" />
                                ) : (
                                    <div className="prose prose-sm dark:prose-invert max-w-none text-base">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {message.content}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>
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
                             <Avatar className="w-8 h-8 border bg-secondary">
                                <AvatarFallback className="bg-secondary text-secondary-foreground"><User size={20} /></AvatarFallback>
                            </Avatar>
                        )}
                    </div>
                ))}
                {pending && (
                     <div className="flex items-start gap-4">
                        <Avatar className="w-8 h-8 border-none">
                            <AvatarFallback className="bg-transparent text-primary"><AeonLogo className="w-8 h-8" /></AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-2 w-full max-w-xl">
                           <div className="bg-secondary rounded-2xl px-4 py-3 w-full">
                              <Skeleton className="h-5 w-full" />
                              <Skeleton className="h-5 w-3/4 mt-2" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>
    );
};

const Header = ({ onNewChat }) => {
  return (
    <header className="p-4 flex justify-between items-center w-full border-b border-border">
      <div className="flex items-center gap-2">
        <AeonLogo className="w-8 h-8" />
        <div>
          <h1 className="text-lg font-semibold">AeonAI</h1>
          <p className="text-xs text-muted-foreground">Developed by Bissu</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Sun className="h-5 w-5" />
        </Button>
        <Button variant="ghost" onClick={onNewChat}>
          <Plus className="h-5 w-5 mr-2" />
          New Chat
        </Button>
         <Avatar className="w-8 h-8 border bg-secondary">
            <AvatarFallback className="bg-secondary text-secondary-foreground"><User size={20} /></AvatarFallback>
        </Avatar>
      </div>
    </header>
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
        const file = formData.get("uploadedFile") as File;

        if (!currentPrompt?.trim() && (!file || file.size === 0)) {
            return;
        }

        setMessages(prev => [...prev, { role: 'user', content: currentPrompt }]);
        setPrompt("");
        
        // Reset file input if you have one
        if (formRef.current) {
            const fileInput = formRef.current.querySelector('input[type="file"]') as HTMLInputElement;
            if (fileInput) {
                fileInput.value = "";
            }
        }

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
        document.body.classList.add('bg-background');
    }, []);
    
    const handleNewChat = () => {
        setMessages([]);
        // Potentially reset form state as well if needed
    };

    return (
        <form ref={formRef} action={handleFormAction} className="contents">
            <div className="h-screen flex flex-col bg-background text-foreground">
                <Header onNewChat={handleNewChat} />
                <main className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
                    {messages.length === 0 && !pending ? (
                        <WelcomeView setPrompt={setPrompt} />
                    ) : (
                        <ChatView messages={messages} pending={pending} />
                    )}
                </main>
                <footer className="p-4 border-t border-border z-10 w-full flex justify-center">
                    <MessageInput 
                        prompt={prompt} 
                        setPrompt={setPrompt} 
                        formRef={formRef}
                    />
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
