import { NextResponse, type NextRequest } from "next/server";
import { getApiUserId } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

async function findOwnedHabit(id: string, userId: string) {
  const habit = await prisma.habit.findUnique({ where: { id } });
  if (!habit || habit.userId !== userId) return null;
  return habit;
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/habits/[id]">) {
  const userId = await getApiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  if (!(await findOwnedHabit(id, userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.habit.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
