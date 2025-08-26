
"use client";

import { useActionState, useEffect, useRef, useState, FormEvent, useCallback } from "react";
import { useFormStatus } from "react-dom";
import { getAiResponse } from "@/app/actions";
import { CrowLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SendHorizonal, User, Plus, X, Sun, Moon, Copy, Pencil, Link as LinkIcon, Mic, Paperclip, LoaderCircle } from "lucide-react";
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
    <Button type="submit" size="icon" disabled={pending} className="shrink-0 rounded-full">
       {pending ? (
        <LoaderCircle className="h-5 w-5 animate-spin" />
      ) : (
        <SendHorizonal className="h-5 w-5" />
      )}
      <span className="sr-only">Send message</span>
    </Button>
  );
}

const WelcomeView = React.memo(({ onFormSubmit, setPrompt, prompt }) => {
    const { pending } = useFormStatus();
    const formRef = useRef<HTMLFormElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);
    const { toast } = useToast();

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey && prompt.trim() && !pending) {
        event.preventDefault();
        if (formRef.current) {
          formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
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
        <div className="flex flex-col h-screen bg-background">
        <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <div className="w-full max-w-2xl">
                <div className="flex flex-col items-center justify-center gap-2 mb-4">
                    <CrowLogo className="w-28 h-28"/>
                    <h1 className="text-3xl sm:text-4xl font-bold">AeonAI</h1>
                </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">How can I help you today?</h2>
            <div className="mt-8 w-full">
                <div className="flex items-start gap-4 px-3 py-2 rounded-2xl bg-card border shadow-sm max-w-3xl mx-auto">
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
                    <SubmitButton />
                </div>
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
});
WelcomeView.displayName = 'WelcomeView';

const ChatView = React.memo(({ messages, setMessages, prompt, setPrompt, onFormSubmit, viewportRef, editingMessageId, setEditingMessageId }) => {
    const { pending } = useFormStatus();
    const formRef = useRef<HTMLFormElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);
    const { toast } = useToast();
    const [theme, setTheme] = useState('dark');

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied!",
            description: "The message has been copied to your clipboard.",
        });
    };
    
    const handleEdit = (message: Message, handleRemoveImage: () => void) => {
        if (pending) return;
        setEditingMessageId(message.id);
        setPrompt(message.text);
        if (message.imageUrl) {
            toast({ title: "Note", description: "Editing a message with an image is not fully supported. Please re-attach the image if needed."});
            handleRemoveImage();
        } else {
            handleRemoveImage();
        }
    };
    
    const handleSuggestionClick = (suggestion: string) => {
        if (pending) return;
        setPrompt(suggestion);
        setTimeout(() => {
            if (formRef.current) {
              formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            }
        }, 100);
    };
    
    const handleNewChat = (handleRemoveImage: () => void) => {
        setMessages([]);
        setPrompt("");
        handleRemoveImage();
        setEditingMessageId(null);
    };


    useEffect(() => {
        const storedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(storedTheme);
        document.documentElement.classList.toggle('dark', storedTheme === 'dark');
        document.documentElement.classList.toggle('light', storedTheme !== 'dark');
    }, []);
    
    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey && prompt.trim() && !pending) {
          event.preventDefault();
          if (formRef.current) {
            formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          }
      }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setUploadedImagePreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = useCallback(() => {
        setUploadedImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }, []);

    const toggleTheme = () => {
        setTheme(prevTheme => {
            const newTheme = prevTheme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            document.documentElement.classList.toggle('dark', newTheme === 'dark');
            document.documentElement.classList.toggle('light', newTheme !== 'dark');
            return newTheme;
        });
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
        <div className="flex flex-col h-screen bg-background">
            <header className="flex items-center shrink-0 gap-4 p-4 border-b">
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
                <Button onClick={() => handleNewChat(handleRemoveImage)} variant="outline">
                    <Plus size={16}/>
                    <span className="hidden md:inline ml-2">New Chat</span>
                </Button>
              </div>
            </header>
            <main className="flex-1 overflow-y-auto">
                <ScrollArea className="h-full" viewportRef={viewportRef}>
                  <div className="space-y-6 max-w-4xl mx-auto w-full p-6 pb-24">
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
                          "group flex items-start gap-4 w-full",
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
                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleEdit(message, handleRemoveImage)}>
                                    <Pencil size={16}/>
                                </Button>
                            </div>
                           )}
                          <div
                            className={cn(
                              "max-w-[85%] rounded-2xl px-4 py-3 text-sm prose dark:prose-invert prose-p:my-0",
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
                          <div className="flex flex-wrap gap-2 mt-2 ml-12">
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
                      <div className="flex items-start gap-4">
                          <Avatar className="w-8 h-8 border shrink-0">
                             <AvatarFallback>
                                <CrowLogo className="w-5 h-5 text-muted-foreground" />
                             </AvatarFallback>
                          </Avatar>
                          <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm ai-message flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse delay-0"></div>
                              <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse delay-150"></div>
                              <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse delay-300"></div>
                          </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
            </main>
            <footer className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm z-10">
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
                <div className="flex items-start gap-4 px-3 py-2 rounded-2xl bg-card border shadow-sm">
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
                    <SubmitButton />
                </div>
                </div>
            </footer>
        </div>
      );
});
ChatView.displayName = 'ChatView';


