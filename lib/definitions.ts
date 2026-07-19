import * as z from "zod";

export const SignupFormSchema = z.object({
  name: z.string().min(2, { error: "نام باید حداقل ۲ حرف باشد." }).trim(),
  email: z.email({ error: "ایمیل معتبر وارد کنید." }).trim(),
  password: z
    .string()
    .min(8, { error: "رمز عبور باید حداقل ۸ کاراکتر باشد." })
    .regex(/[a-zA-Z]/, { error: "رمز عبور باید شامل حرف باشد." })
    .regex(/[0-9]/, { error: "رمز عبور باید شامل عدد باشد." })
    .trim(),
});

export const LoginFormSchema = z.object({
  email: z.email({ error: "ایمیل معتبر وارد کنید." }).trim(),
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
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;
