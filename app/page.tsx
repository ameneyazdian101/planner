import Link from "next/link";
import { CalendarCheck, Target, Repeat, BookHeart } from "lucide-react";
import { getApiUserId } from "@/lib/dal";
import { Button } from "@/components/ui/button";

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
];

export default async function LandingPage() {
  const userId = await getApiUserId();

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between p-6">
        <span className="text-lg font-semibold">پلنر</span>
        <nav className="flex items-center gap-3">
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
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-24 px-6 py-16 text-center">
        <section className="flex flex-col items-center gap-6">
          <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            پلنر شخصی‌ات، همیشه در جیبت
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            کارها، اهداف، عادت‌ها و یادداشت‌های روزانه‌ات رو یک‌جا مدیریت کن —
            با ظاهری آشنا مثل دفترچه پلنر کاغذی و تقویم شمسی.
          </p>
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/register">شروع رایگان</Link>}
          />
        </section>

        <section className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col items-center gap-3 rounded-xl border p-6 text-center"
            >
              <feature.icon className="size-8 text-primary" />
              <h3 className="font-medium">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="mx-auto w-full max-w-5xl p-6 text-center text-sm text-muted-foreground">
        ساخته‌شده برای برنامه‌ریزی بهتر.
      </footer>
    </div>
  );
}
