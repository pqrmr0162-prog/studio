"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { getAiResponse } from "@/app/actions";
import { TigerLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SendHorizonal, User, Bot, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

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

  const handleNewChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 flex flex-col p-4 border-r bg-secondary/40">
        <div className="flex items-center gap-2 mb-4">
          <TigerLogo className="w-8 h-8"/>
          <h1 className="text-lg font-bold">AeonAI</h1>
        </div>
        <Button onClick={handleNewChat} variant="outline" className="w-full justify-start gap-2">
            <Plus size={16}/>
            New Chat
        </Button>
        <Separator className="my-4"/>
        <p className="text-sm text-muted-foreground mb-2">History</p>
        <ScrollArea className="flex-1">
            <p className="text-sm text-muted-foreground text-center">No history yet.</p>
        </ScrollArea>
      </aside>

      <div className="flex flex-col flex-1">
        <header className="flex items-center gap-4 p-4 border-b">
          <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                AeonAI Assistant
              </h1>
              <p className="text-sm text-muted-foreground">Online</p>
          </div>
        </header>
        <main className="flex-1 flex flex-col p-6">
            <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
              <div className="space-y-6 max-w-4xl mx-auto w-full">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-20">
                        <TigerLogo className="w-16 h-16 mb-4"/>
                        <p className="text-lg font-semibold">How can I help you?</p>
                        <p className="text-xs mt-1">by Bissu</p>
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
            
            <footer className="mt-auto pt-4">
              <div className="max-w-4xl mx-auto w-full">
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
              </div>
            </footer>
        </main>
      </div>
    </div>
  );
}
