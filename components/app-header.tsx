"use client";

import { useEffect, useState } from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LogOut, type LucideIcon, Loader2, NotebookPen, Repeat2, Sparkles, Target } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ReminderNotifier } from "@/components/reminder-notifier";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { todayKey } from "@/lib/date";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: `/planner/day/${todayKey()}`, matchPrefix: "/planner", label: "برنامه‌ریز", icon: CalendarDays },
  { href: "/goals", matchPrefix: "/goals", label: "اهداف", icon: Target },
  { href: "/habits", matchPrefix: "/habits", label: "عادت‌ها", icon: Repeat2 },
  { href: "/journal", matchPrefix: "/journal", label: "یادداشت روزانه", icon: NotebookPen },
  { href: "/assistant", matchPrefix: "/assistant", label: "دستیار هوشمند", icon: Sparkles },
];

function NavTabContent({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  const { pending } = useLinkStatus();
  return (
    <>
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Icon className="size-3.5" />}
      <span className="hidden lg:inline">{label}</span>
    </>
  );
}

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
    <header className="sticky top-0 z-20 border-b border-border/70 bg-card/90 backdrop-blur-sm supports-backdrop-filter:bg-card/70">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Logo href="/dashboard" />
          <div className="hidden items-center gap-2 border-r border-border pr-3 sm:flex">
            <Avatar size="sm">
              <AvatarFallback>{(userName ?? "؟").charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">سلام{greeting ? ` ${greeting}` : ""}</span>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-1 rounded-xl bg-muted/70 p-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.matchPrefix);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <NavTabContent icon={item.icon} label={item.label} />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <ReminderNotifier />
          <ThemeToggle />
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
