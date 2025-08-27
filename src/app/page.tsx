
"use client";

import { useActionState, useEffect, useRef, useState, useCallback, useTransition, useLayoutEffect } from "react";
import { useFormStatus } from "react-dom";
import { getAiResponse } from "@/app/actions";
import { CrowLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SendHorizonal, User, Plus, X, Sun, Moon, Copy, Pencil, Link as LinkIcon, Mic, Paperclip } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import React from "react";

const initialState = {
  response: null,
  suggestions: null,
  sources: null,
  imageUrl: null,
  error: null,
};

interface Message {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  imageUrl?: string;
  suggestions?: string[];
  sources?: { title: string; url: string }[];
}

function SubmitButton({ disabled }: { disabled: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" size="icon" disabled={disabled || pending} className="shrink-0 rounded-full">
            {pending ? (
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-current"></div>
            ) : (
                <SendHorizonal className="h-5 w-5" />
            )}
            <span className="sr-only">Send message</span>
        </Button>
    );
}

const MessageInput = ({ prompt, setPrompt, formRef, uploadedImagePreview, setUploadedImagePreview }) => {
    const { pending } = useFormStatus();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);
    const { toast } = useToast();

    const adjustTextareaHeight = useCallback(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, []);

    useEffect(() => {
        adjustTextareaHeight();
        window.addEventListener('resize', adjustTextareaHeight);
        return () => window.removeEventListener('resize', adjustTextareaHeight);
    }, [adjustTextareaHeight, prompt]);
    
    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey && (prompt.trim() || uploadedImagePreview) && !pending) {
        event.preventDefault();
        // Trigger the form submission by programmatically clicking the submit button
        if (formRef.current) {
          const submitButton = formRef.current.querySelector('button[type="submit"]') as HTMLButtonElement;
          submitButton?.click();
        }
      }
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setUploadedImagePreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = () => {
        setUploadedImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
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
            toast({ title: "Listening..." });
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
        {uploadedImagePreview && (
          <div className="relative mb-2 p-2 bg-muted rounded-lg flex items-center gap-2 max-w-sm mx-auto">
            <Image src={uploadedImagePreview} alt="Preview" width={40} height={40} className="rounded-md" />
            <span className="text-sm truncate">Image attached</span>
            <Button variant="ghost" size="icon" className="ml-auto h-6 w-6 shrink-0" onClick={handleRemoveImage} disabled={pending}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="relative flex items-start gap-2 md:gap-4 px-2 py-1.5 rounded-2xl bg-card border shadow-sm max-w-3xl mx-auto">
          <Button type="button" variant="ghost" size="icon" className="shrink-0 rounded-full" onClick={() => fileInputRef.current?.click()} disabled={pending}>
            <Paperclip className="h-5 w-5" />
            <span className="sr-only">Upload file</span>
          </Button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} name="uploadedFile" accept="image/*,application/pdf,.txt,.md" className="hidden" disabled={pending} />

          <Textarea
            ref={textareaRef}
            name="prompt"
            placeholder="Message AeonAI..."
            autoComplete="off"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 resize-none max-h-48"
            rows={1}
            disabled={pending}
          />
          <Button type="button" variant="ghost" size="icon" className={cn("shrink-0 rounded-full", isRecording && "text-destructive")} onClick={handleMicClick} disabled={pending}>
            <Mic className="h-5 w-5" />
            <span className="sr-only">Use microphone</span>
          </Button>
          <SubmitButton disabled={!prompt.trim() && !uploadedImagePreview}/>
        </div>
      </div>
    );
};


