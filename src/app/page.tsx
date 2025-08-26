"use client";

import { useActionState, useEffect, useRef, useState, useMemo } from "react";
import { useFormStatus } from "react-dom";
import { getAiResponse } from "@/app/actions";
import { CrowLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { SendHorizonal, User, Bot, Plus, X, Sun, Moon, Copy, Pencil, LinkIcon, Mic, Paperclip, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import React from "react";
import { auth, provider } from "@/lib/firebase";
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from "firebase/auth";

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

const WelcomeView = React.memo(function WelcomeView({ fileInputRef, handleFileChange, textareaRef, prompt, setPrompt, isRecording, handleMicClick, uploadedImagePreview, handleRemoveImage, formRef, formAction }) {
    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey && prompt.trim()) {
        event.preventDefault();
        formRef.current?.requestSubmit();
      }
    };
    
    return (
    <form ref={formRef} action={formAction} className="contents">
        <div className="flex flex-col h-screen bg-background">
        <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <div className="w-full max-w-2xl">
                <div className="flex items-center justify-center gap-4 mb-4">
                <CrowLogo className="w-16 h-16 md:w-20 md:h-20 text-primary"/>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold">AeonAI</h1>
                </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">How can I help you today?</h2>
            <div className="mt-8 w-full">
                <div className="flex items-start gap-2 md:gap-4 px-2 py-1.5 rounded-2xl bg-card border shadow-sm max-w-3xl mx-auto">
                    <Button type="button" variant="ghost" size="icon" className="shrink-0 rounded-full" onClick={() => fileInputRef.current?.click()}>
                        <Paperclip className="h-5 w-5" />
                        <span className="sr-only">Upload file</span>
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} name="uploadedFile" accept="image/*,application/pdf,.txt,.md" className="hidden" />
    
                    <Textarea
                        ref={textareaRef}
                        name="prompt"
                        placeholder={"Ask about an image or just chat. Try 'generate image of a cat'"}
                        autoComplete="off"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 resize-none max-h-48"
                        rows={1}
                    />
                    <Button type="button" variant="ghost" size="icon" className={cn("shrink-0 rounded-full", isRecording && "text-destructive")} onClick={handleMicClick}>
                        <Mic className="h-5 w-5" />
                        <span className="sr-only">Use microphone</span>
                    </Button>
                    <SubmitButton />
                </div>
                {uploadedImagePreview && (
                    <div className="relative mt-2 mx-auto max-w-xs p-2 bg-muted rounded-lg flex items-center gap-2">
                        <Image src={uploadedImagePreview} alt="Preview" width={40} height={40} className="rounded-md" />
                        <span className="text-sm truncate">Image attached</span>
                        <Button variant="ghost" size="icon" className="ml-auto h-6 w-6 shrink-0" onClick={handleRemoveImage}>
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
    </form>
    );
});

const ChatView = React.memo(function ChatView({ messages, prompt, setPrompt, uploadedImagePreview, theme, handleNewChat, toggleTheme, handleCopy, handleEdit, handleSuggestionClick, isRecording, handleMicClick, handleRemoveImage, formRef, fileInputRef, handleFileChange, textareaRef, viewportRef, formAction, user, handleLogin, handleLogout }) {
    const { pending } = useFormStatus();

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey && prompt.trim()) {
          event.preventDefault();
          formRef.current?.requestSubmit();
      }
    };
    
    return (
        <div className="flex flex-col h-screen bg-background">
            <header className="flex items-center shrink-0 gap-2 md:gap-4 p-2 sm:p-4 z-10">
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
                {user ? (
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                            <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <Button onClick={handleLogout} variant="outline" size="icon">
                            <LogOut size={20} />
                            <span className="sr-only">Logout</span>
                        </Button>
                    </div>
                ) : (
                    <Button onClick={handleLogin} variant="outline" size="sm">
                        Login
                    </Button>
                )}
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
                               <AvatarImage src={user?.photoURL || undefined} />
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
              <form ref={formRef} action={formAction} className="contents">
                <div className="max-w-4xl mx-auto w-full">
                {uploadedImagePreview && (
                    <div className="relative mb-2 p-2 bg-muted rounded-lg flex items-center gap-2 max-w-sm mx-auto">
                        <Image src={uploadedImagePreview} alt="Preview" width={40} height={40} className="rounded-md" />
                        <span className="text-sm truncate">Image attached</span>
                        <Button variant="ghost" size="icon" className="ml-auto h-6 w-6 shrink-0" onClick={handleRemoveImage}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                <div className="flex items-start gap-2 md:gap-4 px-2 py-1.5 rounded-2xl bg-card border shadow-sm">
                    <Button type="button" variant="ghost" size="icon" className="shrink-0 rounded-full self-center" onClick={() => fileInputRef.current?.click()}>
                        <Paperclip className="h-5 w-5" />
                        <span className="sr-only">Upload file</span>
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} name="uploadedFile" accept="image/*,application/pdf,.txt,.md" className="hidden" />

                    <Textarea
                      ref={textareaRef}
                      name="prompt"
                      placeholder={"Ask about an image or just chat. Try 'generate image of a cat'"}
                      autoComplete="off"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 resize-none max-h-48"
                      rows={1}
                    />
                    <Button type="button" variant="ghost" size="icon" className={cn("shrink-0 rounded-full self-center", isRecording && "text-destructive")} onClick={handleMicClick}>
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
});


export default function Home() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(getAiResponse, initialState);
  const { pending } = useFormStatus();

  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [theme, setTheme] = useState('dark');
  const [isRecording, setIsRecording] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  
  const viewportRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastSubmittedPrompt = useRef("");
  
  const isFirstRender = useRef(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
    }
    
    if (!pending) {
        if (state.error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: state.error,
            });
            // Remove the optimistic user message if the action failed
            setMessages(prev => prev.filter(m => m.text !== lastSubmittedPrompt.current));

        } else if (state.response || state.imageUrl || (state.sources && state.sources.length > 0)) {
            if (!state.response && !state.imageUrl && (!state.sources || state.sources.length === 0)) {
                return;
            }

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
                handleRemoveImage();
            } else {
                setMessages((prev) => [...prev, newAiMessage]);
            }
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, state]);


  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const handleClientSideSubmit = (event: Event) => {
        const formData = new FormData(form);
        const currentPrompt = formData.get("prompt") as string;

        if ((!currentPrompt || currentPrompt.trim().length === 0) && !uploadedImage) {
            return;
        }

        lastSubmittedPrompt.current = currentPrompt;
        
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
                    // Remove the old AI response
                    if (editedMessageIndex + 1 < newMessages.length && newMessages[editedMessageIndex + 1].sender === 'ai') {
                        newMessages.splice(editedMessageIndex + 1, 1);
                    }
                }
                return newMessages;
            });
            handleRemoveImage();
        } else {
            setMessages(prev => {
                const newMessages = prev.map(m => ({ ...m, suggestions: undefined }));
                return [...newMessages, userMessage];
            });
        }

        setPrompt("");
        if (!editingMessageId) {
            handleRemoveImage();
        }
    };
    
    // This effect runs when `formAction` is called
    form.addEventListener('submit', handleClientSideSubmit);
    return () => {
        form.removeEventListener('submit', handleClientSideSubmit);
    };

  }, [editingMessageId, uploadedImage, uploadedImagePreview]);


  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [prompt]);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      setTheme(storedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, []);
  
  useEffect(() => {
    if (theme) {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setUploadedImagePreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
    setTimeout(() => {
        formRef.current?.requestSubmit();
    }, 100);
  }

  const handleNewChat = () => {
    setMessages([]);
    handleRemoveImage();
    setEditingMessageId(null);
  };

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "The message has been copied to your clipboard.",
    });
  }

  const handleEdit = (message: Message) => {
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
    if (isRecording) {
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
        setUploadedImage(file);
        setUploadedImagePreview(URL.createObjectURL(file));
    }
  };

  const handleLogin = async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Error signing in with Google: ", error);
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Could not sign in with Google. Please try again.",
        });
    }
  };

  const handleLogout = async () => {
      try {
          await signOut(auth);
      } catch (error) {
          console.error("Error signing out: ", error);
          toast({
              variant: "destructive",
              title: "Logout Failed",
              description: "Could not sign out. Please try again.",
          });
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
    formAction,
  };

  if (messages.length === 0 && !user) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-background">
            <CrowLogo className="w-24 h-24 text-primary mb-4"/>
            <h1 className="text-5xl font-bold mb-2">Welcome to AeonAI</h1>
            <p className="text-xl text-muted-foreground mb-8">Please sign in to continue</p>
            <Button onClick={handleLogin} size="lg">Sign in with Google</Button>
        </div>
    );
  }
  
  if (messages.length === 0) {
    return <WelcomeView {...commonProps} />;
  }


  return (
    <ChatView 
        {...commonProps}
        messages={messages}
        theme={theme}
        handleNewChat={handleNewChat}
        toggleTheme={toggleTheme}
        handleCopy={handleCopy}
        handleEdit={handleEdit}
        handleSuggestionClick={handleSuggestionClick}
        viewportRef={viewportRef}
        user={user}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
    />
  );
}
