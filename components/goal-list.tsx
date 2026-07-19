"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatJalaliLong } from "@/lib/jalali";
import { dateKeyFromUtcDate } from "@/lib/date";

type GoalType = "SHORT_TERM" | "LONG_TERM";

type Goal = {
  id: string;
  title: string;
  description: string | null;
  type: GoalType;
  targetDate: string | null;
  progress: number;
};

const typeLabel: Record<GoalType, string> = {
  SHORT_TERM: "کوتاه‌مدت",
  LONG_TERM: "بلندمدت",
};

async function fetchGoals(): Promise<Goal[]> {
  const res = await fetch("/api/goals");
  if (!res.ok) throw new Error("خطا در دریافت اهداف");
  return res.json();
}

export function GoalList() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<GoalType>("SHORT_TERM");

  const { data: goals, isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: fetchGoals,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["goals"] });

  const [pendingGoalId, setPendingGoalId] = useState<string | null>(null);

  const createGoal = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, type }),
      });
      if (!res.ok) throw new Error("خطا در ساخت هدف");
      return res.json();
    },
    onSuccess: () => {
      setTitle("");
      invalidate();
    },
  });

  const updateProgress = useMutation({
    mutationFn: async ({ id, progress }: { id: string; progress: number }) => {
      setPendingGoalId(id);
      const res = await fetch(`/api/goals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress }),
      });
      if (!res.ok) throw new Error("خطا در به‌روزرسانی پیشرفت");
      return res.json();
    },
    // Await the refetch so the next click reads the server-confirmed value,
    // not a stale cache entry — otherwise rapid clicks silently lose increments.
    onSuccess: async () => {
      await invalidate();
    },
    onSettled: () => setPendingGoalId(null),
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("خطا در حذف هدف");
    },
    onSuccess: invalidate,
  });

  const shortTerm = goals?.filter((g) => g.type === "SHORT_TERM") ?? [];
  const longTerm = goals?.filter((g) => g.type === "LONG_TERM") ?? [];

  return (
    <div className="flex flex-col gap-6">
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) createGoal.mutate();
        }}
      >
        <Input
          className="sm:flex-1"
          placeholder="هدف جدید..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex gap-2">
          <Select value={type} onValueChange={(v) => setType(v as GoalType)}>
            <SelectTrigger>
              <SelectValue>{(value: GoalType) => typeLabel[value]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SHORT_TERM">کوتاه‌مدت</SelectItem>
              <SelectItem value="LONG_TERM">بلندمدت</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="submit"
            className="flex-1 sm:flex-none"
            disabled={createGoal.isPending || !title.trim()}
          >
            افزودن
          </Button>
        </div>
      </form>

      {isLoading && <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>}

      {(["SHORT_TERM", "LONG_TERM"] as const).map((section) => {
        const items = section === "SHORT_TERM" ? shortTerm : longTerm;
        if (!goals || items.length === 0) return null;
        return (
          <div key={section}>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">
              اهداف {typeLabel[section]}
            </h3>
            <ul className="flex flex-col gap-2">
              {items.map((goal) => (
                <li
                  key={goal.id}
                  className="flex flex-col gap-2 rounded-lg border border-border/60 bg-card p-3 shadow-[0_1px_2px_color-mix(in_oklch,var(--foreground)_5%,transparent)]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{goal.title}</p>
                      {goal.description && (
                        <p className="text-xs text-muted-foreground">{goal.description}</p>
                      )}
                      {goal.targetDate && (
                        <p className="text-xs text-muted-foreground">
                          هدف تا {formatJalaliLong(dateKeyFromUtcDate(new Date(goal.targetDate)))}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteGoal.mutate(goal.id)}
                      aria-label="حذف"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      disabled={goal.progress <= 0 || pendingGoalId === goal.id}
                      onClick={() =>
                        updateProgress.mutate({
                          id: goal.id,
                          progress: Math.max(0, goal.progress - 10),
                        })
                      }
                      aria-label="کاهش پیشرفت"
                    >
                      <Minus className="size-3.5" />
                    </Button>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      disabled={goal.progress >= 100 || pendingGoalId === goal.id}
                      onClick={() =>
                        updateProgress.mutate({
                          id: goal.id,
                          progress: Math.min(100, goal.progress + 10),
                        })
                      }
                      aria-label="افزایش پیشرفت"
                    >
                      <Plus className="size-3.5" />
                    </Button>
                    <span className="w-10 text-left text-xs text-muted-foreground">
                      {goal.progress}٪
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {goals?.length === 0 && !isLoading && (
        <p className="text-sm text-muted-foreground">هنوز هدفی ثبت نکردی.</p>
      )}
    </div>
  );
}
