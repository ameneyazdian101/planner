import { Repeat2 } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { AppHeader } from "@/components/app-header";
import { HabitGrid } from "@/components/habit-grid";

export default async function HabitsPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader userName={user?.name} />

      <main className="mx-auto w-full max-w-3xl flex-1 p-4 sm:p-8">
        <h1 className="mb-3 flex items-center gap-2 font-heading text-lg font-semibold">
          <Repeat2 className="size-5 text-primary" />
          عادت‌ها
        </h1>
        <HabitGrid />
      </main>
    </div>
  );
}
