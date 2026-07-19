import Link from "next/link";
import { cn } from "@/lib/utils";
import { jalaliWeekStartKey, keyToJalali, monthKeyFromJalali } from "@/lib/jalali";

export function PlannerNav({
  activeDateKey,
  current,
}: {
  activeDateKey: string;
  current: "day" | "week" | "month";
}) {
  const { jy, jm } = keyToJalali(activeDateKey);

  const tabs = [
    { key: "day", label: "روز", href: `/planner/day/${activeDateKey}` },
    { key: "week", label: "هفته", href: `/planner/week/${jalaliWeekStartKey(activeDateKey)}` },
    { key: "month", label: "ماه", href: `/planner/month/${monthKeyFromJalali(jy, jm)}` },
  ] as const;

  return (
    <div className="flex gap-1 rounded-xl border border-border/60 bg-muted/50 p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={cn(
            "flex-1 rounded-lg px-3 py-1.5 text-center text-sm font-medium transition-colors",
            current === tab.key
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
