import { NextResponse, type NextRequest } from "next/server";
import * as z from "zod";
import { getApiUserId } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { dayRangeForKey, isValidDateKey } from "@/lib/date";
import { badRequest, readJson } from "@/lib/api";

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: "ساعت نامعتبر است." });

const UpdateTaskSchema = z.object({
  title: z.string().min(1).trim().optional(),
  description: z.string().trim().optional(),
  completed: z.boolean().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  date: z.string().refine(isValidDateKey, { error: "تاریخ نامعتبر است." }).optional(),
  startTime: timeSchema.nullable().optional(),
  endTime: timeSchema.nullable().optional(),
  rescheduled: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/tasks/[id]">) {
  const userId = await getApiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await readJson(request);
  if (body === null) return badRequest("بدنه درخواست معتبر نیست.");

  const parsed = UpdateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...parsed.data,
      date: parsed.data.date ? dayRangeForKey(parsed.data.date).gte : undefined,
    },
  });

  return NextResponse.json(task);
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/tasks/[id]">) {
  const userId = await getApiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.task.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
