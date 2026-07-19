"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock3, TrendingUp } from "lucide-react";
import { dateKeyFromLocalDate, todayKey } from "@/lib/date";
import { formatJalaliLong, formatJalaliWeekdayLong } from "@/lib/jalali";
import { cn } from "@/lib/utils";

const cardShadow =
  "shadow-[0_1px_2px_color-mix(in_oklch,var(--foreground)_6%,transparent),0_8px_20px_-12px_color-mix(in_oklch,var(--foreground)_18%,transparent)]";

export function ClockCard() {
  const [now, setNow] = useState<Date | null>(null);
  const [calendar, setCalendar] = useState<"jalali" | "gregorian">("jalali");

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dateKey = now ? dateKeyFromLocalDate(now) : null;
  const time = now?.toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const jalaliDate = dateKey
    ? `${formatJalaliWeekdayLong(dateKey)}، ${formatJalaliLong(dateKey)}`
    : null;
  const gregorianDate = now?.toLocaleDateString("fa-IR", {
    calendar: "gregory",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className={cn("flex flex-col rounded-xl border border-border/60 bg-card p-4", cardShadow)}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 font-heading text-3xl font-bold tabular-nums">
          <Clock3 className="size-5 text-primary" />
          {time ?? "--:--:--"}
        </span>
        <button
          type="button"
          onClick={() => setCalendar((c) => (c === "jalali" ? "gregorian" : "jalali"))}
          className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {calendar === "jalali" ? "میلادی" : "شمسی"}
        </button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {calendar === "jalali" ? jalaliDate : gregorianDate}
      </p>
    </div>
  );
}

type MinimalTask = { completed: boolean };

async function fetchTasks(date: string): Promise<MinimalTask[]> {
  const res = await fetch(`/api/tasks?date=${encodeURIComponent(date)}`);
  if (!res.ok) throw new Error("خطا در دریافت تسک‌ها");
  return res.json();
}

export function DailyProgressCard() {
  const date = todayKey();
  const { data: tasks } = useQuery({
    queryKey: ["tasks", date],
    queryFn: () => fetchTasks(date),
  });

  const total = tasks?.length ?? 0;
  const done = tasks?.filter((t) => t.completed).length ?? 0;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className={cn("flex flex-col rounded-xl border border-border/60 bg-card p-4", cardShadow)}>
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <TrendingUp className="size-3.5" />
        پیشرفت امروز
      </p>
      <div className="mt-1 flex items-end gap-2">
        <span className="font-heading text-3xl font-bold tabular-nums">{pct}٪</span>
        <span className="mb-1 text-xs text-muted-foreground">
          {total === 0 ? "بدون تسک" : `${done} از ${total} تسک`}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", pct === 100 ? "bg-green-500" : "bg-primary")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
