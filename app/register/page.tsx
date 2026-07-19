"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mail, User } from "lucide-react";
import { signup } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <AuthShell>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>ساخت حساب کاربری</CardTitle>
          <CardDescription>پلنر شخصی خودت رو شروع کن</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">نام</Label>
              <div className="relative">
                <User className="pointer-events-none absolute inset-y-0 inset-s-3 my-auto size-4 text-muted-foreground" />
                <Input id="name" name="name" placeholder="نام شما" className="ps-9" />
              </div>
              {state?.errors?.name && (
                <p className="text-sm text-destructive">{state.errors.name[0]}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">ایمیل</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute inset-y-0 inset-s-3 my-auto size-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="ps-9"
                />
              </div>
              {state?.errors?.email && (
                <p className="text-sm text-destructive">{state.errors.email[0]}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">رمز عبور</Label>
              <PasswordInput id="password" name="password" />
              {state?.errors?.password && (
                <ul className="text-sm text-destructive">
                  {state.errors.password.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              )}
            </div>
            {state?.message && (
              <p className="text-sm text-destructive">{state.message}</p>
            )}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "در حال ساخت حساب..." : "ثبت‌نام"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            حساب داری؟{" "}
            <Link href="/login" className="underline">
              وارد شو
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
