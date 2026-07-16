import { NextResponse, type NextRequest } from "next/server";
import * as z from "zod";
import { getApiUserId } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { badRequest, readJson } from "@/lib/api";
import { isValidDateKey, keyToUtcDate } from "@/lib/date";

const UpdateGoalSchema = z.object({
  title: z.string().min(1).trim().optional(),
  description: z.string().trim().optional(),
  type: z.enum(["SHORT_TERM", "LONG_TERM"]).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  targetDate: z.string().refine(isValidDateKey, { error: "تاریخ نامعتبر است." }).optional(),
});

async function findOwnedGoal(id: string, userId: string) {
  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal || goal.userId !== userId) return null;
  return goal;
}

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/goals/[id]">) {
  const userId = await getApiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  if (!(await findOwnedGoal(id, userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await readJson(request);
  if (body === null) return badRequest("بدنه درخواست معتبر نیست.");

  const parsed = UpdateGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const goal = await prisma.goal.update({
    where: { id },
    data: {
      ...parsed.data,
      targetDate: parsed.data.targetDate ? keyToUtcDate(parsed.data.targetDate) : undefined,
    },
  });

  return NextResponse.json(goal);
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/goals/[id]">) {
  const userId = await getApiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  if (!(await findOwnedGoal(id, userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.goal.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
