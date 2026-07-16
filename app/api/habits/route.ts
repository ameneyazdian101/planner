import { NextResponse, type NextRequest } from "next/server";
import * as z from "zod";
import { getApiUserId } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { badRequest, readJson } from "@/lib/api";
import { addDaysToKey, isValidDateKey, rangeForKeys, todayKey } from "@/lib/date";

const CreateHabitSchema = z.object({
  name: z.string().min(1).trim(),
  color: z.string().trim().optional(),
});

export async function GET(request: NextRequest) {
  const userId = await getApiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const fromParam = params.get("from");
  const toParam = params.get("to");
  const to = toParam && isValidDateKey(toParam) ? toParam : todayKey();
  const from = fromParam && isValidDateKey(fromParam) ? fromParam : addDaysToKey(to, -6);

  const habits = await prisma.habit.findMany({
    where: { userId },
    orderBy: [{ createdAt: "asc" }],
    include: { logs: { where: { date: rangeForKeys(from, to) } } },
  });

  return NextResponse.json(habits);
}

export async function POST(request: NextRequest) {
  const userId = await getApiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readJson(request);
  if (body === null) return badRequest("بدنه درخواست معتبر نیست.");

  const parsed = CreateHabitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const habit = await prisma.habit.create({
    data: {
      userId,
      name: parsed.data.name,
      color: parsed.data.color ?? "#2563eb",
    },
  });

  return NextResponse.json({ ...habit, logs: [] }, { status: 201 });
}
