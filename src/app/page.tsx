"use client";

import { useActionState, useEffect, useRef, useState, FormEvent } from "react";
import { useFormStatus } from "react-dom";
import { getAiResponse } from "@/app/actions";
import { CrowLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SendHorizonal, User, Plus, X, Sun, Moon, Copy, Pencil, LinkIcon, Mic, Paperclip } from "lucide-react";
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

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="icon" disabled={pending} className="shrink-0 rounded-full self-end">
      {pending ? (
        <div className="w-5 h-5 border-2 border-background border-t-primary rounded-full animate-spin"></div>
      ) : (
        <SendHorizonal className="h-5 w-5" />
      )}
      <span className="sr-only">Send message</span>
    </Button>
  );
}

const WelcomeView = ({ fileInputRef, handleFileChange, textareaRef, prompt, setPrompt, isRecording, handleMicClick, uploadedImagePreview, handleRemoveImage, formRef, onSubmit, pending }) => {

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey && prompt.trim() && !pending) {
        event.preventDefault();
        if (formRef.current) {
            const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
            formRef.current.dispatchEvent(submitEvent);
        }
      }
    };
    
    return (
        <div className="flex flex-col h-screen bg-background">
        <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <div className="w-full max-w-2xl">
                <div className="flex flex-col items-center justify-center gap-2 mb-4">
                    <CrowLogo className="w-28 h-28"/>
                    <h1 className="text-3xl sm:text-4xl font-bold">AeonAI</h1>
                </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">How can I help you today?</h2>
            <div className="mt-8 w-full">
                <form ref={formRef} action={onSubmit as any} className="contents">
                    <div className="flex items-start gap-2 md:gap-4 px-2 py-1.5 rounded-2xl bg-card border shadow-sm max-w-3xl mx-auto">
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
                            className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 resize-none max-h-48"
                            rows={1}
                            disabled={pending}
                        />
                        <Button type="button" variant="ghost" size="icon" className={cn("shrink-0 rounded-full", isRecording && "text-destructive")} onClick={handleMicClick} disabled={pending}>
                            <Mic className="h-5 w-5" />
                            <span className="sr-only">Use microphone</span>
                        </Button>
                        <SubmitButton />
                    </div>
                </form>
                {uploadedImagePreview && (
                    <div className="relative mt-2 mx-auto max-w-xs p-2 bg-muted rounded-lg flex items-center gap-2">
                        <Image src={uploadedImagePreview} alt="Preview" width={40} height={40} className="rounded-md" />
                        <span className="text-sm truncate">Image attached</span>
                        <Button variant="ghost" size="icon" className="ml-auto h-6 w-6 shrink-0" onClick={handleRemoveImage} disabled={pending}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
            </div>
        </main>
        <footer className="text-center p-4 text-xs text-muted-foreground">
            Developed by Bissu
        </footer>
        </div>
    );
};

const ChatView = ({ messages, prompt, setPrompt, uploadedImagePreview, theme, handleNewChat, toggleTheme, handleCopy, handleEdit, handleSuggestionClick, isRecording, handleMicClick, handleRemoveImage, formRef, fileInputRef, handleFileChange, textareaRef, viewportRef, onSubmit, pending }) => {

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey && prompt.trim() && !pending) {
          event.preventDefault();
          if (formRef.current) {
            const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
            formRef.current.dispatchEvent(submitEvent);
          }
      }
    };
    
    return (
        <div className="flex flex-col h-screen bg-background">
            <header className="flex items-center shrink-0 gap-2 md:gap-4 p-2 sm:p-4 border-b">
              <div className="flex items-center gap-2">
                <CrowLogo className="w-8 h-8"/>
                <div>
                  <h1 className="text-lg font-bold leading-none">AeonAI</h1>
                  <p className="text-xs text-muted-foreground">Developed by Bissu</p>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button onClick={toggleTheme} variant="outline" size="icon">
                    {theme === 'dark' ? <Sun size={20}/> : <Moon size={20} />}
                    <span className="sr-only">Toggle theme</span>
                </Button>
                <Button onClick={handleNewChat} variant="outline" size="sm">
                    <Plus size={16}/>
                    <span className="hidden md:inline ml-2">New Chat</span>
                </Button>
              </div>
            </header>
            <main className="flex-1 overflow-y-auto">
                <ScrollArea className="h-full" viewportRef={viewportRef}>
                  <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto w-full p-2 sm:p-4 md:p-6 pb-24 md:pb-28">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex flex-col",
                          message.sender === 'user' ? "items-end" : "items-start"
                        )}
                      >
                         {message.sender === 'ai' && message.sources && message.sources.length > 0 && (
                          <div className="flex flex-col items-start gap-2 mb-2 ml-10 md:ml-12">
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
                          "group flex items-start gap-2 md:gap-4 w-full",
                          message.sender === 'user' && "justify-end"
                        )}>
                          {message.sender === 'ai' && (
                            <Avatar className="w-8 h-8 border shrink-0">
                               <AvatarFallback>
                                  <CrowLogo className="w-5 h-5 text-muted-foreground" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                           {message.sender === 'user' && message.text && (
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleEdit(message)}>
                                    <Pencil size={16}/>
                                </Button>
                            </div>
                           )}
                          <div
                            className={cn(
                              "max-w-[85%] md:max-w-[75%] rounded-2xl px-3 py-2 md:px-4 md:py-3 text-sm prose dark:prose-invert prose-p:my-0",
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
                                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleCopy(message.text)}>
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
                          <div className="flex flex-wrap gap-2 mt-2 ml-10 md:ml-12">
                            {message.suggestions.map((suggestion, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => handleSuggestionClick(suggestion)}
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
                      <div className="flex items-start gap-2 md:gap-4">
                          <Avatar className="w-8 h-8 border shrink-0">
                             <AvatarFallback>
                                <CrowLogo className="w-5 h-5 text-primary animate-pulse" />
                             </AvatarFallback>
                          </Avatar>
                          <div className="max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 text-sm ai-message flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse delay-0"></div>
                              <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse delay-150"></div>
                              <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse delay-300"></div>
                          </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
            </main>
            <footer className="fixed bottom-0 left-0 right-0 p-2 md:p-4 bg-background/80 backdrop-blur-sm z-10">
                <form ref={formRef} action={onSubmit as any} className="contents">
                    <div className="max-w-4xl mx-auto w-full">
                    {uploadedImagePreview && (
                        <div className="relative mb-2 p-2 bg-muted rounded-lg flex items-center gap-2 max-w-sm mx-auto">
                            <Image src={uploadedImagePreview} alt="Preview" width={40} height={40} className="rounded-md" />
                            <span className="text-sm truncate">Image attached</span>
                            <Button variant="ghost" size="icon" className="ml-auto h-6 w-6 shrink-0" onClick={handleRemoveImage} disabled={pending}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                    <div className="flex items-start gap-2 md:gap-4 px-2 py-1.5 rounded-2xl bg-card border shadow-sm">
                        <Button type="button" variant="ghost" size="icon" className="shrink-0 rounded-full self-center" onClick={() => fileInputRef.current?.click()} disabled={pending}>
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
                        className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 resize-none max-h-48"
                        rows={1}
                        disabled={pending}
                        />
                        <Button type="button" variant="ghost" size="icon" className={cn("shrink-0 rounded-full self-center", isRecording && "text-destructive")} onClick={handleMicClick} disabled={pending}>
                            <Mic className="h-5 w-5" />
                            <span className="sr-only">Use microphone</span>
                        </Button>
                        <SubmitButton />
                    </div>
                    </div>
                </form>
            </footer>
        </div>
      );
};


function AppContent({
    state,
    formAction,
}) {
    const { pending } = useFormStatus();
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [prompt, setPrompt] = useState("");
    const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
    const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
    const [theme, setTheme] = useState('dark');
    const [isRecording, setIsRecording] = useState(false);

    useEffect(() => {
        const storedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(storedTheme);
        document.documentElement.classList.add(storedTheme);
    }, []);

    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

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
                    const insertIndex = editedMessageIndex + 1;
                    if (insertIndex < newMessages.length && newMessages[insertIndex].sender === 'ai') {
                        newMessages[insertIndex] = newAiMessage;
                    } else {
                        newMessages.splice(insertIndex, 0, newAiMessage);
                    }
                    return newMessages;
                });
                setEditingMessageId(null);
            } else {
                setMessages((prev) => [...prev, newAiMessage]);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${scrollHeight}px`;
        }
    }, [prompt]);

    useEffect(() => {
        if (viewportRef.current) {
            viewportRef.current.scrollTo({
                top: viewportRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [messages, pending]);

    const handleClientSideSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (pending) return;

        const formData = new FormData(event.currentTarget);
        const currentPrompt = formData.get("prompt") as string;
        
        if ((!currentPrompt || currentPrompt.trim().length === 0) && !uploadedImagePreview) {
            return;
        }
        
        const userMessage: Message = {
            id: Date.now(),
            sender: 'user',
            text: currentPrompt,
            imageUrl: uploadedImagePreview ?? undefined,
        };

        if (editingMessageId !== null) {
            setMessages(prev => {
                const newMessages = [...prev];
                const editedMessageIndex = newMessages.findIndex(m => m.id === editingMessageId);
                if (editedMessageIndex !== -1) {
                    newMessages[editedMessageIndex] = { ...newMessages[editedMessageIndex], text: currentPrompt, imageUrl: uploadedImagePreview || newMessages[editedMessageIndex].imageUrl };
                    if (editedMessageIndex + 1 < newMessages.length && newMessages[editedMessageIndex + 1].sender === 'ai') {
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

        setPrompt("");
        setUploadedImagePreview(null);
        if (formRef.current) {
            const fileInput = formRef.current.querySelector('input[type="file"]') as HTMLInputElement;
            if (fileInput) fileInput.value = "";
        }
        
        formAction(formData);
    };


    const handleRemoveImage = () => {
        setUploadedImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        if (pending) return;
        setPrompt(suggestion);
        setTimeout(() => {
            if (formRef.current) {
                const formData = new FormData(formRef.current);
                formData.set('prompt', suggestion);
                const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
                formRef.current.dispatchEvent(submitEvent);
            }
        }, 100);
    }

    const handleNewChat = () => {
        setMessages([]);
        handleRemoveImage();
        setEditingMessageId(null);
    };

    const toggleTheme = () => {
        setTheme(prevTheme => {
            const newTheme = prevTheme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(newTheme);
            return newTheme;
        });
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied!",
            description: "The message has been copied to your clipboard.",
        });
    }

    const handleEdit = (message: Message) => {
        if (pending) return;
        setEditingMessageId(message.id);
        setPrompt(message.text);
        if (message.imageUrl) {
            setUploadedImagePreview(message.imageUrl);
        } else {
            handleRemoveImage();
        }
        textareaRef.current?.focus();
    }

    const handleMicClick = () => {
        if (pending || isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
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

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setUploadedImagePreview(URL.createObjectURL(file));
        }
    };
    
    const commonProps = {
        fileInputRef,
        handleFileChange,
        textareaRef,
        prompt,
        setPrompt,
        isRecording,
        handleMicClick,
        uploadedImagePreview,
        handleRemoveImage,
        formRef,
        onSubmit: handleClientSideSubmit,
        pending
    };

    if (messages.length === 0 && !pending) {
        return <WelcomeView {...commonProps} />;
    }
    
    return <ChatView
        {...commonProps}
        messages={messages}
        theme={theme}
        handleNewChat={handleNewChat}
        toggleTheme={toggleTheme}
        handleCopy={handleCopy}
        handleEdit={handleEdit}
        handleSuggestionClick={handleSuggestionClick}
        viewportRef={viewportRef}
    />
}

export default function Home() {
    const [state, formAction] = useActionState(getAiResponse, initialState);

    return (
        <form
            onSubmit={e => {
                // This form submission is now handled by handleClientSideSubmit,
                // which calls formAction manually. We prevent default here
                // to avoid a double submission.
                e.preventDefault();
            }}
            // The `action` attribute is still needed for progressive enhancement,
            // but our client-side logic will take precedence.
            action={formAction}
            className="contents"
        >
            <AppContent
                state={state}
                formAction={formAction}
            />
        </form>
    );
}