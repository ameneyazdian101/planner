import Link from "next/link";
import { NotebookPen } from "lucide-react";

const SIZES = {
  sm: { badge: "size-8", icon: "size-4", text: "text-lg" },
  lg: { badge: "size-9", icon: "size-4.5", text: "text-xl" },
} as const;

export function Logo({ size = "sm", href = "/" }: { size?: keyof typeof SIZES; href?: string }) {
  const s = SIZES[size];
  return (
    <Link href={href} className="flex items-center gap-2">
      <span
        className={`flex ${s.badge} items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-sm`}
      >
        <NotebookPen className={s.icon} />
      </span>
      <span className={`font-heading ${s.text} font-bold text-primary`}>پلنر</span>
    </Link>
  );
}
