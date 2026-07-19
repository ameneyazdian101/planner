import Link from "next/link";
import { NotebookPen } from "lucide-react";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div
        className="pointer-events-none absolute -top-32 inset-s-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-accent/70 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 end-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div className="relative flex w-full max-w-sm flex-col items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <NotebookPen className="size-4.5" />
          </span>
          <span className="font-heading text-xl font-bold text-primary">پلنر</span>
        </Link>
        {children}
      </div>
    </div>
  );
}
