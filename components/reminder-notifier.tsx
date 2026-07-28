"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

async function subscribeToPush(): Promise<boolean> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) throw new Error("کلید یادآوری روی سرور تنظیم نشده.");
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error(
      "این گوشی/مرورگر از نوتیف پشتیبانی نمی‌کنه. روی آیفون باید iOS 16.4 یا بالاتر باشه و برنامه از روی آیکون نصب‌شده روی صفحه‌خونه باز بشه."
    );
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });
  }

  const json = subscription.toJSON();
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
  });
  if (!res.ok) throw new Error("ثبت یادآوری روی سرور با خطا مواجه شد.");
  return true;
}

export function ReminderNotifier() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [ringing, setRinging] = useState(false);

  useEffect(() => {
    if (typeof Notification === "undefined") return;
    setPermission(Notification.permission);
    if (Notification.permission === "granted") {
      subscribeToPush()
        .then(setSubscribed)
        .catch(() => setSubscribed(false));
    }
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== "reminder-fired") return;
      setRinging(true);
      setTimeout(() => setRinging(false), 1000);
    };
    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () => navigator.serviceWorker.removeEventListener("message", handleMessage);
  }, []);

  const enable = async () => {
    if (typeof Notification === "undefined") {
      toast.error(
        "این گوشی/مرورگر از نوتیف پشتیبانی نمی‌کنه. روی آیفون باید iOS 16.4 یا بالاتر باشه و برنامه از روی آیکون نصب‌شده روی صفحه‌خونه باز بشه."
      );
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "denied") {
      toast.error("اجازه‌ی نوتیف داده نشد. از تنظیمات گوشی/مرورگر باید دوباره اجازه بدید.");
      return;
    }
    if (result !== "granted") return;

    try {
      setSubscribed(await subscribeToPush());
      toast.success("یادآوری تسک‌ها فعال شد.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فعال‌سازی یادآوری با خطا مواجه شد.");
    }
  };

  if (permission === "denied") return null;
  if (permission === "granted" && subscribed) {
    return (
      <button
        type="button"
        onClick={() => toast.success("یادآوری تسک‌ها فعاله.")}
        className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
        title="یادآوری تسک‌ها فعاله"
      >
        <BellRing
          fill="currentColor"
          className={cn("size-3.5", ringing && "animate-bell-ring")}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={enable}
      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
      title="فعال‌سازی یادآوری تسک‌ها"
    >
      <Bell className="size-3.5" />
      یادآوری
    </button>
  );
}
