"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { KeyRound, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatJalaliLong } from "@/lib/jalali";
import { dateKeyFromUtcDate } from "@/lib/date";

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  createdAt: string;
  _count: { tasks: number; goals: number; habits: number; journals: number };
};

async function fetchUsers(): Promise<AdminUser[]> {
  const res = await fetch("/api/admin/users");
  if (!res.ok) throw new Error("خطا در دریافت کاربران");
  return res.json();
}

export function AdminUserTable({ currentAdminId }: { currentAdminId: string }) {
  const queryClient = useQueryClient();
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchUsers,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-users"] });

  const toggleAdmin = useMutation({
    mutationFn: async ({ id, isAdmin }: { id: string; isAdmin: boolean }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "خطا در تغییر دسترسی");
      }
    },
    onSuccess: invalidate,
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "خطا در حذف کاربر");
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success("کاربر حذف شد.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const resetPassword = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.fieldErrors?.newPassword?.[0] ?? body?.error ?? "خطا در تغییر رمز عبور");
      }
    },
    onSuccess: () => {
      toast.success("رمز عبور با موفقیت تغییر کرد.");
      setResetTarget(null);
      setNewPassword("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>;
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-right text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">نام</th>
              <th className="px-3 py-2 font-medium">ایمیل</th>
              <th className="px-3 py-2 font-medium">نقش</th>
              <th className="px-3 py-2 font-medium">تاریخ ثبت‌نام</th>
              <th className="px-3 py-2 font-medium">تسک/هدف/عادت/یادداشت</th>
              <th className="px-3 py-2 font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="px-3 py-2">{user.name ?? "—"}</td>
                <td className="px-3 py-2">{user.email}</td>
                <td className="px-3 py-2">
                  {user.isAdmin ? (
                    <Badge>ادمین</Badge>
                  ) : (
                    <Badge variant="secondary">کاربر</Badge>
                  )}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {formatJalaliLong(dateKeyFromUtcDate(new Date(user.createdAt)))}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {user._count.tasks}/{user._count.goals}/{user._count.habits}/{user._count.journals}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="تغییر رمز عبور"
                      onClick={() => {
                        setResetTarget(user);
                        setNewPassword("");
                      }}
                    >
                      <KeyRound className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={user.isAdmin ? "حذف دسترسی ادمین" : "دادن دسترسی ادمین"}
                      disabled={toggleAdmin.isPending || (user.isAdmin && user.id === currentAdminId)}
                      onClick={() => toggleAdmin.mutate({ id: user.id, isAdmin: !user.isAdmin })}
                    >
                      {user.isAdmin ? (
                        <ShieldOff className="size-3.5" />
                      ) : (
                        <ShieldCheck className="size-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="حذف کاربر"
                      disabled={deleteUser.isPending || user.id === currentAdminId}
                      onClick={() => {
                        if (confirm(`کاربر «${user.name ?? user.email}» حذف شود؟ این عمل همه داده‌های او را نیز پاک می‌کند.`)) {
                          deleteUser.mutate(user.id);
                        }
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users?.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">هنوز کاربری ثبت‌نام نکرده.</p>
      )}

      <Dialog open={resetTarget !== null} onOpenChange={(open) => !open && setResetTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغییر رمز عبور</DialogTitle>
            <DialogDescription>
              رمز عبور جدید برای «{resetTarget?.name ?? resetTarget?.email}» را وارد کنید.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="text"
            placeholder="رمز عبور جدید (حداقل ۸ کاراکتر، شامل حرف و عدد)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <DialogFooter>
            <Button
              disabled={!newPassword || resetPassword.isPending}
              onClick={() => {
                if (resetTarget) resetPassword.mutate({ id: resetTarget.id, password: newPassword });
              }}
            >
              ثبت رمز جدید
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
