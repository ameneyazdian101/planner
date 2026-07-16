"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { formatJalaliLong, formatJalaliWeekdayLong } from "@/lib/jalali";
import { todayKey } from "@/lib/date";
import { TaskList, TASK_DRAG_MIME, type DraggedTask } from "@/components/task-list";
import { cn } from "@/lib/utils";

export function WeekGrid({ days }: { days: string[] }) {
  const today = todayKey();
  const queryClient = useQueryClient();
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);

  async function handleDrop(e: React.DragEvent<HTMLDivElement>, targetDate: string) {
    e.preventDefault();
    setDragOverDay(null);

    const raw = e.dataTransfer.getData(TASK_DRAG_MIME);
    if (!raw) return;
    const { taskId, sourceDate }: DraggedTask = JSON.parse(raw);
    if (sourceDate === targetDate) return;

    const wasOverdue = sourceDate < today;
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: targetDate, rescheduled: wasOverdue || undefined }),
    });
    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ["tasks", sourceDate] });
      queryClient.invalidateQueries({ queryKey: ["tasks", targetDate] });
    }
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-7">
      {days.map((day) => (
        <div
          key={day}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverDay(day);
          }}
          onDragLeave={() => setDragOverDay((d) => (d === day ? null : d))}
          onDrop={(e) => handleDrop(e, day)}
          className={cn(
            "rounded-lg border p-3 transition-colors",
            day === today && "border-primary",
            dragOverDay === day && "border-primary bg-accent/50"
          )}
        >
          <Link href={`/planner/day/${day}`} className="mb-2 block text-center hover:underline">
            <p className="text-xs text-muted-foreground">{formatJalaliWeekdayLong(day)}</p>
            <p className="text-sm font-medium">{formatJalaliLong(day)}</p>
          </Link>
          <TaskList date={day} compact draggable />
        </div>
      ))}
    </div>
  );
}
