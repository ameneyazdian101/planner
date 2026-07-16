import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { addDaysToKey, isValidDateKey, todayKey } from "@/lib/date";
import { formatJalaliLong, formatJalaliWeekdayLong } from "@/lib/jalali";
import { AppHeader } from "@/components/app-header";
import { JournalEditor } from "@/components/journal-editor";
import { Button } from "@/components/ui/button";

export default async function JournalDayPage(props: PageProps<"/journal/[date]">) {
  const user = await getCurrentUser();
  const { date } = await props.params;
  if (!isValidDateKey(date)) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader userName={user?.name} />

      <main className="mx-auto w-full max-w-2xl flex-1 p-4 sm:p-8">
        <h1 className="mb-3 text-lg font-medium">یادداشت روزانه</h1>

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            nativeButton={false}
            render={
              <Link href={`/journal/${addDaysToKey(date, -1)}`} aria-label="روز قبل">
                <ChevronRight className="size-4" />
              </Link>
            }
          />
          <div className="text-center">
            <p className="text-sm text-muted-foreground">{formatJalaliWeekdayLong(date)}</p>
            <p className="text-lg font-medium">{formatJalaliLong(date)}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            nativeButton={false}
            render={
              <Link href={`/journal/${addDaysToKey(date, 1)}`} aria-label="روز بعد">
                <ChevronLeft className="size-4" />
              </Link>
            }
          />
        </div>

        {date !== todayKey() && (
          <div className="mt-2 text-center">
            <Link href={`/journal/${todayKey()}`} className="text-sm text-primary underline">
              برو به امروز
            </Link>
          </div>
        )}

        <div className="mt-6">
          <JournalEditor key={date} date={date} />
        </div>
      </main>
    </div>
  );
}
