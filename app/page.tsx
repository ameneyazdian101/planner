import Link from "next/link";
import { CalendarCheck, NotebookPen, Target, Repeat, BookHeart, Sparkles } from "lucide-react";
import { getApiUserId } from "@/lib/dal";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const FEATURES = [
  {
    icon: CalendarCheck,
    title: "برنامه‌ریزی روزانه، هفتگی و ماهانه",
    description: "دقیقاً مثل دفترچه پلنر کاغذی، ولی همیشه همراهت — با تقویم شمسی.",
  },
  {
    icon: Target,
    title: "اهداف کوتاه‌مدت و بلندمدت",
    description: "هدف بذار، پیشرفتت رو دنبال کن و قدم‌به‌قدم بهش برس.",
  },
  {
    icon: Repeat,
    title: "ردیاب عادت",
    description: "عادت‌های روزانه‌ات رو بساز و هر روز که انجامش دادی، تیک بزن.",
  },
  {
    icon: BookHeart,
    title: "یادداشت روزانه",
    description: "هر روز چند خط بنویس، حالت رو ثبت کن، مرور کن.",
  },
  {
    icon: Sparkles,
    title: "دستیار هوشمند",
    description: "با یه دستیار هوش مصنوعی فارسی‌زبان صحبت کن تا برات کارها رو مدیریت کنه.",
  },
];

export default async function LandingPage() {
  const userId = await getApiUserId();

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-card/90 backdrop-blur-sm supports-backdrop-filter:bg-card/70">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between p-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <NotebookPen className="size-4" />
            </span>
            <span className="font-heading text-lg font-bold text-primary">پلنر</span>
          </Link>
          <nav className="flex items-center gap-2">
            <ThemeToggle />
            {userId ? (
              <Button nativeButton={false} render={<Link href="/dashboard">داشبورد</Link>} />
            ) : (
              <>
                <Button
                  variant="ghost"
                  nativeButton={false}
                  render={<Link href="/login">ورود</Link>}
                />
                <Button nativeButton={false} render={<Link href="/register">ثبت‌نام رایگان</Link>} />
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-24 overflow-hidden px-6 py-20 text-center">
        <div
          className="pointer-events-none absolute -top-24 inset-s-1/2 -z-10 h-112 w-md -translate-x-1/2 rounded-full bg-accent/60 blur-3xl"
          aria-hidden
        />

        <section className="flex flex-col items-center gap-6">
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            کاملاً رایگان — بدون نیاز به کارت بانکی
          </span>
          <h1 className="max-w-2xl font-heading text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            پلنر شخصی‌ات، همیشه در جیبت
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            کارها، اهداف، عادت‌ها و یادداشت‌های روزانه‌ات رو یک‌جا مدیریت کن —
            با ظاهری آشنا مثل دفترچه پلنر کاغذی و تقویم شمسی.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/register">شروع رایگان</Link>}
            />
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="/login">ورود به حساب</Link>}
            />
          </div>
        </section>

        <section className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card p-6 text-center shadow-[0_1px_2px_color-mix(in_oklch,var(--foreground)_6%,transparent),0_8px_20px_-12px_color-mix(in_oklch,var(--foreground)_18%,transparent)] transition-transform hover:-translate-y-0.5"
            >
              <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <feature.icon className="size-6" />
              </span>
              <h3 className="font-heading font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="mx-auto w-full max-w-5xl border-t border-border/70 p-6 text-center text-sm text-muted-foreground">
        ساخته‌شده برای برنامه‌ریزی بهتر.
      </footer>
    </div>
  );
}
