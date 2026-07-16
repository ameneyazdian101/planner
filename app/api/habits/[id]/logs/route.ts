import { NextResponse, type NextRequest } from "next/server";
import * as z from "zod";
import { getApiUserId } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { badRequest, readJson } from "@/lib/api";
import { isValidDateKey, keyToUtcDate } from "@/lib/date";

const ToggleLogSchema = z.object({
  date: z.string().refine(isValidDateKey, { error: "تاریخ نامعتبر است." }),
});

export async function POST(request: NextRequest, ctx: RouteContext<"/api/habits/[id]/logs">) {
  const userId = await getApiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: habitId } = await ctx.params;
  const habit = await prisma.habit.findUnique({ where: { id: habitId } });
  if (!habit || habit.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await readJson(request);
  if (body === null) return badRequest("بدنه درخواست معتبر نیست.");

  const parsed = ToggleLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const date = keyToUtcDate(parsed.data.date);
  const existing = await prisma.habitLog.findUnique({
    where: { habitId_date: { habitId, date } },
  });

  if (existing) {
    await prisma.habitLog.delete({ where: { id: existing.id } });
    return NextResponse.json({ completed: false });
  }

  await prisma.habitLog.create({ data: { habitId, date, completed: true } });
  return NextResponse.json({ completed: true });
}
