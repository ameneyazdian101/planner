import { Quote, ListChecks } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { AppHeader } from "@/components/app-header";
import { TaskList } from "@/components/task-list";
import { ClockCard, DailyProgressCard } from "@/components/dashboard-widgets";
import { getDailyQuote } from "@/lib/quotes";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const quote = getDailyQuote();

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader userName={user?.name} />

      <main className="mx-auto w-full max-w-4xl flex-1 p-4 sm:p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ClockCard />
          <DailyProgressCard />
        </div>

        <blockquote className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-border/60 border-e-4 border-e-primary bg-card p-4 text-center text-sm text-muted-foreground italic shadow-[0_1px_2px_color-mix(in_oklch,var(--foreground)_5%,transparent)]">
          <Quote className="size-4 shrink-0 text-primary" />
          «{quote}»
        </blockquote>

        <section className="mt-8 max-w-2xl">
          <h1 className="mb-3 flex items-center gap-2 font-heading text-lg font-semibold">
            <ListChecks className="size-5 text-primary" />
            تسک‌های امروز
          </h1>
          <TaskList />
        </section>
      </main>
    </div>
  );
}