function AppContent({ state, formAction }) {
    const { pending } = useFormStatus();
    const { toast } = useToast();
    const viewportRef = useRef<HTMLDivElement>(null);
    const isInitialRender = useRef(true);

    const [messages, setMessages] = useState<Message[]>([]);
    const [prompt, setPrompt] = useState("");
    const [editingMessageId, setEditingMessageId] = useState<number | null>(null);

    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
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
                    if (editedMessageIndex !== -1) {
                        const insertIndex = editedMessageIndex + 1;
                        if (insertIndex < newMessages.length && newMessages[insertIndex].sender === 'ai') {
                            newMessages[insertIndex] = newAiMessage;
                        } else {
                            newMessages.splice(insertIndex, 0, newAiMessage);
                        }
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
        const uploadedFile = formData.get("uploadedFile") as File;
        
        if ((!currentPrompt || currentPrompt.trim().length === 0) && (!uploadedFile || uploadedFile.size === 0)) {
            return;
        }
        
        const userMessage: Message = {
            id: Date.now(),
            sender: 'user',
            text: currentPrompt,
            imageUrl: uploadedFile && uploadedFile.size > 0 ? URL.createObjectURL(uploadedFile) : undefined,
        };

        if (editingMessageId !== null) {
            setMessages(prev => {
                const newMessages = [...prev];
                const editedMessageIndex = newMessages.findIndex(m => m.id === editingMessageId);
                if (editedMessageIndex !== -1) {
                    newMessages[editedMessageIndex] = { ...newMessages[editedMessageIndex], text: currentPrompt, imageUrl: userMessage.imageUrl || newMessages[editedMessageIndex].imageUrl };
                    // Remove the next AI message if it exists
                    if (editedMessageIndex + 1 < newMessages.length && newMessages[editedMessageIndex + 1].sender === 'ai') {
                        newMessages.splice(editedMessageIndex + 1, 1);
                    }
                }
                return newMessages;
            });
        } else {
            setMessages(prev => {
                // Remove suggestions from the last AI message
                const newMessages = prev.map(m => ({ ...m, suggestions: undefined }));
                return [...newMessages, userMessage];
            });
        }

        formAction(formData);
        
        setPrompt("");
        // Reset the file input visually after submission by targeting the form directly.
        const form = event.currentTarget;
        const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
        if(fileInput) fileInput.value = "";
    };


    if (messages.length === 0 && !pending) {
        return <WelcomeView onFormSubmit={handleClientSideSubmit} prompt={prompt} setPrompt={setPrompt} />;
    }
    
    return <ChatView
        messages={messages}
        setMessages={setMessages}
        prompt={prompt}
        setPrompt={setPrompt}
        onFormSubmit={handleClientSideSubmit}
        viewportRef={viewportRef}
        editingMessageId={editingMessageId}
        setEditingMessageId={setEditingMessageId}
    />
}

// Wrapper component to provide form context
const FormStatusWrapper = ({ children, formAction, state }) => {
    const { pending } = useFormStatus();
    
    // We need a ref to hold the form element, so we can manually trigger submission.
    const formRef = useRef<HTMLFormElement>(null);

    // This is the submission handler that will be attached to the <form> element.
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); // Prevent default browser submission
        if (pending) return; // Prevent re-submission while pending

        // Extract the `onFormSubmit` handler from the children's props.
        const childSubmitHandler = (children as React.ReactElement)?.props?.onFormSubmit;
        if (childSubmitHandler) {
            // If a custom handler exists (like in WelcomeView/ChatView), call it.
            // This handler is responsible for managing its own state and eventually calling `formAction`.
             childSubmitHandler(event);
        } else {
            // Fallback for direct submission, though our structure relies on the custom handler.
            formAction(new FormData(event.currentTarget));
        }
    };

    return (
        <form ref={formRef} action={formAction} className="contents" onSubmit={handleSubmit}>
            {/* Clone the child element (AppContent) and pass down necessary props */}
            {React.cloneElement(children as React.ReactElement, {
                state,
                formAction,
                onFormSubmit: handleSubmit, // Pass the submit handler down
                formRef // Pass the form ref down
            })}
        </form>
    );
};


export default function Home() {
    const [state, formAction] = useActionState(getAiResponse, initialState);

    return (
        <FormStatusWrapper formAction={formAction} state={state}>
            <AppContent state={state} formAction={formAction} />
        </FormStatusWrapper>
    );
}