const WelcomeView = ({ onFormSubmit, setPrompt, prompt, formRef, uploadedImagePreview, setUploadedImagePreview }) => {
    return (
        <div className="flex flex-col h-screen bg-background p-4 md:p-6 lg:p-8">
            <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <div className="w-full max-w-2xl">
                    <div className="flex flex-col items-center justify-center gap-2 mb-4">
                        <CrowLogo className="w-28 h-28 sm:w-32 sm:h-32"/>
                        <h1 className="text-3xl sm:text-4xl font-bold">AeonAI</h1>
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">How can I help you today?</h2>
                    <div className="mt-8 w-full">
                       <MessageInput 
                          prompt={prompt} 
                          setPrompt={setPrompt} 
                          formRef={formRef} 
                          uploadedImagePreview={uploadedImagePreview}
                          setUploadedImagePreview={setUploadedImagePreview}
                        />
                    </div>
                </div>
            </main>
            <footer className="text-center p-4 text-xs text-muted-foreground">
                Developed by Bissu
            </footer>
        </div>
    );
};

const ChatView = ({ messages, setMessages, onFormSubmit, viewportRef, editingMessageId, setEditingMessageId, theme, toggleTheme, prompt, setPrompt, formRef, uploadedImagePreview, setUploadedImagePreview }) => {
    const { pending } = useFormStatus();
    const { toast } = useToast();
    
    const useChatActions = () => {
        const handleCopy = (text: string) => {
            navigator.clipboard.writeText(text);
            toast({
                title: "Copied!",
                description: "The message has been copied to your clipboard.",
            });
        };
        
        const handleEdit = (message: Message) => {
            if (pending) return;
            setEditingMessageId(message.id);
            setPrompt(message.text);
            
            setTimeout(() => {
                const textarea = formRef.current?.querySelector('textarea');
                textarea?.focus();
            }, 0);
        };
        
        const handleSuggestionClick = (suggestion: string) => {
            if (pending) return;
            
            // We can't use `formRef.current.requestSubmit()` because we're not inside the form.
            // So, we'll manually call the `onFormSubmit` function with the suggestion.
            const formData = new FormData();
            formData.append('prompt', suggestion);
            onFormSubmit(formData);
        };
        
        const handleNewChat = () => {
            setMessages([]);
            setPrompt("");
            setEditingMessageId(null);
            setUploadedImagePreview(null);
            if (formRef.current) {
              formRef.current.reset();
            }
        };

        return { handleCopy, handleEdit, handleSuggestionClick, handleNewChat };
    }

    const chatActions = useChatActions();

    return (
        <div className="flex flex-col h-screen bg-background">
            <header className="flex items-center shrink-0 gap-4 p-2 sm:p-4">
              <div className="flex items-center gap-2">
                <CrowLogo className="w-8 h-8"/>
                <div>
                  <h1 className="text-lg font-bold leading-none">AeonAI</h1>
                  <p className="text-xs text-muted-foreground">Developed by Bissu</p>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button onClick={toggleTheme} variant="ghost" size="icon">
                    {theme === 'dark' ? <Sun size={20}/> : <Moon size={20} />}
                    <span className="sr-only">Toggle theme</span>
                </Button>
                <Button onClick={() => chatActions.handleNewChat()} variant="outline">
                    <Plus size={16}/>
                    <span className="hidden md:inline ml-2">New Chat</span>
                </Button>
                <Avatar className="w-8 h-8 border">
                    <AvatarFallback><User size={16}/></AvatarFallback>
                </Avatar>
              </div>
            </header>
            <main className="flex-1 overflow-y-auto">
                <ScrollArea className="h-full" viewportRef={viewportRef}>
                  <div className="space-y-6 max-w-4xl mx-auto w-full p-2 sm:p-6 pb-24 md:pb-32">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex flex-col",
                          message.sender === 'user' ? "items-end" : "items-start"
                        )}
                      >
                         {message.sender === 'ai' && message.sources && message.sources.length > 0 && (
                          <div className="flex flex-col items-start gap-2 mb-2 ml-12">
                              <h3 className="text-sm font-semibold flex items-center gap-2">
                                  <LinkIcon size={14} />
                                  Sources
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                  {message.sources.map((source, index) => (
                                      <Button key={index} variant="outline" size="sm" asChild className="text-xs">
                                          <Link href={source.url} target="_blank" rel="noopener noreferrer">
                                              {source.title}
                                          </Link>
                                      </Button>
                                  ))}
                              </div>
                          </div>
                        )}
                        <div className={cn(
                          "group flex items-start gap-2 sm:gap-4 w-full",
                          message.sender === 'user' && "justify-end"
                        )}>
                          {message.sender === 'ai' && (
                            <Avatar className="w-8 h-8 border shrink-0">
                               <AvatarFallback>A</AvatarFallback>
                            </Avatar>
                          )}
                           {message.sender === 'user' && message.text && (
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => chatActions.handleEdit(message)}>
                                    <Pencil size={16}/>
                                </Button>
                            </div>
                           )}
                          <div
                            className={cn(
                              "max-w-[85%] rounded-2xl px-3 sm:px-4 py-3 text-sm prose dark:prose-invert prose-p:my-0",
                               message.sender === 'user' ? "user-message" : "ai-message"
                            )}
                          >
                            {message.imageUrl && (
                              <div className="relative aspect-square not-prose my-2">
                                <Image
                                    src={message.imageUrl}
                                    alt={message.text || "Generated or uploaded image"}
                                    fill
                                    className="rounded-lg object-cover"
                                />
                              </div>
                            )}
                            
                            {message.text && (
                              message.sender === 'ai' ? (
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {message.text}
                                  </ReactMarkdown>
                              ) : (
                                  <p className="whitespace-pre-wrap">{message.text}</p>
                              )
                            )}
                          </div>
                          {message.sender === 'ai' && message.text && (
                              <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => chatActions.handleCopy(message.text)}>
                                      <Copy size={16}/>
                                  </Button>
                              </div>
                           )}
                          {message.sender === 'user' && (
                            <Avatar className="w-8 h-8 border shrink-0">
                               <AvatarFallback><User size={16}/></AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                        {message.sender === 'ai' && message.suggestions && (
                          <div className="flex flex-wrap gap-2 mt-2 ml-12">
                            {message.suggestions.map((suggestion, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => chatActions.handleSuggestionClick(suggestion)}
                                className="text-xs"
                                disabled={pending}
                              >
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {pending && (
                      <div className="flex items-start gap-2 sm:gap-4">
                          <Avatar className="w-8 h-8 border shrink-0">
                             <AvatarFallback>A</AvatarFallback>
                          </Avatar>
                          <div className="flex items-center gap-1.5 py-3">
                              <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse delay-0"></div>
                              <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse delay-150"></div>
                              <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse delay-300"></div>
                          </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
            </main>
            <footer className="fixed bottom-0 left-0 right-0 p-2 sm:p-4 bg-background/80 backdrop-blur-sm z-10">
              <MessageInput 
                prompt={prompt} 
                setPrompt={setPrompt} 
                formRef={formRef}
                uploadedImagePreview={uploadedImagePreview}
                setUploadedImagePreview={setUploadedImagePreview}
              />
            </footer>
        </div>
      );
};

function AppContent({ state, formAction }) {
    const { toast } = useToast();
    const viewportRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [prompt, setPrompt] = useState("");
    const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
    const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
    const [theme, setTheme] = useState('dark');
    
    const [isPending, startTransition] = useTransition();

    useLayoutEffect(() => {
        const storedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(storedTheme);
        document.documentElement.classList.toggle('dark', storedTheme === 'dark');

        setMessages([
          {
            id: Date.now(),
            sender: 'ai',
            text: "Hello! How can I assist you today? I am AeonAI, a helpful assistant created by Bissu using Google's powerful data and models. My own unique model is known as Aeon-1s.",
            suggestions: [
                "What basic can AeonAI perform?",
                "Can you compare AeonAI to other AI models like ChatGPT?",
                "Help me brainstorm some ideas for my project."
            ]
          }
        ]);
    }, []);

    const toggleTheme = () => {
        setTheme(prevTheme => {
            const newTheme = prevTheme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            document.documentElement.classList.toggle('dark', newTheme === 'dark');
            return newTheme;
        });
    };

    useEffect(() => {
        if (!state) return;

        if (state.error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: state.error,
            });
            if (editingMessageId === null && messages[messages.length - 1]?.sender === 'user') {
                setMessages(prev => prev.slice(0, -1));
            }
        } else if (state.response || state.imageUrl) {
            const newAiMessage: Message = {
                id: Date.now(),
                sender: 'ai',
                text: state.response || "",
                imageUrl: state.imageUrl || undefined,
                suggestions: state.suggestions || undefined,
                sources: state.sources || undefined,
            };

            if (editingMessageId !== null) {
                setMessages(prev => {
                    const newMessages = [...prev];
                    const editedMessageIndex = newMessages.findIndex(m => m.id === editingMessageId);
                    if (editedMessageIndex !== -1) {
                        if (newMessages[editedMessageIndex + 1]?.sender === 'ai') {
                            newMessages[editedMessageIndex + 1] = newAiMessage;
                        } else {
                            newMessages.splice(editedMessageIndex + 1, 0, newAiMessage);
                        }
                    }
                    return newMessages;
                });
                setEditingMessageId(null);
            } else {
                setMessages((prev) => [...prev, newAiMessage]);
            }
        }
    }, [state, toast, editingMessageId, messages]);

    useEffect(() => {
        if (viewportRef.current) {
            viewportRef.current.scrollTo({
                top: viewportRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [messages, isPending]);


    const handleFormSubmit = (formData: FormData) => {
        const currentPrompt = formData.get("prompt") as string;
        const uploadedFile = formData.get("uploadedFile") as File;

        if (!currentPrompt?.trim() && (!uploadedFile || uploadedFile.size === 0)) {
            return;
        }

        const userMessage: Message = {
            id: Date.now(),
            sender: 'user',
            text: currentPrompt,
            imageUrl: uploadedImagePreview || undefined,
        };
        
        startTransition(() => {
            if (editingMessageId !== null) {
                 setMessages(prev => {
                    const newMessages = [...prev];
                    const editedMessageIndex = newMessages.findIndex(m => m.id === editingMessageId);
                    if (editedMessageIndex !== -1) {
                        newMessages[editedMessageIndex] = { ...userMessage, id: editingMessageId };
                         if (newMessages[editedMessageIndex + 1]?.sender === 'ai') {
                             newMessages.splice(editedMessageIndex + 1, 1);
                         }
                    }
                    return newMessages;
                });
            } else {
                 setMessages(prev => {
                    const newMessages = prev.map(m => ({ ...m, suggestions: undefined }));
                    return [...newMessages, userMessage];
                });
            }

            formAction(formData);

            setPrompt("");
            setUploadedImagePreview(null);
            if (formRef.current) {
                const fileInput = formRef.current.querySelector('input[type="file"]') as HTMLInputElement;
                if(fileInput) fileInput.value = "";
            }
        });
    };

    return (
        <form ref={formRef} action={handleFormSubmit} className="contents">
            <ChatView
                messages={messages}
                setMessages={setMessages}
                onFormSubmit={handleFormSubmit}
                viewportRef={viewportRef}
                editingMessageId={editingMessageId}
                setEditingMessageId={setEditingMessageId}
                theme={theme}
                toggleTheme={toggleTheme}
                prompt={prompt}
                setPrompt={setPrompt}
                formRef={formRef}
                uploadedImagePreview={uploadedImagePreview}
                setUploadedImagePreview={setUploadedImagePreview}
            />
        </form>
    );
}

function Home() {
    const [state, formAction] = useActionState(getAiResponse, initialState);
    return <AppContent state={state} formAction={formAction} />;
}

export default Home;

    