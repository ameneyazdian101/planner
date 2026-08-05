"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { IdCard, User } from "lucide-react";
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
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
  }, [state]);

  const showErrors = !dismissed;

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
                <Input
                  id="name"
                  name="name"
                  placeholder="نام شما"
                  className="ps-9"
                  onChange={() => setDismissed(true)}
                />
              </div>
              {showErrors && state?.errors?.name && (
                <p className="text-sm text-destructive">{state.errors.name[0]}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="identifier">ایمیل یا شماره تلفن</Label>
              <div className="relative">
                <IdCard className="pointer-events-none absolute inset-y-0 inset-s-3 my-auto size-4 text-muted-foreground" />
                <Input
                  id="identifier"
                  name="identifier"
                  type="text"
                  inputMode="email"
                  placeholder="you@example.com یا 09xxxxxxxxx"
                  className="ps-9"
                  onChange={() => setDismissed(true)}
                />
              </div>
              {showErrors && state?.errors?.identifier && (
                <p className="text-sm text-destructive">{state.errors.identifier[0]}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">رمز عبور</Label>
              <PasswordInput id="password" name="password" onChange={() => setDismissed(true)} />
              {showErrors && state?.errors?.password && (
                <ul className="text-sm text-destructive">
                  {state.errors.password.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              )}
            </div>
            {showErrors && state?.message && (
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
