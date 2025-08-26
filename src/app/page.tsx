"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { getAiResponse } from "@/app/actions";
import { CrowLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SendHorizonal, User, Bot, Plus, Paperclip, X, Sun, Moon, Copy, Pencil, LinkIcon, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';

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
  attachmentName?: string;
  suggestions?: string[];
  sources?: { title: string; url: string }[];
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="icon" disabled={pending} className="shrink-0 rounded-full">
      {pending ? (
        <div className="w-5 h-5 border-2 border-background border-t-primary rounded-full animate-spin"></div>
      ) : (
        <SendHorizonal className="h-5 w-5" />
      )}
      <span className="sr-only">Send message</span>
    </Button>
  );
}

export default function Home() {
  const [state, formAction] = useActionState(getAiResponse, initialState);
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [theme, setTheme] = useState('dark');
  const [isRecording, setIsRecording] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      setTheme(storedTheme);
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
    if (state.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: state.error,
      });
    } else if (state.response || state.imageUrl || (state.sources && state.sources.length > 0)) {
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
                  // Remove the old AI response that followed the edited message
                  if (editedMessageIndex + 1 < newMessages.length && newMessages[editedMessageIndex + 1].sender === 'ai') {
                    newMessages.splice(editedMessageIndex + 1, 1);
                  }
              }
               // Add the new AI message after the edited one
              const insertIndex = editedMessageIndex + 1;
              newMessages.splice(insertIndex, 0, newAiMessage);

              return newMessages;
          });
          setEditingMessageId(null);
      } else {
        setMessages((prev) => [
          ...prev,
          newAiMessage,
        ]);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, toast]);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAttachment(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachmentPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachmentPreview(null);
      }
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    setAttachmentPreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };
  
  const handleFormSubmit = (formData: FormData) => {
    const currentPrompt = formData.get("prompt") as string;
    
    if (editingMessageId !== null) {
        setMessages(prev => {
            const newMessages = [...prev];
            const editedMessageIndex = newMessages.findIndex(m => m.id === editingMessageId);
            if (editedMessageIndex !== -1) {
                newMessages[editedMessageIndex] = { ...newMessages[editedMessageIndex], text: currentPrompt, imageUrl: attachmentPreview || newMessages[editedMessageIndex].imageUrl, attachmentName: attachment?.name };
                // Remove messages after the edited one, including their suggestions
                newMessages.splice(editedMessageIndex + 1);
            }
            return newMessages;
        });
        
        formAction(formData);
        formRef.current?.reset();
        setPrompt("");
        handleRemoveAttachment();

    } else if (currentPrompt.trim() || attachment) {
      const userMessage: Message = {
        id: Date.now(),
        sender: 'user',
        text: currentPrompt
      };
      if (attachmentPreview) {
          userMessage.imageUrl = attachmentPreview;
      }
      if (attachment && !attachmentPreview) {
        userMessage.attachmentName = attachment.name;
      }
      setMessages(prev => {
        const newMessages = prev.map(m => ({ ...m, suggestions: undefined }));
        return [...newMessages, userMessage];
      });
      
      formAction(formData);
      formRef.current?.reset();
      setPrompt("");
      handleRemoveAttachment();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
    // Directly create and submit a new form data
    const formData = new FormData();
    formData.append("prompt", suggestion);
    handleFormSubmit(formData);
  }

  const handleNewChat = () => {
    setMessages([]);
    handleRemoveAttachment();
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
        setAttachmentPreview(message.imageUrl);
        // Note: we can't re-create the File object, so user would need to re-attach if they want to change it.
    } else {
        handleRemoveAttachment();
    }
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
    recognitionRef.current.lang = 'en-US';

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

  if (messages.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <div className="w-full max-w-2xl">
            <CrowLogo className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 text-primary"/>
            <h1 className="text-2xl md:text-3xl font-bold">Hi, I'm AeonAI</h1>
            <p className="text-muted-foreground mt-2">How can I help you today?</p>
            <div className="mt-8">
              <form
                  ref={formRef}
                  action={handleFormSubmit}
                  className="flex items-center gap-2 md:gap-4 px-2 py-1 rounded-full bg-card border shadow-sm"
              >
                  <Button type="button" variant="ghost" size="icon" className="shrink-0 rounded-full" onClick={() => fileInputRef.current?.click()}>
                      <Paperclip className="h-5 w-5" />
                      <span className="sr-only">Attach file</span>
                  </Button>
                  <input
                  type="file"
                  name="attachment"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,application/pdf,text/plain,.doc,.docx"
                  />
                  <Input
                  name="prompt"
                  placeholder="Message AeonAI..."
                  autoComplete="off"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
                  />
                  <Button type="button" variant="ghost" size="icon" className={cn("shrink-0 rounded-full", isRecording && "text-destructive")} onClick={handleMicClick}>
                      <Mic className="h-5 w-5" />
                      <span className="sr-only">Use microphone</span>
                  </Button>
                  <SubmitButton />
              </form>
              {attachment && (
                  <div className="relative mt-2 mx-auto max-w-xs p-2 bg-muted rounded-lg flex items-center gap-2">
                      {attachmentPreview ? (
                          <Image src={attachmentPreview} alt="Preview" width={40} height={40} className="rounded-md" />
                      ) : (
                          <Paperclip className="h-6 w-6" />
                      )}
                      <span className="text-sm truncate">{attachment.name}</span>
                      <Button variant="ghost" size="icon" className="ml-auto h-6 w-6 shrink-0" onClick={handleRemoveAttachment}>
                          <X className="h-4 w-4" />
                      </Button>
                  </div>
              )}
            </div>
          </div>
        </main>
        <footer className="text-center p-4 text-xs text-muted-foreground">
          by Bissu
        </footer>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
        <header className="flex items-center shrink-0 gap-2 md:gap-4 p-2 md:p-4 z-10">
          <div className="flex items-center gap-2">
            <CrowLogo className="w-8 h-8"/>
            <div>
              <h1 className="text-lg font-bold leading-none">AeonAI</h1>
              <p className="text-xs text-muted-foreground">by Bissu</p>
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
              <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto w-full p-2 md:p-6 pb-24 md:pb-28">
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
                       {message.sender === 'user' && (
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
                          <Image
                              src={message.imageUrl}
                              alt="User upload"
                              width={300}
                              height={300}
                              className="rounded-lg mb-2 max-w-full h-auto"
                          />
                        )}
                        {message.attachmentName && (
                            <div className="flex items-center gap-2 p-2 bg-background/20 rounded-md mb-2">
                                <Paperclip className="h-5 w-5" />
                                <span className="text-sm font-medium truncate">{message.attachmentName}</span>
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
                      {message.sender === 'ai' && (
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
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {useFormStatus().pending && (
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
            <div className="max-w-4xl mx-auto w-full">
            {attachment && (
                <div className="relative mb-2 p-2 bg-muted rounded-lg flex items-center gap-2">
                    {attachmentPreview ? (
                        <Image src={attachmentPreview} alt="Preview" width={40} height={40} className="rounded-md" />
                    ) : (
                        <Paperclip className="h-6 w-6" />
                    )}
                    <span className="text-sm truncate">{attachment.name}</span>
                    <Button variant="ghost" size="icon" className="ml-auto h-6 w-6 shrink-0" onClick={handleRemoveAttachment}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
            <form
                ref={formRef}
                action={handleFormSubmit}
                className="flex items-center gap-2 md:gap-4 px-2 py-1.5 rounded-full bg-card border shadow-sm"
            >
                <Button type="button" variant="ghost" size="icon" className="shrink-0 rounded-full" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="h-5 w-5" />
                    <span className="sr-only">Attach file</span>
                </Button>
                <input
                type="file"
                name="attachment"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,application/pdf,text/plain,.doc,.docx"
                />
                <Input
                name="prompt"
                placeholder={editingMessageId ? "Edit your message..." : "Type your message..."}
                autoComplete="off"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 h-auto py-2"
                />
                 <Button type="button" variant="ghost" size="icon" className={cn("shrink-0 rounded-full", isRecording && "text-destructive")} onClick={handleMicClick}>
                      <Mic className="h-5 w-5" />
                      <span className="sr-only">Use microphone</span>
                  </Button>

                <SubmitButton />
            </form>
            </div>
        </footer>
    </div>
  );
}
