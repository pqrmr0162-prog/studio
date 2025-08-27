
"use client";

import { useActionState, useEffect, useRef, useState, useLayoutEffect } from "react";
import { useFormStatus } from "react-dom";
import { getAiResponse } from "@/app/actions";
import { CrowLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, Mic, SendHorizonal, Plus, Moon, Sun, User, ExternalLink, File, X } from "lucide-react";
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
        <Button type="submit" size="icon" disabled={disabled || pending} className="shrink-0 rounded-full w-8 h-8 bg-primary hover:bg-primary/90 text-primary-foreground">
            {pending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-current"></div>
            ) : (
                <SendHorizonal className="h-4 w-4" />
            )}
            <span className="sr-only">Send message</span>
        </Button>
    );
}

const WelcomeFormContent = ({ setPrompt, formRef, uploadedFile, setUploadedFile, toggleListening, isListening }) => {
    const [prompt, setLocalPrompt] = useState("");
    const { pending } = useFormStatus();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' && !event.shiftKey && (prompt.trim() || uploadedFile) && !pending) {
        event.preventDefault();
        setPrompt(prompt);
         setTimeout(() => {
            if (formRef.current) {
                formRef.current.requestSubmit();
            }
        }, 0);
      }
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setUploadedFile(file);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className={cn("relative flex items-center gap-2 rounded-full bg-secondary dark:bg-card border shadow-lg px-2 py-1")}>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,application/pdf,.txt"
                />
                <Button variant="ghost" size="icon" className="shrink-0 w-8 h-8" onClick={() => fileInputRef.current?.click()} disabled={pending}>
                    <Paperclip className="h-4 w-4" />
                    <span className="sr-only">Attach file</span>
                </Button>
                {uploadedFile ? (
                    <div className="flex items-center gap-2 bg-background/50 rounded-full px-3 py-1 text-sm">
                        <File className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate max-w-xs">{uploadedFile.name}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full -mr-2" onClick={() => setUploadedFile(null)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <Input
                        name="prompt"
                        placeholder="Ask about image or just chat......."
                        autoComplete="off"
                        value={prompt}
                        onChange={(e) => setLocalPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 text-base placeholder:text-muted-foreground/80 placeholder:text-sm h-8"
                        disabled={pending || isListening}
                    />
                )}
                 <button type="button" onClick={toggleListening} className={cn("shrink-0 text-muted-foreground hover:text-foreground p-2", isListening && "text-primary animate-pulse")}>
                    <Mic className="h-4 w-4" />
                    <span className="sr-only">Use microphone</span>
                </button>
                <SubmitButton disabled={!(prompt.trim() || uploadedFile)}/>
            </div>
        </div>
    );
};


const WelcomeView = ({ setPrompt, formRef, theme, toggleTheme, uploadedFile, setUploadedFile, toggleListening, isListening }) => {
  return (
    <div className="h-screen flex flex-col items-center justify-center text-center px-4">
       <header className="absolute top-0 right-0 p-4">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun /> : <Moon />}
                <span className="sr-only">Toggle theme</span>
            </Button>
        </header>
      <main className="flex-1 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4 mb-6">
            <CrowLogo className="w-20 h-20 md:w-24 md:h-24 text-primary animate-shine" />
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold">AeonAI</h1>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium text-muted-foreground mb-12">How can I help you today?</h2>
        
        <WelcomeFormContent setPrompt={setPrompt} formRef={formRef} uploadedFile={uploadedFile} setUploadedFile={setUploadedFile} toggleListening={toggleListening} isListening={isListening} />

      </main>
      <footer className="p-4 z-10 w-full flex flex-col items-center gap-4">
        <p className="text-sm text-muted-foreground/50">Developed by Bissu</p>
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
            <div className="px-4 py-6 md:px-6 lg:py-8 space-y-4 max-w-4xl mx-auto">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                         {msg.role !== 'user' && (
                            <Avatar className="w-8 h-8 border">
                                <AvatarFallback><CrowLogo className="w-4 h-4" /></AvatarFallback>
                            </Avatar>
                        )}
                        <div className={cn(
                            "rounded-xl p-2.5 max-w-[80%] text-sm",
                            msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-secondary text-secondary-foreground rounded-bl-none'
                        )}>
                            <div className="prose-sm dark:prose-invert text-inherit max-w-none">
                                {msg.imageUrl ? (
                                    <img src={msg.imageUrl} alt="Generated" className="rounded-lg" />
                                ) : (
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                )}
                            </div>
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-3 border-t border-border/50 pt-2">
                                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">SOURCES</h4>
                                    <div className="space-y-2">
                                        {msg.sources.map((source, i) => (
                                            <a 
                                                key={i} 
                                                href={source.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="flex items-center gap-2 text-xs text-primary/80 hover:text-primary transition-colors"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                                <span className="truncate">{source.title}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        {msg.role === 'user' && (
                            <Avatar className="w-8 h-8 border">
                                <AvatarFallback><User className="w-4 h-4"/></AvatarFallback>
                            </Avatar>
                        )}
                    </div>
                ))}
                {pending && (
                     <div className="flex items-start gap-3">
                        <Avatar className="w-8 h-8 border">
                           <AvatarFallback><CrowLogo className="w-4 h-4" /></AvatarFallback>
                        </Avatar>
                        <div className="rounded-xl p-3 bg-secondary text-secondary-foreground rounded-bl-none">
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>
    );
};

const ChatInput = ({ prompt, setPrompt, formRef, disabled, uploadedFile, setUploadedFile, toggleListening, isListening }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isTyping, setIsTyping] = useState(false);
    const typingTimer = useRef<NodeJS.Timeout | null>(null);
    const TYPING_TIMEOUT = 1000;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && (prompt.trim() || uploadedFile) && !disabled) {
      event.preventDefault();
      if (formRef.current) {
        formRef.current.requestSubmit();
      }
    }
  };
  
  const handlePromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrompt(e.target.value);
    setIsTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setIsTyping(false), TYPING_TIMEOUT);
  };
  
   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setUploadedFile(file);
        }
    };
    
    useEffect(() => {
        return () => {
            if (typingTimer.current) clearTimeout(typingTimer.current);
        }
    }, []);

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
        <div className={cn("relative flex items-center gap-2 rounded-full bg-secondary dark:bg-card border shadow-lg px-2 py-1 transition-all")}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,application/pdf,.txt"
            />
            <Button variant="ghost" size="icon" className="shrink-0 w-8 h-8" onClick={() => fileInputRef.current?.click()} disabled={disabled}>
                <Paperclip className="h-4 w-4" />
                <span className="sr-only">Attach file</span>
            </Button>
            {uploadedFile ? (
                <div className="flex items-center gap-2 bg-background/50 rounded-full px-3 py-1 text-sm">
                    <File className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate max-w-xs">{uploadedFile.name}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full -mr-2" onClick={() => setUploadedFile(null)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <Input
                    name="prompt"
                    placeholder="Ask a follow-up..."
                    autoComplete="off"
                    value={prompt}
                    onChange={handlePromptChange}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 text-base placeholder:text-muted-foreground/80 h-8"
                    disabled={disabled || isListening}
                />
            )}
            <button type="button" onClick={toggleListening} className={cn("shrink-0 text-muted-foreground hover:text-foreground p-2", isListening && "text-primary animate-pulse")}>
                <Mic className="h-4 w-4" />
                <span className="sr-only">Use microphone</span>
            </button>
            <SubmitButton disabled={disabled || !(prompt.trim() || uploadedFile)} />
        </div>
    </div>
  );
};


