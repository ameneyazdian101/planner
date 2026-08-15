import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { dayRangeForKey, todayKeyInTehran } from "@/lib/date";

/**
 * Runs once a day shortly after midnight (Iran time). Any task still
 * incomplete from a previous day is pushed forward to today so it isn't
 * silently lost off the bottom of the calendar; `reminded` is cleared so
 * its push reminder (if it has a startTime) can fire again on the new day.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const querySecret = request.nextUrl.searchParams.get("secret");
  const authorized =
    !!process.env.CRON_SECRET &&
    (authHeader === `Bearer ${process.env.CRON_SECRET}` || querySecret === process.env.CRON_SECRET);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { gte: todayStart } = dayRangeForKey(todayKeyInTehran());

  const result = await prisma.task.updateMany({
    where: { date: { lt: todayStart }, completed: false },
    data: { date: todayStart, rescheduled: true, reminded: false },
  });

  return NextResponse.json({ rescheduled: result.count });
}
