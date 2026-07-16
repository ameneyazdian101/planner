import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { addDaysToKey, isValidDateKey, todayKey } from "@/lib/date";
import { formatJalaliLong, formatJalaliWeekdayLong } from "@/lib/jalali";
import { AppHeader } from "@/components/app-header";
import { PlannerNav } from "@/components/planner-nav";
import { TaskList } from "@/components/task-list";
import { Button } from "@/components/ui/button";

export default async function DayPlannerPage(props: PageProps<"/planner/day/[date]">) {
  const user = await getCurrentUser();
  const { date } = await props.params;
  if (!isValidDateKey(date)) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader userName={user?.name} />

      <main className="mx-auto w-full max-w-2xl flex-1 p-4 sm:p-8">
        <PlannerNav activeDateKey={date} current="day" />

        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            nativeButton={false}
            render={
              <Link href={`/planner/day/${addDaysToKey(date, -1)}`} aria-label="روز قبل">
                <ChevronRight className="size-4" />
              </Link>
            }
          />
          <div className="text-center">
            <p className="text-sm text-muted-foreground">{formatJalaliWeekdayLong(date)}</p>
            <h1 className="text-xl font-semibold">{formatJalaliLong(date)}</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            nativeButton={false}
            render={
              <Link href={`/planner/day/${addDaysToKey(date, 1)}`} aria-label="روز بعد">
                <ChevronLeft className="size-4" />
              </Link>
            }
          />
        </div>

        {date !== todayKey() && (
          <div className="mt-2 text-center">
            <Link href={`/planner/day/${todayKey()}`} className="text-sm text-primary underline">
              برو به امروز
            </Link>
          </div>
        )}

        <div className="mt-6">
          <TaskList date={date} />
        </div>
      </main>
    </div>
  );
}
