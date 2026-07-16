"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { dateKeyFromUtcDate, todayKey } from "@/lib/date";
import { formatJalaliLong, keyToJalali, PERSIAN_WEEKDAYS_SHORT, toPersianDigits } from "@/lib/jalali";
import { cn } from "@/lib/utils";

type Task = { id: string; date: string; completed: boolean };

async function fetchTasksInRange(from: string, to: string): Promise<Task[]> {
  const res = await fetch(`/api/tasks?from=${from}&to=${to}`);
  if (!res.ok) throw new Error("خطا در دریافت تسک‌ها");
  return res.json();
}

export function MonthGrid({
  days,
  currentMonthJm,
  from,
  to,
}: {
  days: string[];
  currentMonthJm: number;
  from: string;
  to: string;
}) {
  const { data: tasks } = useQuery({
    queryKey: ["tasks", "range", from, to],
    queryFn: () => fetchTasksInRange(from, to),
  });

  const counts = new Map<string, { total: number; done: number }>();
  for (const task of tasks ?? []) {
    const key = dateKeyFromUtcDate(new Date(task.date));
    const entry = counts.get(key) ?? { total: 0, done: 0 };
    entry.total += 1;
    if (task.completed) entry.done += 1;
    counts.set(key, entry);
  }

  const today = todayKey();

  return (
    <div className="mt-6">
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {PERSIAN_WEEKDAYS_SHORT.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const { jm, jd } = keyToJalali(day);
          const inMonth = jm === currentMonthJm;
          const count = counts.get(day);
          return (
            <Link
              key={day}
              href={`/planner/day/${day}`}
              title={formatJalaliLong(day)}
              className={cn(
                "flex aspect-square flex-col items-center justify-center rounded-lg border p-1 text-sm transition-colors hover:bg-accent",
                !inMonth && "text-muted-foreground/40",
                day === today && "border-primary font-semibold"
              )}
            >
              <span>{toPersianDigits(jd)}</span>
              {count && count.total > 0 && (
                <span className="mt-1 flex gap-0.5">
                  {Array.from({ length: Math.min(count.total, 3) }, (_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "size-1.5 rounded-full",
                        i < count.done ? "bg-primary" : "bg-muted-foreground/40"
                      )}
                    />
                  ))}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