const AppContent = ({ messages, prompt, setPrompt, formRef, theme, toggleTheme, uploadedFile, setUploadedFile, toggleListening, isListening }) => {
    const { pending } = useFormStatus();

    return (
         <div className="flex flex-col h-screen bg-background">
            <header className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                    <CrowLogo className="w-7 h-7 animate-shine" />
                    <div>
                        <h1 className="text-base sm:text-lg md:text-xl font-semibold">AeonAI Assistant</h1>
                        <p className="text-xs text-muted-foreground">Developed by Bissu</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
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
                <ChatInput prompt={prompt} setPrompt={setPrompt} formRef={formRef} disabled={pending} uploadedFile={uploadedFile} setUploadedFile={setUploadedFile} toggleListening={toggleListening} isListening={isListening} />
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
    const [theme, setTheme] = useState('dark');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

    const recognitionRef = useRef<any>(null);
    const [isListening, setIsListening] = useState(false);
    
    useEffect(() => {
        const storedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        setTheme(storedTheme);
        if (storedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };


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
            setPrompt(""); 
            setUploadedFile(null);
        }
    }, [state, toast]);
    
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            // We can toast here, but let's avoid it on initial load.
            // It will be handled in toggleListening if the user tries to use it.
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
             setPrompt(finalTranscript + interimTranscript);
        };
        
        recognition.onend = () => {
            setIsListening(false);
             if (formRef.current && (prompt.trim() || uploadedFile)) {
                setTimeout(() => formRef.current?.requestSubmit(), 0);
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            toast({
                variant: 'destructive',
                title: 'Microphone Error',
                description: `An error occurred: ${event.error}. Please try again.`,
            });
            setIsListening(false);
        };
        
        recognitionRef.current = recognition;

    }, [prompt, uploadedFile, toast]);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            toast({
                variant: 'destructive',
                title: 'Unsupported Feature',
                description: 'Your browser does not support speech recognition.',
            });
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setPrompt(''); // Clear prompt before starting
            recognitionRef.current.start();
        }
        setIsListening(!isListening);
    };

    const handleFormAction = (formData: FormData) => {
        // Stop listening if it's active
        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }

        const currentPrompt = formData.get("prompt") as string;
        if (!currentPrompt && !uploadedFile) return;

        setMessages(prev => [...prev, { role: 'user', content: currentPrompt || `Attached: ${uploadedFile?.name}` }]);
        
        const newFormData = new FormData();
        newFormData.append('prompt', currentPrompt);
        if (uploadedFile) {
            newFormData.append('uploadedFile', uploadedFile);
        }
        
        formAction(newFormData);
    };

    return (
        <form ref={formRef} action={handleFormAction} className="contents">
            {messages.length === 0 ? (
                <WelcomeView setPrompt={setPrompt} formRef={formRef} theme={theme} toggleTheme={toggleTheme} uploadedFile={uploadedFile} setUploadedFile={setUploadedFile} toggleListening={toggleListening} isListening={isListening} />
            ) : (
                <AppContent messages={messages} prompt={prompt} setPrompt={setPrompt} formRef={formRef} theme={theme} toggleTheme={toggleTheme} uploadedFile={uploadedFile} setUploadedFile={setUploadedFile} toggleListening={toggleListening} isListening={isListening} />
            )}
        </form>
    );
}

export default Home;

    
