import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { decrypt } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const verifySession = cache(async () => {
  const cookie = (await cookies()).get("session")?.value;
  const session = await decrypt(cookie);

  if (!session?.userId) {
    redirect("/login");
  }

  return { isAuth: true, userId: session.userId };
});

/** For Route Handlers: returns the userId or null, never redirects. */
export const getApiUserId = cache(async () => {
  const cookie = (await cookies()).get("session")?.value;
  const session = await decrypt(cookie);
  return session?.userId ?? null;
});

export const getCurrentUser = cache(async () => {
  const session = await verifySession();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, createdAt: true, isAdmin: true },
  });

  return user;
});

/** For admin-only Server Components: redirects non-admins to a 404 instead of revealing the route exists. */
export const requireAdmin = cache(async () => {
  const session = await verifySession();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, isAdmin: true },
  });

  if (!user?.isAdmin) {
    notFound();
  }

  return user;
});

/** For admin-only Route Handlers: returns the admin userId or null, never redirects. */
export const getApiAdminUserId = cache(async () => {
  const userId = await getApiUserId();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });

  return user?.isAdmin ? userId : null;
});
