"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function useServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Offline shell caching is a progressive enhancement; ignore failures.
      });
    }
  }, []);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  useServiceWorker();

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
