import { redirect } from "next/navigation";
import { todayKey } from "@/lib/date";

export default function JournalIndexPage() {
  redirect(`/journal/${todayKey()}`);
}
