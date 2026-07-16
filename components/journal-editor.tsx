"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type JournalEntry = { content: string; mood: string | null } | null;

const MOODS = [
  { value: "great", emoji: "😄", label: "عالی" },
  { value: "good", emoji: "🙂", label: "خوب" },
  { value: "okay", emoji: "😐", label: "معمولی" },
  { value: "low", emoji: "😔", label: "بد" },
  { value: "bad", emoji: "😢", label: "خیلی بد" },
];

async function fetchEntry(date: string): Promise<JournalEntry> {
  const res = await fetch(`/api/journal?date=${date}`);
  if (!res.ok) throw new Error("خطا در دریافت یادداشت");
  return res.json();
}

export function JournalEditor({ date }: { date: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["journal", date],
    queryFn: () => fetchEntry(date),
  });

  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (data !== undefined) {
      setContent(data?.content ?? "");
      setMood(data?.mood ?? null);
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async (next: { content: string; mood: string | null }) => {
      const res = await fetch("/api/journal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, content: next.content, mood: next.mood ?? undefined }),
      });
      if (!res.ok) throw new Error("خطا در ذخیره یادداشت");
      return res.json();
    },
    onSuccess: () => {
      setSavedAt(Date.now());
      queryClient.invalidateQueries({ queryKey: ["journal", date] });
    },
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-medium text-muted-foreground">امروز حالت چطور بود؟</p>
        <div className="flex gap-1 rounded-xl bg-muted p-1">
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              aria-label={m.label}
              aria-pressed={mood === m.value}
              onClick={() => setMood(mood === m.value ? null : m.value)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-xs font-medium transition-all",
                mood === m.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="text-2xl leading-none">{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <Textarea
        placeholder="امروز چطور گذشت؟"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-40"
      />

      <div className="flex items-center gap-3">
        <Button
          onClick={() => save.mutate({ content, mood })}
          disabled={save.isPending}
        >
          {save.isPending ? "در حال ذخیره..." : "ذخیره"}
        </Button>
        {savedAt && !save.isPending && (
          <span className="text-xs text-muted-foreground">ذخیره شد</span>
        )}
      </div>
    </div>
  );
}
