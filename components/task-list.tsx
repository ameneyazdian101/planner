"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { todayKey } from "@/lib/date";
import { toPersianDigits } from "@/lib/jalali";
import { cn } from "@/lib/utils";

type Priority = "LOW" | "MEDIUM" | "HIGH";

type Task = {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  startTime: string | null;
  endTime: string | null;
  rescheduled: boolean;
};

export type DraggedTask = { taskId: string; sourceDate: string };
export const TASK_DRAG_MIME = "application/x-planner-task";

const priorityLabel: Record<Priority, string> = {
  LOW: "کم",
  MEDIUM: "متوسط",
  HIGH: "زیاد",
};

const priorityClass: Record<Priority, string> = {
  LOW: "text-muted-foreground",
  MEDIUM: "text-foreground",
  HIGH: "text-destructive font-medium",
};

const nextPriority: Record<Priority, Priority> = {
  LOW: "MEDIUM",
  MEDIUM: "HIGH",
  HIGH: "LOW",
};

async function fetchTasks(date: string): Promise<Task[]> {
  const res = await fetch(`/api/tasks?date=${encodeURIComponent(date)}`);
  if (!res.ok) throw new Error("خطا در دریافت تسک‌ها");
  return res.json();
}

export function TaskList({
  date = todayKey(),
  compact = false,
  draggable = false,
}: {
  date?: string;
  compact?: boolean;
  draggable?: boolean;
}) {
  const isPastDay = date < todayKey();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks", date],
    queryFn: () => fetchTasks(date),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["tasks", date] });

  const createTask = useMutation({
    mutationFn: async ({
      newTitle,
      newPriority,
      newStartTime,
      newEndTime,
    }: {
      newTitle: string;
      newPriority: Priority;
      newStartTime: string;
      newEndTime: string;
    }) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          date,
          priority: newPriority,
          startTime: newStartTime || undefined,
          endTime: newEndTime || undefined,
        }),
      });
      if (!res.ok) throw new Error("خطا در ساخت تسک");
      return res.json();
    },
    onSuccess: () => {
      setTitle("");
      setStartTime("");
      setEndTime("");
      invalidate();
    },
  });

  const toggleTask = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error("خطا در به‌روزرسانی تسک");
      return res.json();
    },
    onSuccess: invalidate,
  });

  const changePriority = useMutation({
    mutationFn: async ({ id, priority: newPriority }: { id: string; priority: Priority }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });
      if (!res.ok) throw new Error("خطا در به‌روزرسانی اولویت");
      return res.json();
    },
    onSuccess: invalidate,
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("خطا در حذف تسک");
    },
    onSuccess: invalidate,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim())
      createTask.mutate({
        newTitle: title.trim(),
        newPriority: priority,
        newStartTime: startTime,
        newEndTime: endTime,
      });
  };

  const prioritySelect = (
    <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
      <SelectTrigger className={compact ? "h-7 w-full text-xs" : "w-24"}>
        <SelectValue>{(value: Priority) => priorityLabel[value]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="LOW">کم</SelectItem>
        <SelectItem value="MEDIUM">متوسط</SelectItem>
        <SelectItem value="HIGH">زیاد</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <div className="flex flex-col gap-3">
      {compact ? (
        <form className="flex flex-col gap-1.5" onSubmit={submit}>
          <Input
            className="h-7 text-xs"
            placeholder="تسک جدید..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="flex gap-1">
            <div className="min-w-0 flex-1">{prioritySelect}</div>
            <Button
              type="submit"
              size="icon-sm"
              className="shrink-0"
              disabled={createTask.isPending || !title.trim()}
              aria-label="افزودن"
            >
              <Plus className="size-3.5" />
            </Button>
          </div>
        </form>
      ) : (
        <form className="flex flex-col gap-2" onSubmit={submit}>
          <Input
            placeholder="تسک جدید..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Input
                type="time"
                aria-label="ساعت شروع"
                className="w-26"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <span className="text-xs text-muted-foreground">تا</span>
              <Input
                type="time"
                aria-label="ساعت پایان"
                className="w-26"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
            {prioritySelect}
            <Button
              type="submit"
              className="flex-1 sm:flex-none"
              disabled={createTask.isPending || !title.trim()}
            >
              افزودن
            </Button>
          </div>
        </form>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>}

      {tasks?.length === 0 && !isLoading && (
        <p className="text-sm text-muted-foreground">هیچ تسکی برای این روز نیست.</p>
      )}

      <ul className={cn("flex flex-col", compact ? "gap-1.5" : "gap-2")}>
        {tasks?.map((task) => (
          <li
            key={task.id}
            draggable={draggable}
            onDragStart={(e) => {
              e.dataTransfer.setData(
                TASK_DRAG_MIME,
                JSON.stringify({ taskId: task.id, sourceDate: date } satisfies DraggedTask)
              );
              e.dataTransfer.effectAllowed = "move";
            }}
            className={cn(
              "flex items-center rounded-lg border",
              compact ? "gap-1.5 p-1.5" : "gap-3 p-3",
              draggable && "cursor-grab active:cursor-grabbing",
              task.rescheduled
                ? "border-yellow-400 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-950/30"
                : isPastDay && task.completed
                  ? "border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-950/30"
                  : isPastDay && !task.completed
                    ? "border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-950/30"
                    : ""
            )}
          >
            <Checkbox
              checked={task.completed}
              onCheckedChange={(checked) =>
                toggleTask.mutate({ id: task.id, completed: checked })
              }
            />
            <div className="min-w-0 flex-1">
              <span
                className={cn(
                  "block truncate",
                  compact ? "text-xs" : "text-sm",
                  task.completed && "text-muted-foreground line-through"
                )}
                title={task.title}
              >
                {task.title}
              </span>
              {task.startTime && (
                <span
                  dir="ltr"
                  className="block text-right text-xs tabular-nums text-muted-foreground"
                >
                  {toPersianDigits(task.startTime)}
                  {task.endTime ? ` – ${toPersianDigits(task.endTime)}` : ""}
                </span>
              )}
            </div>
            {!compact && (
              <button
                type="button"
                onClick={() =>
                  changePriority.mutate({ id: task.id, priority: nextPriority[task.priority] })
                }
                className={cn("shrink-0 text-xs hover:underline", priorityClass[task.priority])}
                aria-label="تغییر اولویت"
                title="برای تغییر اولویت کلیک کن"
              >
                {priorityLabel[task.priority]}
              </button>
            )}
            <Button
              variant="ghost"
              size={compact ? "icon-xs" : "icon"}
              className="shrink-0"
              onClick={() => deleteTask.mutate(task.id)}
              aria-label="حذف"
            >
              <Trash2 className={compact ? "size-3" : "size-4"} />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
