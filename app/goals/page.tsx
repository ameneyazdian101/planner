import { Target } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { AppHeader } from "@/components/app-header";
import { GoalList } from "@/components/goal-list";

export default async function GoalsPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader userName={user?.name} />

      <main className="mx-auto w-full max-w-2xl flex-1 p-4 sm:p-8">
        <h1 className="mb-3 flex items-center gap-2 font-heading text-lg font-semibold">
          <Target className="size-5 text-primary" />
          اهداف
        </h1>
        <GoalList />
      </main>
    </div>
  );
}
