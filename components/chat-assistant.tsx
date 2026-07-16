"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "model"; text: string };

export function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: "سلام! من دستیار پلنرتم. می‌تونی ازم بخوای برات تسک بسازم یا برای برنامه‌ریزیت پیشنهاد بدم. مثلاً بگو «فردا ساعت ۹ تا ۱۰ یادم بنداز جلسه دارم».",
    },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  async function send() {
    const text = input.trim();
    if (!text || pending) return;

    const nextMessages = [...messages, { role: "user" as const, text }];
    setMessages(nextMessages);
    setInput("");
    setPending(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "خطایی پیش اومد.");
        return;
      }
      setMessages([...nextMessages, { role: "model", text: data.text }]);
    } catch {
      setError("ارتباط با دستیار برقرار نشد.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-xl border">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn("flex", m.role === "user" ? "justify-start" : "justify-end")}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                {m.text}
              </div>
            </div>
          ))}
          {pending && (
            <div className="flex justify-end">
              <div className="flex items-center gap-1.5 rounded-2xl bg-muted px-4 py-2 text-sm text-muted-foreground">
                <Sparkles className="size-3.5 animate-pulse" />
                در حال فکر کردن...
              </div>
            </div>
          )}
          {error && <p className="text-center text-sm text-destructive">{error}</p>}
          <div ref={endRef} />
        </div>
      </div>

      <form
        className="flex gap-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <Input
          placeholder="پیامت رو بنویس..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={pending}
        />
        <Button type="submit" size="icon" disabled={pending || !input.trim()} aria-label="ارسال">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
