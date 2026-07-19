import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { dayRangeForKey } from "@/lib/date";
import { isExpiredSubscriptionError, sendPushNotification } from "@/lib/push";

const REMINDER_LEAD_MINUTES = 10;

/** Vercel's runtime clock is UTC; task times are plain HH:mm entered as Iran wall-clock time. */
function nowInIran(): { dateKey: string; hhmm: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    dateKey: `${get("year")}-${get("month")}-${get("day")}`,
    hhmm: `${get("hour")}:${get("minute")}`,
  };
}

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { dateKey, hhmm } = nowInIran();
  const nowMinutes = toMinutes(hhmm);

  const candidates = await prisma.task.findMany({
    where: { date: dayRangeForKey(dateKey), completed: false, reminded: false, startTime: { not: null } },
    include: { user: { include: { pushSubscriptions: true } } },
  });

  const due = candidates.filter((task) => {
    const startMinutes = toMinutes(task.startTime!);
    const diff = startMinutes - nowMinutes;
    return diff >= 0 && diff <= REMINDER_LEAD_MINUTES;
  });

  let sent = 0;
  let expiredRemoved = 0;

  for (const task of due) {
    for (const sub of task.user.pushSubscriptions) {
      try {
        await sendPushNotification(sub, {
          title: "یادآوری تسک",
          body: task.title,
          tag: `task-${task.id}`,
          url: "/dashboard",
        });
        sent++;
      } catch (err) {
        if (isExpiredSubscriptionError(err)) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          expiredRemoved++;
        } else {
          console.error("[cron/reminders] push send failed:", err instanceof Error ? err.message : err);
        }
      }
    }

    // Best-effort, one attempt per task — mark as reminded even on failed/absent
    // subscriptions so a transient push error doesn't retry-storm every cron tick.
    await prisma.task.update({ where: { id: task.id }, data: { reminded: true } });
  }

  return NextResponse.json({ checked: candidates.length, due: due.length, sent, expiredRemoved });
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
