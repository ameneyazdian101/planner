"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import { LoginFormSchema, SignupFormSchema, type FormState } from "@/lib/definitions";

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
