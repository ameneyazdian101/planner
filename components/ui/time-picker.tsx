"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toPersianDigits } from "@/lib/jalali";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

function TimePicker({
  value,
  onChange,
  "aria-label": ariaLabel,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  "aria-label"?: string;
  className?: string;
}) {
  const [hour, minute] = value ? value.split(":") : ["", ""];

  return (
    <div className={cn("flex items-center gap-1", className)} aria-label={ariaLabel}>
      <Select
        value={hour}
        onValueChange={(h) => onChange(`${h}:${minute || "00"}`)}
      >
        <SelectTrigger className="h-8 w-15 px-2">
          <SelectValue>{(v: string) => toPersianDigits(v)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {HOURS.map((h) => (
            <SelectItem key={h} value={h}>
              {toPersianDigits(h)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground">:</span>
      <Select
        value={minute}
        onValueChange={(m) => onChange(`${hour || "00"}:${m}`)}
      >
        <SelectTrigger className="h-8 w-15 px-2">
          <SelectValue>{(v: string) => toPersianDigits(v)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {MINUTES.map((m) => (
            <SelectItem key={m} value={m}>
              {toPersianDigits(m)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export { TimePicker };
