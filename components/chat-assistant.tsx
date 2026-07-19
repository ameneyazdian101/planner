"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Mic, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "model"; text: string };

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: { transcript: string }[][] } & { results: SpeechRecognitionResultList }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function pickPersianVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  return voices.find((v) => v.lang.startsWith("fa")) ?? voices.find((v) => v.lang.startsWith("ar"));
}

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fa-IR";
  const voice = pickPersianVoice();
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

export function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: "سلام! من دستیار پلنرتم. می‌تونی ازم بخوای برات تسک بسازم یا برای برنامه‌ریزیت پیشنهاد بدم. مثلاً بگو «فردا ساعت ۹ تا ۱۰ یادم بنداز جلسه دارم». می‌تونی باهام صحبت هم کنی، یا هر سؤال دیگه‌ای هم بپرسی.",
    },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [speakEnabled, setSpeakEnabled] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const retryMessagesRef = useRef<Message[] | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  useEffect(() => {
    setVoiceSupported(!!getSpeechRecognition());
  }, []);

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function sendMessages(nextMessages: Message[], isRetry = false) {
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
        // Free-tier quota/rate-limit errors (503) are often transient — wait a moment
        // and retry once automatically before bothering the user with an error.
        if (res.status === 503 && !isRetry) {
          await sleep(4000);
          await sendMessages(nextMessages, true);
          return;
        }
        retryMessagesRef.current = nextMessages;
        setError(data.error ?? "خطایی پیش اومد.");
        return;
      }
      retryMessagesRef.current = null;
      setMessages([...nextMessages, { role: "model", text: data.text }]);
      if (speakEnabled) speak(data.text);
    } catch {
      if (!isRetry) {
        await sleep(4000);
        await sendMessages(nextMessages, true);
        return;
      }
      retryMessagesRef.current = nextMessages;
      setError("ارتباط با دستیار برقرار نشد.");
    } finally {
      setPending(false);
    }
  }

  async function send(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if (!text || pending) return;

    const nextMessages = [...messages, { role: "user" as const, text }];
    setMessages(nextMessages);
    setInput("");
    await sendMessages(nextMessages);
  }

  async function retryLast() {
    if (!retryMessagesRef.current || pending) return;
    await sendMessages(retryMessagesRef.current);
  }

  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const SpeechRecognitionCtor = getSpeechRecognition();
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "fa-IR";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (transcript) send(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-xl border">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-xs text-muted-foreground">دستیار هوشمند</span>
        <button
          type="button"
          onClick={() => {
            setSpeakEnabled((v) => !v);
            window.speechSynthesis?.cancel();
          }}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
          title={speakEnabled ? "خاموش کردن پاسخ صوتی" : "روشن کردن پاسخ صوتی"}
        >
          {speakEnabled ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
          پاسخ صوتی
        </button>
      </div>

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
          {error && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-center text-sm text-destructive">{error}</p>
              {retryMessagesRef.current && (
                <Button variant="outline" size="sm" onClick={() => retryLast()} disabled={pending}>
                  تلاش دوباره
                </Button>
              )}
            </div>
          )}
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
          placeholder={listening ? "در حال گوش دادن..." : "پیامت رو بنویس یا بگو..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={pending}
        />
        {voiceSupported && (
          <Button
            type="button"
            variant={listening ? "default" : "outline"}
            size="icon"
            onClick={toggleListening}
            disabled={pending}
            aria-label={listening ? "توقف ضبط صدا" : "شروع صحبت"}
            className={cn(listening && "animate-pulse")}
          >
            <Mic className="size-4" />
          </Button>
        )}
        <Button type="submit" size="icon" disabled={pending || !input.trim()} aria-label="ارسال">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
