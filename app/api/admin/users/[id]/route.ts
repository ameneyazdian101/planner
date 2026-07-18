import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import * as z from "zod";
import { getApiAdminUserId } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { badRequest, readJson } from "@/lib/api";

const PatchSchema = z.object({
  isAdmin: z.boolean().optional(),
  newPassword: z
    .string()
    .min(8, { error: "رمز عبور باید حداقل ۸ کاراکتر باشد." })
    .regex(/[a-zA-Z]/, { error: "رمز عبور باید شامل حرف باشد." })
    .regex(/[0-9]/, { error: "رمز عبور باید شامل عدد باشد." })
    .optional(),
});

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/users/[id]">) {
  const adminId = await getApiAdminUserId();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const body = await readJson(request);
  if (body === null) return badRequest("بدنه درخواست معتبر نیست.");

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.isAdmin === false && id === adminId) {
    return badRequest("نمی‌توانید دسترسی ادمین خودتان را حذف کنید.");
  }

  const data: { isAdmin?: boolean; passwordHash?: string } = {};
  if (parsed.data.isAdmin !== undefined) data.isAdmin = parsed.data.isAdmin;
  if (parsed.data.newPassword) data.passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, isAdmin: true, createdAt: true },
  });

  return NextResponse.json(user);
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/admin/users/[id]">) {
  const adminId = await getApiAdminUserId();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  if (id === adminId) {
    return badRequest("نمی‌توانید حساب خودتان را حذف کنید.");
  }

  await prisma.user.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
