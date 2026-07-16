import { NextResponse, type NextRequest } from "next/server";
import * as z from "zod";
import { getApiUserId } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { badRequest, readJson } from "@/lib/api";
import { isValidDateKey, keyToUtcDate } from "@/lib/date";

const SaveEntrySchema = z.object({
  date: z.string().refine(isValidDateKey, { error: "تاریخ نامعتبر است." }),
  content: z.string().trim(),
  mood: z.string().trim().optional(),
});

export async function GET(request: NextRequest) {
  const userId = await getApiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dateParam = request.nextUrl.searchParams.get("date");
  if (!dateParam || !isValidDateKey(dateParam)) {
    return badRequest("تاریخ نامعتبر است.");
  }

  const entry = await prisma.journalEntry.findUnique({
    where: { userId_date: { userId, date: keyToUtcDate(dateParam) } },
  });

  return NextResponse.json(entry);
}

export async function PUT(request: NextRequest) {
  const userId = await getApiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readJson(request);
  if (body === null) return badRequest("بدنه درخواست معتبر نیست.");

  const parsed = SaveEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const date = keyToUtcDate(parsed.data.date);

  if (!parsed.data.content) {
    await prisma.journalEntry.deleteMany({ where: { userId, date } });
    return NextResponse.json(null);
  }

  const entry = await prisma.journalEntry.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, content: parsed.data.content, mood: parsed.data.mood },
    update: { content: parsed.data.content, mood: parsed.data.mood },
  });

  return NextResponse.json(entry);
}
