import * as z from "zod";

const iranPhoneRegex = /^09\d{9}$/;

export type NormalizedIdentifier =
  | { type: "email"; value: string }
  | { type: "phone"; value: string };

/** Accepts an email or an Iranian mobile number (09xxxxxxxxx, +98..., 0098...) and normalizes it. */
export function normalizeIdentifier(raw: string): NormalizedIdentifier | null {
  const trimmed = raw.trim();
  if (trimmed.includes("@")) {
    const parsed = z.email().safeParse(trimmed);
    return parsed.success ? { type: "email", value: parsed.data } : null;
  }

  let digits = trimmed.replace(/[\s-]/g, "");
  if (digits.startsWith("+98")) digits = "0" + digits.slice(3);
  else if (digits.startsWith("0098")) digits = "0" + digits.slice(4);
  else if (digits.startsWith("98") && digits.length === 12) digits = "0" + digits.slice(2);

  return iranPhoneRegex.test(digits) ? { type: "phone", value: digits } : null;
}

export const SignupFormSchema = z
  .object({
    name: z.string().min(2, { error: "نام باید حداقل ۲ حرف باشد." }).trim(),
    identifier: z.string().min(1, { error: "ایمیل یا شماره تلفن را وارد کنید." }).trim(),
    password: z
      .string()
      .min(8, { error: "رمز عبور باید حداقل ۸ کاراکتر باشد." })
      .regex(/[a-zA-Z]/, { error: "رمز عبور باید شامل حرف باشد." })
      .regex(/[0-9]/, { error: "رمز عبور باید شامل عدد باشد." })
      .trim(),
  })
  .refine((data) => normalizeIdentifier(data.identifier) !== null, {
    path: ["identifier"],
    error: "ایمیل یا شماره تلفن معتبر وارد کنید.",
  });

export const LoginFormSchema = z.object({
  identifier: z.string().min(1, { error: "ایمیل یا شماره تلفن را وارد کنید." }).trim(),
  password: z.string().min(1, { error: "رمز عبور را وارد کنید." }),
});

export const ForgotPasswordFormSchema = z.object({
  email: z.email({ error: "ایمیل معتبر وارد کنید." }).trim(),
});

export const ResetPasswordFormSchema = z.object({
  password: z
    .string()
    .min(8, { error: "رمز عبور باید حداقل ۸ کاراکتر باشد." })
    .regex(/[a-zA-Z]/, { error: "رمز عبور باید شامل حرف باشد." })
    .regex(/[0-9]/, { error: "رمز عبور باید شامل عدد باشد." })
    .trim(),
});

export type FormState =
  | {
      errors?: {
        name?: string[];
        identifier?: string[];
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;
