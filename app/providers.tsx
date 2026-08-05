"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

function useServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Reload once the new service worker actually takes control, so an
    // installed PWA that's been sitting open doesn't keep running stale JS.
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });

    navigator.serviceWorker
      // updateViaCache: "none" ensures the sw.js script itself is always
      // re-fetched from the network instead of served from HTTP cache, so a
      // new deploy is detected right away instead of up to 24h later.
      .register("/sw.js", { updateViaCache: "none" })
      .then((registration) => {
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
