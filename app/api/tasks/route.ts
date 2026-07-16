import { NextResponse, type NextRequest } from "next/server";
import * as z from "zod";
import { getApiUserId } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { dayRangeForKey, isValidDateKey, rangeForKeys, todayKey } from "@/lib/date";
import { badRequest, readJson } from "@/lib/api";

const dateKeySchema = z.string().refine(isValidDateKey, { error: "تاریخ نامعتبر است." });
const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: "ساعت نامعتبر است." });

const CreateTaskSchema = z
  .object({
    title: z.string().min(1).trim(),
    description: z.string().trim().optional(),
    date: dateKeySchema,
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    startTime: timeSchema.optional(),
    endTime: timeSchema.optional(),
  })
  .refine((v) => !v.startTime || !v.endTime || v.startTime < v.endTime, {
    error: "ساعت پایان باید بعد از ساعت شروع باشد.",
    path: ["endTime"],
  });

export async function GET(request: NextRequest) {
  const userId = await getApiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const from = params.get("from");
  const to = params.get("to");
  const date = params.get("date");

  let range: { gte: Date; lt: Date };
  if (from && to) {
    if (!isValidDateKey(from) || !isValidDateKey(to)) {
      return NextResponse.json({ error: "بازه تاریخ نامعتبر است." }, { status: 400 });
    }
    range = rangeForKeys(from, to);
  } else {
    const key = date && isValidDateKey(date) ? date : todayKey();
    range = dayRangeForKey(key);
  }

  const tasks = await prisma.task.findMany({
    where: { userId, date: range },
    orderBy: [{ date: "asc" }, { completed: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  const userId = await getApiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readJson(request);
  if (body === null) return badRequest("بدنه درخواست معتبر نیست.");

  const parsed = CreateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      userId,
      title: parsed.data.title,
      description: parsed.data.description,
      date: dayRangeForKey(parsed.data.date).gte,
      priority: parsed.data.priority ?? "MEDIUM",
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
    },
  });

  return NextResponse.json(task, { status: 201 });
}
