import { requireAdmin } from "@/lib/dal";
import { AppHeader } from "@/components/app-header";
import { AdminUserTable } from "@/components/admin-user-table";

export default async function AdminPage() {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader userName={admin.name} />

      <main className="mx-auto w-full max-w-4xl flex-1 p-4 sm:p-8">
        <h1 className="mb-1 text-lg font-medium">پنل مدیریت</h1>
        <p className="mb-6 text-sm text-muted-foreground">مدیریت کاربران ثبت‌نام‌شده در پلنر</p>
        <AdminUserTable currentAdminId={admin.id} />
      </main>
    </div>
  );
}
