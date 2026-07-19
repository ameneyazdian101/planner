"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addDaysToKey, todayKey } from "@/lib/date";
import { formatJalaliWeekdayShort, jalaliWeekStartKey } from "@/lib/jalali";
import { cn } from "@/lib/utils";

type HabitLog = { date: string; completed: boolean };
type Habit = { id: string; name: string; color: string; logs: HabitLog[] };

const weekStart = jalaliWeekStartKey(todayKey());
const days = Array.from({ length: 7 }, (_, i) => addDaysToKey(weekStart, i));

async function fetchHabits(): Promise<Habit[]> {
  const res = await fetch(`/api/habits?from=${days[0]}&to=${days[6]}`);
  if (!res.ok) throw new Error("خطا در دریافت عادت‌ها");
  const raw = await res.json();
  return raw.map((h: Habit & { logs: { date: string; completed: boolean }[] }) => ({
    ...h,
    logs: h.logs.map((l) => ({ ...l, date: l.date.slice(0, 10) })),
  }));
}

export function HabitGrid() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const { data: habits, isLoading } = useQuery({
    queryKey: ["habits", days[0], days[6]],
    queryFn: fetchHabits,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["habits"] });

  const createHabit = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("خطا در ساخت عادت");
      return res.json();
    },
    onSuccess: () => {
      setName("");
      invalidate();
    },
  });

  const toggleLog = useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
      setPendingKey(`${habitId}:${date}`);
      const res = await fetch(`/api/habits/${habitId}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      if (!res.ok) throw new Error("خطا در ثبت عادت");
      return res.json();
    },
    onSuccess: async () => {
      await invalidate();
    },
    onSettled: () => setPendingKey(null),
  });

  const deleteHabit = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/habits/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("خطا در حذف عادت");
    },
    onSuccess: invalidate,
  });

  return (
    <div className="flex flex-col gap-6">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) createHabit.mutate();
        }}
      >
        <Input
          placeholder="عادت جدید..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" disabled={createHabit.isPending || !name.trim()}>
          افزودن
        </Button>
      </form>

      {isLoading && <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>}

      {habits && habits.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border/60 bg-card p-2 shadow-[0_1px_2px_color-mix(in_oklch,var(--foreground)_5%,transparent),0_8px_20px_-12px_color-mix(in_oklch,var(--foreground)_18%,transparent)]">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="max-w-20 p-1.5 text-right font-medium text-muted-foreground sm:max-w-none sm:p-2">
                  عادت
                </th>
                {days.map((day) => (
                  <th
                    key={day}
                    className="p-1 text-center font-medium text-muted-foreground sm:p-2"
                  >
                    {formatJalaliWeekdayShort(day)}
                  </th>
                ))}
                <th className="p-1 sm:p-2" />
              </tr>
            </thead>
            <tbody>
              {habits.map((habit) => (
                <tr key={habit.id} className="border-t">
                  <td className="max-w-20 truncate p-1.5 font-medium sm:max-w-none sm:p-2">
                    {habit.name}
                  </td>
                  {days.map((day) => {
                    const log = habit.logs.find((l) => l.date === day);
                    const key = `${habit.id}:${day}`;
                    return (
                      <td key={day} className="p-1 text-center sm:p-2">
                        <button
                          type="button"
                          aria-label={log?.completed ? "علامت‌زدن به عنوان انجام‌نشده" : "علامت‌زدن به عنوان انجام‌شده"}
                          disabled={pendingKey === key}
                          onClick={() => toggleLog.mutate({ habitId: habit.id, date: day })}
                          className={cn(
                            "inline-flex size-6 items-center justify-center rounded-md border transition-colors disabled:opacity-50",
                            log?.completed ? "border-transparent text-white" : "border-input"
                          )}
                          style={log?.completed ? { backgroundColor: habit.color } : undefined}
                        >
                          {log?.completed && <Check className="size-4" />}
                        </button>
                      </td>
                    );
                  })}
                  <td className="p-1 text-center sm:p-2">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => deleteHabit.mutate(habit.id)}
                      aria-label="حذف عادت"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {habits?.length === 0 && !isLoading && (
        <p className="text-sm text-muted-foreground">هنوز عادتی ثبت نکردی.</p>
      )}
    </div>
  );
}
