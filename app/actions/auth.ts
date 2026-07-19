"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import { createResetToken, verifyResetToken } from "@/lib/reset-token";
import { sendPasswordResetEmail } from "@/lib/mailer";
import {
  ForgotPasswordFormSchema,
  LoginFormSchema,
  ResetPasswordFormSchema,
  SignupFormSchema,
  type FormState,
} from "@/lib/definitions";

export async function signup(_state: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = SignupFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, email, password } = validatedFields.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { message: "این ایمیل قبلاً ثبت شده است." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  await createSession(user.id);
  redirect("/dashboard");
}

export async function login(_state: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = LoginFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { email, password } = validatedFields.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { message: "ایمیل یا رمز عبور اشتباه است." };
  }

  const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordsMatch) {
    return { message: "ایمیل یا رمز عبور اشتباه است." };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

async function siteOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function requestPasswordReset(_state: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = ForgotPasswordFormSchema.safeParse({
    email: formData.get("email"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { email } = validatedFields.data;

  // Always report success, whether or not the email is registered, so this endpoint
  // can't be used to discover which emails have an account.
  const genericMessage: FormState = {
    message: "اگر این ایمیل در پلنر ثبت شده باشد، لینک بازیابی رمز عبور برایش ارسال شد.",
  };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return genericMessage;

  const token = await createResetToken(user.id);
  const resetUrl = `${await siteOrigin()}/reset-password?token=${token}`;

  try {
    await sendPasswordResetEmail(user.email, resetUrl);
  } catch (err) {
    console.error("[auth] Failed to send password reset email:", err instanceof Error ? err.stack : err);
    return { message: "ارسال ایمیل با خطا مواجه شد. کمی بعد دوباره امتحان کن." };
  }

  return genericMessage;
}

export async function resetPassword(
  token: string,
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = ResetPasswordFormSchema.safeParse({
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const payload = await verifyResetToken(token);
  if (!payload) {
    return { message: "لینک بازیابی نامعتبر یا منقضی شده است." };
  }

  const passwordHash = await bcrypt.hash(validatedFields.data.password, 10);
  const user = await prisma.user.update({
    where: { id: payload.userId },
    data: { passwordHash },
  });

  await createSession(user.id);
  redirect("/dashboard");
}
