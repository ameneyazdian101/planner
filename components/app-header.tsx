"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ReminderNotifier } from "@/components/reminder-notifier";
import { todayKey } from "@/lib/date";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: `/planner/day/${todayKey()}`, matchPrefix: "/planner", label: "برنامه‌ریز" },
  { href: "/goals", matchPrefix: "/goals", label: "اهداف" },
  { href: "/habits", matchPrefix: "/habits", label: "عادت‌ها" },
  { href: "/journal", matchPrefix: "/journal", label: "یادداشت روزانه" },
  { href: "/assistant", matchPrefix: "/assistant", label: "دستیار هوشمند" },
];

function greetingForHour(hour: number): string {
  if (hour >= 5 && hour < 12) return "صبح بخیر";
  if (hour >= 12 && hour < 16) return "ظهر بخیر";
  if (hour >= 16 && hour < 19) return "عصر بخیر";
  return "شب بخیر";
}

export function AppHeader({ userName }: { userName?: string | null }) {
  const pathname = usePathname();
  const [greeting, setGreeting] = useState<string | null>(null);

  useEffect(() => {
    setGreeting(greetingForHour(new Date().getHours()));
  }, []);

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-lg font-semibold text-primary">
            پلنر
          </Link>
          <div className="hidden items-center gap-2 border-r pr-3 sm:flex">
            <Avatar size="sm">
              <AvatarFallback>{(userName ?? "؟").charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">سلام{greeting ? ` ${greeting}` : ""}</span>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-1 rounded-lg bg-muted p-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.matchPrefix);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <ReminderNotifier />
          <form action={logout}>
            <Button variant="outline" size="sm" type="submit">
              <LogOut className="size-3.5" />
              خروج
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
