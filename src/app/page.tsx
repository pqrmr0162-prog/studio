"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { getAiResponse } from "@/app/actions";
import { TigerLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SendHorizonal, User, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const initialState = {
  response: null,
  error: null,
};

interface Message {
  id: number;
  sender: 'user' | 'ai';
  text: string;
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
  const formRef = useRef<HTMLFormElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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
  
  const handleFormAction = (formData: FormData) => {
    const currentPrompt = formData.get("prompt") as string;
    if (currentPrompt.trim()) {
      setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: currentPrompt }]);
      formAction(formData);
      formRef.current?.reset();
      setPrompt("");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center gap-4 p-4 border-b">
        <TigerLogo className="w-10 h-10" />
        <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              AeonAI Assistant
            </h1>
            <p className="text-sm text-muted-foreground">Online</p>
        </div>
      </header>

      <div className="flex-1 flex justify-center py-6">
        <main className="w-full max-w-4xl flex flex-col">
          <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
            <div className="space-y-6">
              {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-20">
                      <Bot size={48} className="mb-4"/>
                      <p className="text-lg">Start the conversation!</p>
                      <p className="text-sm">I can help you with a variety of tasks. Try asking about the weather or stock prices.</p>
                  </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start gap-4",
                    message.sender === 'user' && "justify-end"
                  )}
                >
                  {message.sender === 'ai' && (
                    <Avatar className="w-8 h-8 border">
                      <AvatarFallback><Bot size={16}/></AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-3 text-sm",
                      message.sender === 'user' ? "user-message" : "ai-message"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.text}</p>
                  </div>
                  {message.sender === 'user' && (
                    <Avatar className="w-8 h-8 border">
                      <AvatarFallback><User size={16}/></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
               {useFormStatus().pending && (
                <div className="flex items-start gap-4">
                    <Avatar className="w-8 h-8 border">
                      <AvatarFallback><Bot size={16}/></AvatarFallback>
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
          
          <footer className="mt-auto p-4">
            <form
              ref={formRef}
              action={handleFormAction}
              className="flex items-center gap-4"
            >
              <Input
                name="prompt"
                placeholder="Type your message..."
                autoComplete="off"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                required
                className="flex-1 rounded-full px-5"
              />
              <SubmitButton />
            </form>
          </footer>
        </main>
      </div>
    </div>
  );
}
