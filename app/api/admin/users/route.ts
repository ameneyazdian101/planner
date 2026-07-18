import { NextResponse } from "next/server";
import { getApiAdminUserId } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const adminId = await getApiAdminUserId();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      isAdmin: true,
      createdAt: true,
      _count: { select: { tasks: true, goals: true, habits: true, journals: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}
