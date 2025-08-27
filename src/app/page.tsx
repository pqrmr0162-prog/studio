"use client";

import { useActionState, useEffect, useRef, useState, useLayoutEffect } from "react";
import { useFormStatus } from "react-dom";
import { getAiResponse } from "@/app/actions";
import { AeonLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, Mic, SendHorizonal, Plus, Moon, Sun, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

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

const WelcomeView = ({ setPrompt, formRef }) => {
  const [prompt, setLocalPrompt] = useState("");
  const { pending } = useFormStatus();

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' && !event.shiftKey && prompt.trim() && !pending) {
        event.preventDefault();
        setPrompt(prompt);
         setTimeout(() => {
            if (formRef.current) {
                formRef.current.requestSubmit();
            }
        }, 0);
      }
    };
  return (
    <div className="h-screen flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <div className="flex items-center gap-4 mb-6">
            <AeonLogo className="w-16 h-16 text-primary" />
            <h1 className="text-6xl font-semibold">AeonAI</h1>
        </div>
        <h2 className="text-4xl font-medium text-muted-foreground mb-12">How can I help you today?</h2>
        
      </main>
      <footer className="p-4 z-10 w-full flex flex-col items-center gap-4">
         <div className="w-full max-w-2xl mx-auto">
            <div className="relative flex items-center gap-2 rounded-full bg-[#1e1f20] border border-border/50 shadow-lg px-4 py-2">
                <Button variant="ghost" size="icon" className="shrink-0">
                    <Paperclip className="h-5 w-5" />
                    <span className="sr-only">Attach file</span>
                </Button>
                <Input
                    name="prompt"
                    placeholder="Ask about an image or just chat. Try 'generate image of a cat'"
                    autoComplete="off"
                    value={prompt}
                    onChange={(e) => setLocalPrompt(e.target.value)}
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
        <p className="text-sm text-muted-foreground/50">Created by Bissu</p>
      </footer>
    </div>
  );
};


const ChatView = ({ messages, pending }: { messages: any[], pending: boolean }) => {
    const viewportRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (viewportRef.current) {
            viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
        }
    }, [messages, pending]);

    return (
        <ScrollArea className="flex-1 pb-24" viewportRef={viewportRef}>
            <div className="px-4 py-6 md:px-6 lg:py-8 space-y-6 max-w-4xl mx-auto">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                         {msg.role !== 'user' && (
                            <Avatar className="w-9 h-9 border">
                                <AvatarFallback><AeonLogo className="w-5 h-5" /></AvatarFallback>
                            </Avatar>
                        )}
                        <div className={cn(
                            "rounded-2xl p-4 max-w-[80%]",
                            msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-secondary text-secondary-foreground rounded-bl-none'
                        )}>
                            <div className="prose prose-invert text-inherit">
                                {msg.imageUrl ? (
                                    <img src={msg.imageUrl} alt="Generated" className="rounded-lg" />
                                ) : (
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                )}
                            </div>
                        </div>
                        {msg.role === 'user' && (
                            <Avatar className="w-9 h-9 border">
                                <AvatarFallback><User className="w-5 h-5"/></AvatarFallback>
                            </Avatar>
                        )}
                    </div>
                ))}
                {pending && (
                     <div className="flex items-start gap-4">
                        <Avatar className="w-9 h-9 border">
                           <AvatarFallback><AeonLogo className="w-5 h-5" /></AvatarFallback>
                        </Avatar>
                        <div className="rounded-2xl p-4 bg-secondary text-secondary-foreground rounded-bl-none">
                            <Skeleton className="h-5 w-32" />
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>
    );
};

const ChatInput = ({ prompt, setPrompt, formRef, disabled }) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && prompt.trim() && !disabled) {
      event.preventDefault();
      if (formRef.current) {
        formRef.current.requestSubmit();
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
        <div className="relative flex items-center gap-2 rounded-full bg-[#1e1f20] border border-border/50 shadow-lg px-4 py-2">
            <Input
                name="prompt"
                placeholder="Ask a follow-up..."
                autoComplete="off"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 text-base placeholder:text-muted-foreground/80"
                disabled={disabled}
            />
            <button type="button" className="shrink-0 text-muted-foreground hover:text-foreground">
                <Mic className="h-5 w-5" />
                <span className="sr-only">Use microphone</span>
            </button>
            <SubmitButton disabled={disabled || !prompt.trim()} />
        </div>
    </div>
  );
};


const AppContent = ({ messages, prompt, setPrompt, formRef }) => {
    const { pending } = useFormStatus();
    const [theme, setTheme] = useState('dark');
    
    useEffect(() => {
        // On mount, set the theme based on the class on the html element
        const isDarkMode = document.documentElement.classList.contains('dark');
        setTheme(isDarkMode ? 'dark' : 'light');
    }, []);


    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    return (
         <div className="flex flex-col h-screen bg-background">
            <header className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                    <AeonLogo className="w-7 h-7" />
                    <span className="text-xl font-semibold">AeonAI Assistant</span>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => window.location.reload()}>
                        <Plus />
                        <span className="sr-only">New Chat</span>
                    </Button>
                     <Button variant="ghost" size="icon" onClick={toggleTheme}>
                        {theme === 'dark' ? <Sun /> : <Moon />}
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                </div>
            </header>
            <ChatView messages={messages} pending={pending} />
            <footer className="fixed bottom-0 left-0 right-0 p-4 z-10 w-full flex flex-col items-center gap-4 bg-background/50 backdrop-blur-sm">
                <ChatInput prompt={prompt} setPrompt={setPrompt} formRef={formRef} disabled={pending} />
            </footer>
        </div>
    );
};


function Home() {
    const [state, formAction] = useActionState(getAiResponse, initialState);
    const formRef = useRef<HTMLFormElement>(null);
    const { toast } = useToast();
    const [prompt, setPrompt] = useState("");
    const [messages, setMessages] = useState<any[]>([]); 

    useEffect(() => {
        if (state?.error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: state.error,
            });
        }
        if (state?.response || state?.imageUrl) {
             setMessages(prev => [...prev, { 
                role: 'ai', 
                content: state.response,
                imageUrl: state.imageUrl,
                sources: state.sources,
                suggestions: state.suggestions,
            }]);
            setPrompt(""); // Clear input after AI response
        }
    }, [state, toast]);

    useEffect(() => {
        document.documentElement.classList.add('dark');
    }, []);

    const handleFormAction = (formData: FormData) => {
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
                <AppContent messages={messages} prompt={prompt} setPrompt={setPrompt} formRef={formRef} />
            )}
        </form>
    );
}

export default Home;
