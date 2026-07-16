import { NextResponse, type NextRequest } from "next/server";
import * as z from "zod";
import { getApiUserId } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { badRequest, readJson } from "@/lib/api";
import { isValidDateKey, keyToUtcDate } from "@/lib/date";

const CreateGoalSchema = z.object({
  title: z.string().min(1).trim(),
  description: z.string().trim().optional(),
  type: z.enum(["SHORT_TERM", "LONG_TERM"]).optional(),
  targetDate: z.string().refine(isValidDateKey, { error: "تاریخ نامعتبر است." }).optional(),
});

export async function GET() {
  const userId = await getApiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }],
  });

  return NextResponse.json(goals);
}

export async function POST(request: NextRequest) {
  const userId = await getApiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readJson(request);
  if (body === null) return badRequest("بدنه درخواست معتبر نیست.");

  const parsed = CreateGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const goal = await prisma.goal.create({
    data: {
      userId,
      title: parsed.data.title,
      description: parsed.data.description,
      type: parsed.data.type ?? "SHORT_TERM",
      targetDate: parsed.data.targetDate ? keyToUtcDate(parsed.data.targetDate) : undefined,
    },
  });

  return NextResponse.json(goal, { status: 201 });
}
