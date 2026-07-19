import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { addDaysToKey, isValidDateKey } from "@/lib/date";
import { formatJalaliLong, jalaliWeekStartKey } from "@/lib/jalali";
import { AppHeader } from "@/components/app-header";
import { PlannerNav } from "@/components/planner-nav";
import { WeekGrid } from "@/components/week-grid";
import { Button } from "@/components/ui/button";

export default async function WeekPlannerPage(props: PageProps<"/planner/week/[weekStart]">) {
  const user = await getCurrentUser();
  const { weekStart: rawWeekStart } = await props.params;
  if (!isValidDateKey(rawWeekStart)) notFound();

  const weekStart = jalaliWeekStartKey(rawWeekStart);
  const days = Array.from({ length: 7 }, (_, i) => addDaysToKey(weekStart, i));

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader userName={user?.name} />

      <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-8">
        <PlannerNav activeDateKey={weekStart} current="week" />

      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          nativeButton={false}
          render={
            <Link href={`/planner/week/${addDaysToKey(weekStart, -7)}`} aria-label="هفته قبل">
              <ChevronRight className="size-4" />
            </Link>
          }
        />
        <div className="text-center">
          <h1 className="font-heading text-xl font-bold">
            {formatJalaliLong(days[0])} تا {formatJalaliLong(days[6])}
          </h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          nativeButton={false}
          render={
            <Link href={`/planner/week/${addDaysToKey(weekStart, 7)}`} aria-label="هفته بعد">
              <ChevronLeft className="size-4" />
            </Link>
          }
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-green-400" /> انجام‌شده (روز گذشته)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-red-400" /> انجام‌نشده (روز گذشته)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-yellow-400" /> جابه‌جا‌شده به روز دیگر
        </span>
        <span>— تسک‌ها رو می‌تونی با کشیدن، بین روزها جابه‌جا کنی</span>
      </div>

      <WeekGrid days={days} />
      </main>
    </div>
  );
}
