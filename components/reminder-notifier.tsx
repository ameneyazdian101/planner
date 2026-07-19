"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

async function subscribeToPush(): Promise<boolean> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey || !("serviceWorker" in navigator) || !("PushManager" in window)) return false;

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
  return res.ok;
}

export function ReminderNotifier() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (typeof Notification === "undefined") return;
    setPermission(Notification.permission);
    if (Notification.permission === "granted") {
      subscribeToPush().then(setSubscribed);
    }
  }, []);

  const enable = async () => {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      setSubscribed(await subscribeToPush());
    }
  };

  if (permission === "denied") return null;
  if (permission === "granted" && subscribed) {
    return (
      <span
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground"
        title="یادآوری تسک‌ها فعاله"
      >
        <BellRing className="size-3.5" />
      </span>
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
