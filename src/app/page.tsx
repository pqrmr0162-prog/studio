"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { getAiResponse, textToSpeechAction } from "@/app/actions";
import { CrowLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SendHorizonal, User, Bot, Plus, Paperclip, X, Sun, Moon, Volume2, Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Image from 'next/image';

const initialState = {
  response: null,
  error: null,
};

interface Message {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  imageUrl?: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="icon" disabled={pending} className="shrink-0 rounded-full">
      {pending ? (
        <Bot className="h-5 w-5 animate-spin" />
      ) : (
        <SendHorizonal className="h-5 w-5" />
      )}
      <span className="sr-only">Send message</span>
    </Button>
  );
}

export default function Home() {
  const [state, formAction] = useFormState(getAiResponse, initialState);
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [theme, setTheme] = useState('dark');
  const [playingAudio, setPlayingAudio] = useState<number | null>(null);
  const [loadingAudio, setLoadingAudio] = useState<number | null>(null);
  const [audioCache, setAudioCache] = useState<Record<number, string>>({});

  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
    } else if (state.response) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), sender: 'ai', text: state.response! },
      ]);
    }
  }, [state, toast]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
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
  
  const handleFormAction = (formData: FormData) => {
    const currentPrompt = formData.get("prompt") as string;
    if (currentPrompt.trim() || attachment) {
      const userMessage: Message = {
        id: Date.now(),
        sender: 'user',
        text: currentPrompt
      };
      if (attachmentPreview) {
          userMessage.imageUrl = attachmentPreview;
      }
      setMessages(prev => [...prev, userMessage]);
      
      formAction(formData);
      formRef.current?.reset();
      setPrompt("");
      handleRemoveAttachment();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    handleRemoveAttachment();
  };

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const playAudio = (audioDataUri: string, messageId: number) => {
    const newAudio = new Audio(audioDataUri);
    audioRef.current = newAudio;
  
    newAudio.play();
    setPlayingAudio(messageId);
    newAudio.onended = () => {
      setPlayingAudio(null);
    };
  };

  const handlePlayAudio = async (message: Message) => {
    if (playingAudio === message.id && audioRef.current) {
        audioRef.current.pause();
        setPlayingAudio(null);
        return;
    }

    if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setPlayingAudio(null);
    }
    
    // Check cache first
    if (audioCache[message.id]) {
      playAudio(audioCache[message.id], message.id);
      return;
    }
    
    setLoadingAudio(message.id);
    try {
        const result = await textToSpeechAction({text: message.text});
        if (result.error) {
            toast({
                variant: "destructive",
                title: "Audio Error",
                description: result.error,
            });
            return;
        }

        if(result.audioDataUri) {
            setAudioCache(prev => ({...prev, [message.id]: result.audioDataUri!}));
            playAudio(result.audioDataUri, message.id);
        }
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Audio Error",
            description: "Failed to play audio.",
        });
    } finally {
        setLoadingAudio(null);
    }
  };
  
  return (
    <div className="flex h-screen bg-background">
      <div className="flex flex-col flex-1">
        <header className="flex items-center gap-2 md:gap-4 p-2 md:p-4 border-b">
          <div className="flex items-center gap-2">
            <CrowLogo className="w-8 h-8"/>
            <h1 className="text-lg font-bold">AeonAI</h1>
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
        <main className="flex-1 flex flex-col p-2 md:p-6">
            <ScrollArea className="flex-1 px-2 md:px-4" ref={scrollAreaRef}>
              <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto w-full">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-10 md:pt-20">
                        <CrowLogo className="w-16 h-16 md:w-20 md:h-20 mb-4 text-primary"/>
                        <p className="text-lg md:text-xl font-semibold">How can I help you?</p>
                        <p className="text-xs mt-1">by Bissu</p>
                    </div>
                )}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex items-start gap-2 md:gap-4",
                      message.sender === 'user' && "justify-end"
                    )}
                  >
                    {message.sender === 'ai' && (
                      <Avatar className="w-8 h-8 border shrink-0">
                         <AvatarFallback>
                            <CrowLogo className="w-5 h-5 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] md:max-w-[75%] rounded-2xl px-3 py-2 md:px-4 md:py-3 text-sm",
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
                      <p className="whitespace-pre-wrap">{message.text}</p>
                       {message.sender === 'ai' && (
                        <div className="flex justify-end mt-2">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                onClick={() => handlePlayAudio(message)}
                                disabled={loadingAudio === message.id}
                            >
                                {loadingAudio === message.id ? (
                                    <Loader className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Volume2 className="h-4 w-4" />
                                )}
                                <span className="sr-only">Read aloud</span>
                            </Button>
                        </div>
                       )}
                    </div>
                    {message.sender === 'user' && (
                      <Avatar className="w-8 h-8 border shrink-0">
                        <AvatarFallback><User size={16}/></AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {useFormStatus().pending && (
                  <div className="flex items-start gap-2 md:gap-4">
                      <Avatar className="w-8 h-8 border">
                         <AvatarFallback>
                            <CrowLogo className="w-5 h-5 text-muted-foreground" />
                         </AvatarFallback>
                      </Avatar>
                      <div className="ai-message rounded-2xl px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-current animate-pulse delay-0"></div>
                              <div className="w-2 h-2 rounded-full bg-current animate-pulse delay-150"></div>
                              <div className="w-2 h-2 rounded-full bg-current animate-pulse delay-300"></div>
                          </div>
                      </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            <footer className="mt-auto pt-2 md:pt-4">
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
                  action={handleFormAction}
                  className="flex items-center gap-2 md:gap-4"
                >
                  <Button type="button" variant="outline" size="icon" className="shrink-0 rounded-full" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="h-5 w-5" />
                    <span className="sr-only">Attach file</span>
                  </Button>
                  <input
                    type="file"
                    name="attachment"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                  />
                  <Input
                    name="prompt"
                    placeholder="Type your message..."
                    autoComplete="off"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="flex-1 rounded-full px-4"
                  />

                  <SubmitButton />
                </form>
              </div>
            </footer>
        </main>
      </div>
    </div>
  );
}
