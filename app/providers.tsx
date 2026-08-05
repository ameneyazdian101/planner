"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

function useServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Only reload once the user has agreed (see the toast below) — reloading
    // as soon as the new worker takes control could wipe out text someone is
    // mid-typing in a journal entry or a form.
    let refreshAccepted = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshAccepted) window.location.reload();
    });

    navigator.serviceWorker
      // updateViaCache: "none" ensures the sw.js script itself is always
      // re-fetched from the network instead of served from HTTP cache, so a
      // new deploy is detected right away instead of up to 24h later.
      .register("/sw.js", { updateViaCache: "none" })
      .then((registration) => {
        function promptToRefresh() {
          // No controller yet means this is the very first install on this
          // page, not an update — nothing to prompt about.
          if (!registration.waiting || !navigator.serviceWorker.controller) return;

          toast("نسخه جدید پلنر آماده‌ست", {
            description: "برای دیدن آخرین تغییرات، صفحه رو رفرش کن.",
            duration: Infinity,
            action: {
              label: "رفرش کن",
              onClick: () => {
                refreshAccepted = true;
                registration.waiting?.postMessage({ type: "SKIP_WAITING" });
              },
            },
          });
        }

        registration.addEventListener("updatefound", () => {
          registration.installing?.addEventListener("statechange", (event) => {
            if ((event.target as ServiceWorker).state === "installed") promptToRefresh();
          });
        });

        // Covers the case where an update was already waiting from earlier
        // in the session (e.g. the user closed the previous toast).
        promptToRefresh();

        const checkForUpdate = () => registration.update().catch(() => {});
        // Installed PWAs can stay open for days without a navigation, which
        // is normally what triggers the browser's own update check.
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") checkForUpdate();
        });
        window.addEventListener("focus", checkForUpdate);
      })
      .catch(() => {
        // Offline shell caching is a progressive enhancement; ignore failures.
      });
  }, []);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  useServiceWorker();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster position="top-center" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
