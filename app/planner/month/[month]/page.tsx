import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { todayKey } from "@/lib/date";
import {
  adjacentMonthKey,
  formatMonthLabel,
  jalaliToKey,
  monthDateRange,
  monthGridKeys,
  parseMonthKey,
} from "@/lib/jalali";
import { AppHeader } from "@/components/app-header";
import { PlannerNav } from "@/components/planner-nav";
import { MonthGrid } from "@/components/month-grid";
import { Button } from "@/components/ui/button";

const MONTH_KEY_RE = /^\d{1,4}-\d{1,2}$/;

export default async function MonthPlannerPage(props: PageProps<"/planner/month/[month]">) {
  const user = await getCurrentUser();
  const { month } = await props.params;
  if (!MONTH_KEY_RE.test(month)) notFound();

  const { jy, jm } = parseMonthKey(month);
  if (jm < 1 || jm > 12) notFound();

  const anchorDateKey = jalaliToKey(jy, jm, 1);
  const days = monthGridKeys(month);
  const { firstDayKey, lastDayKey } = monthDateRange(month);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader userName={user?.name} />

      <main className="mx-auto w-full max-w-3xl flex-1 p-4 sm:p-8">
        <PlannerNav activeDateKey={anchorDateKey} current="month" />

      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          nativeButton={false}
          render={
            <Link href={`/planner/month/${adjacentMonthKey(month, -1)}`} aria-label="ماه قبل">
              <ChevronRight className="size-4" />
            </Link>
          }
        />
        <h1 className="text-xl font-semibold">{formatMonthLabel(month)}</h1>
        <Button
          variant="ghost"
          size="icon"
          nativeButton={false}
          render={
            <Link href={`/planner/month/${adjacentMonthKey(month, 1)}`} aria-label="ماه بعد">
              <ChevronLeft className="size-4" />
            </Link>
          }
        />
      </div>

      <MonthGrid days={days} currentMonthJm={jm} from={firstDayKey} to={lastDayKey} />

        {!days.includes(todayKey()) && (
          <div className="mt-4 text-center">
            <Link href={`/planner/day/${todayKey()}`} className="text-sm text-primary underline">
              برو به امروز
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
