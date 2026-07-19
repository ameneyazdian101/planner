"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { login } from "@/app/actions/auth";
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

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <AuthShell>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>ورود</CardTitle>
          <CardDescription>به پلنر خودت برگرد</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="flex flex-col gap-4">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">رمز عبور</Label>
                <Link href="/forgot-password" className="text-xs text-muted-foreground underline">
                  رمزت یادت رفته؟
                </Link>
              </div>
              <PasswordInput id="password" name="password" />
              {state?.errors?.password && (
                <p className="text-sm text-destructive">{state.errors.password[0]}</p>
              )}
            </div>
            {state?.message && (
              <p className="text-sm text-destructive">{state.message}</p>
            )}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "در حال ورود..." : "ورود"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            حساب نداری؟{" "}
            <Link href="/register" className="underline">
              ثبت‌نام کن
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
