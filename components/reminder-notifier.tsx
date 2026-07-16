"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { todayKey } from "@/lib/date";

type Task = { id: string; title: string; startTime: string | null; completed: boolean };

const CHECK_INTERVAL_MS = 30_000;
const REMINDER_WINDOW_MINUTES = 2;

function minutesSinceStart(startTime: string, now: Date): number {
  const [h, m] = startTime.split(":").map(Number);
  const startMinutes = h * 60 + m;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes - startMinutes;
}

async function notify(title: string) {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  registration.showNotification("یادآوری تسک", {
    body: title,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "task-reminder",
  });
}

export function ReminderNotifier() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof Notification === "undefined") return;
    setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

    const check = async () => {
      try {
        const res = await fetch(`/api/tasks?date=${todayKey()}`);
        if (!res.ok) return;
        const tasks: Task[] = await res.json();
        const now = new Date();

        for (const task of tasks) {
          if (task.completed || !task.startTime || notifiedRef.current.has(task.id)) continue;
          const diff = minutesSinceStart(task.startTime, now);
          if (diff >= 0 && diff <= REMINDER_WINDOW_MINUTES) {
            notifiedRef.current.add(task.id);
            notify(task.title);
          }
        }
      } catch {
        // Reminders are a progressive enhancement; ignore transient failures.
      }
    };

    check();
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [permission]);

  const requestPermission = async () => {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  if (permission === null || permission === "granted" || permission === "denied") return null;

  return (
    <button
      type="button"
      onClick={requestPermission}
      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
      title="فعال‌سازی یادآوری تسک‌ها"
    >
      <Bell className="size-3.5" />
      یادآوری
    </button>
  );
}
