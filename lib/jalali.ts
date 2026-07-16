import { toJalaali, toGregorian, jalaaliMonthLength } from "jalaali-js";
import { addDaysToKey, dateKeyFromUtcDate, keyToUtcDate } from "@/lib/date";

export const PERSIAN_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

/** Saturday-first, matching the Jalaali week. */
export const PERSIAN_WEEKDAYS = ["شنبه", "یک‌شنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"];
export const PERSIAN_WEEKDAYS_SHORT = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

export type JalaliDate = { jy: number; jm: number; jd: number };

export function keyToJalali(key: string): JalaliDate {
  const [gy, gm, gd] = key.split("-").map(Number);
  return toJalaali(gy, gm, gd);
}

export function jalaliToKey(jy: number, jm: number, jd: number): string {
  const { gy, gm, gd } = toGregorian(jy, jm, jd);
  return dateKeyFromUtcDate(new Date(Date.UTC(gy, gm - 1, gd)));
}

export function weekdayIndex(key: string): number {
  // Saturday-first index (0 = Saturday ... 6 = Friday)
  const dow = keyToUtcDate(key).getUTCDay(); // 0 = Sunday
  return (dow + 1) % 7;
}

export function jalaliWeekStartKey(key: string): string {
  return addDaysToKey(key, -weekdayIndex(key));
}

export function formatJalaliLong(key: string): string {
  const { jy, jm, jd } = keyToJalali(key);
  return `${toPersianDigits(jd)} ${PERSIAN_MONTHS[jm - 1]} ${toPersianDigits(jy)}`;
}

export function formatJalaliWeekdayLong(key: string): string {
  return PERSIAN_WEEKDAYS[weekdayIndex(key)];
}

export function formatJalaliWeekdayShort(key: string): string {
  return PERSIAN_WEEKDAYS_SHORT[weekdayIndex(key)];
}

export function monthKeyFromJalali(jy: number, jm: number): string {
  return `${jy}-${String(jm).padStart(2, "0")}`;
}

export function parseMonthKey(monthKey: string): { jy: number; jm: number } {
  const [jy, jm] = monthKey.split("-").map(Number);
  return { jy, jm };
}

export function formatMonthLabel(monthKey: string): string {
  const { jy, jm } = parseMonthKey(monthKey);
  return `${PERSIAN_MONTHS[jm - 1]} ${toPersianDigits(jy)}`;
}

export function adjacentMonthKey(monthKey: string, delta: number): string {
  const { jy, jm } = parseMonthKey(monthKey);
  const total = (jy * 12 + (jm - 1)) + delta;
  const newJy = Math.floor(total / 12);
  const newJm = (total % 12) + 1;
  return monthKeyFromJalali(newJy, newJm);
}

export function monthDateRange(monthKey: string): { firstDayKey: string; lastDayKey: string } {
  const { jy, jm } = parseMonthKey(monthKey);
  const firstDayKey = jalaliToKey(jy, jm, 1);
  const lastDayKey = jalaliToKey(jy, jm, jalaaliMonthLength(jy, jm));
  return { firstDayKey, lastDayKey };
}

/** Full Saturday-start grid of date keys covering the given Jalali month, padded to whole weeks. */
export function monthGridKeys(monthKey: string): string[] {
  const { firstDayKey, lastDayKey } = monthDateRange(monthKey);
  let cursor = jalaliWeekStartKey(firstDayKey);
  const days: string[] = [];
  while (cursor <= lastDayKey || days.length % 7 !== 0) {
    days.push(cursor);
    cursor = addDaysToKey(cursor, 1);
  }
  return days;
}
