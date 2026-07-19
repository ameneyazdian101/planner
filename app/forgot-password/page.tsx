"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  return (
    <AuthShell>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>فراموشی رمز عبور</CardTitle>
          <CardDescription>ایمیلت رو وارد کن تا لینک ساخت رمز جدید برات ارسال بشه</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">ایمیل</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" />
              {state?.errors?.email && (
                <p className="text-sm text-destructive">{state.errors.email[0]}</p>
              )}
            </div>
            {state?.message && (
              <p className="text-sm text-muted-foreground">{state.message}</p>
            )}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "در حال ارسال..." : "ارسال لینک بازیابی"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            رمزت یادت اومد؟{" "}
            <Link href="/login" className="underline">
              وارد شو
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
