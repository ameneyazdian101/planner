import { getCurrentUser } from "@/lib/dal";
import { AppHeader } from "@/components/app-header";
import { ChatAssistant } from "@/components/chat-assistant";

export default async function AssistantPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader userName={user?.name} />

      <main className="mx-auto w-full max-w-2xl flex-1 p-4 sm:p-8">
        <h1 className="mb-3 text-lg font-medium">دستیار هوشمند</h1>
        <ChatAssistant />
      </main>
    </div>
  );
}
