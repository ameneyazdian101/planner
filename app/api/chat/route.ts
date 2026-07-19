import { NextResponse, type NextRequest } from "next/server";
import * as z from "zod";
import { GoogleGenAI, type Content, type FunctionDeclaration } from "@google/genai";
import { getApiUserId } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { badRequest, readJson } from "@/lib/api";
import { dayRangeForKey, dateKeyFromUtcDate, isValidDateKey, rangeForKeys, todayKey } from "@/lib/date";
import { formatJalaliLong, formatJalaliWeekdayLong } from "@/lib/jalali";

const ChatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "model"]),
        text: z.string().min(1),
      })
    )
    .min(1)
    .max(40),
});

const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;

const listTasksDeclaration: FunctionDeclaration = {
  name: "list_tasks",
  description:
    "لیست تسک‌های کاربر در یک بازه تاریخ رو برمی‌گردونه. قبل از پیشنهاد دادن یا ساختن تسک جدید، از این استفاده کن تا از برنامه فعلی کاربر مطلع بشی.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      from: { type: "string", description: "تاریخ شروع بازه، فرمت YYYY-MM-DD میلادی" },
      to: { type: "string", description: "تاریخ پایان بازه، فرمت YYYY-MM-DD میلادی (برای یک روز، برابر from)" },
    },
    required: ["from", "to"],
  },
};

const createTaskDeclaration: FunctionDeclaration = {
  name: "create_task",
  description: "یک تسک جدید برای کاربر تو تقویمش می‌سازه.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      title: { type: "string", description: "عنوان تسک" },
      date: { type: "string", description: "تاریخ تسک، فرمت YYYY-MM-DD میلادی" },
      priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"], description: "اولویت، پیش‌فرض MEDIUM" },
      startTime: { type: "string", description: "ساعت شروع اختیاری، فرمت HH:mm ۲۴ ساعته" },
      endTime: { type: "string", description: "ساعت پایان اختیاری، فرمت HH:mm ۲۴ ساعته" },
    },
    required: ["title", "date"],
  },
};

const updateTaskDeclaration: FunctionDeclaration = {
  name: "update_task",
  description:
    "یک تسک موجود رو پیدا می‌کنه (بر اساس بخشی از عنوانش) و تغییرش می‌ده — مثلاً انجام‌شده علامت بزن، اولویتش رو عوض کن، یا به تاریخ دیگه‌ای منتقلش کن.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      titleSearch: { type: "string", description: "بخشی از عنوان تسکی که باید پیدا بشه" },
      nearDate: {
        type: "string",
        description: "تاریخ تقریبی تسک برای کمک به پیدا کردنش، فرمت YYYY-MM-DD میلادی (اختیاری)",
      },
      completed: { type: "boolean", description: "علامت زدن به عنوان انجام‌شده/نشده" },
      newDate: { type: "string", description: "تاریخ جدید برای جابه‌جایی تسک، فرمت YYYY-MM-DD میلادی" },
      priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"], description: "اولویت جدید" },
    },
    required: ["titleSearch"],
  },
};

const deleteTaskDeclaration: FunctionDeclaration = {
  name: "delete_task",
  description: "یک تسک موجود رو کاملاً حذف می‌کنه (نه انجام‌شده علامت زدن — واقعاً از لیست پاکش می‌کنه).",
  parametersJsonSchema: {
    type: "object",
    properties: {
      titleSearch: { type: "string", description: "بخشی از عنوان تسکی که باید حذف بشه" },
      nearDate: {
        type: "string",
        description: "تاریخ تقریبی تسک برای کمک به پیدا کردنش، فرمت YYYY-MM-DD میلادی (اختیاری)",
      },
    },
    required: ["titleSearch"],
  },
};

const listHabitsDeclaration: FunctionDeclaration = {
  name: "list_habits",
  description: "لیست عادت‌های کاربر رو برمی‌گردونه.",
  parametersJsonSchema: { type: "object", properties: {} },
};

const createHabitDeclaration: FunctionDeclaration = {
  name: "create_habit",
  description: "یک عادت جدید (که قراره هر روز دنبال بشه) برای کاربر می‌سازه.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "اسم عادت" },
    },
    required: ["name"],
  },
};

const logHabitDeclaration: FunctionDeclaration = {
  name: "log_habit",
  description: "یک عادت رو برای یه روز مشخص، انجام‌شده یا انجام‌نشده علامت می‌زنه.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      nameSearch: { type: "string", description: "بخشی از اسم عادت" },
      date: { type: "string", description: "تاریخ، فرمت YYYY-MM-DD میلادی" },
      completed: { type: "boolean", description: "انجام شده (true) یا نشده (false)" },
    },
    required: ["nameSearch", "date", "completed"],
  },
};

const updateHabitDeclaration: FunctionDeclaration = {
  name: "update_habit",
  description: "اسم یا رنگ یک عادت موجود رو تغییر می‌ده.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      nameSearch: { type: "string", description: "بخشی از اسم فعلی عادت" },
      newName: { type: "string", description: "اسم جدید (اختیاری)" },
      newColor: { type: "string", description: "کد رنگ هگز جدید مثل #2563eb (اختیاری)" },
    },
    required: ["nameSearch"],
  },
};

const deleteHabitDeclaration: FunctionDeclaration = {
  name: "delete_habit",
  description: "یک عادت رو کاملاً حذف می‌کنه (همراه با تاریخچه انجامش).",
  parametersJsonSchema: {
    type: "object",
    properties: {
      nameSearch: { type: "string", description: "بخشی از اسم عادتی که باید حذف بشه" },
    },
    required: ["nameSearch"],
  },
};

const listGoalsDeclaration: FunctionDeclaration = {
  name: "list_goals",
  description: "لیست اهداف کوتاه‌مدت و بلندمدت کاربر رو برمی‌گردونه.",
  parametersJsonSchema: { type: "object", properties: {} },
};

const createGoalDeclaration: FunctionDeclaration = {
  name: "create_goal",
  description: "یک هدف جدید برای کاربر می‌سازه.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      title: { type: "string", description: "عنوان هدف" },
      type: { type: "string", enum: ["SHORT_TERM", "LONG_TERM"], description: "نوع هدف، پیش‌فرض کوتاه‌مدت" },
      targetDate: { type: "string", description: "تاریخ هدف‌گذاری‌شده، فرمت YYYY-MM-DD میلادی (اختیاری)" },
    },
    required: ["title"],
  },
};

const updateGoalProgressDeclaration: FunctionDeclaration = {
  name: "update_goal_progress",
  description: "درصد پیشرفت یک هدف موجود رو تغییر می‌ده.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      titleSearch: { type: "string", description: "بخشی از عنوان هدف" },
      progress: { type: "number", description: "درصد پیشرفت جدید، عددی بین ۰ تا ۱۰۰" },
    },
    required: ["titleSearch", "progress"],
  },
};

const deleteGoalDeclaration: FunctionDeclaration = {
  name: "delete_goal",
  description: "یک هدف رو کاملاً حذف می‌کنه.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      titleSearch: { type: "string", description: "بخشی از عنوان هدفی که باید حذف بشه" },
    },
    required: ["titleSearch"],
  },
};

const writeJournalEntryDeclaration: FunctionDeclaration = {
  name: "write_journal_entry",
  description: "یادداشت روزانه کاربر رو برای یه تاریخ مشخص می‌نویسه یا بازنویسی می‌کنه.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      date: { type: "string", description: "تاریخ یادداشت، فرمت YYYY-MM-DD میلادی" },
      content: { type: "string", description: "متن یادداشت" },
    },
    required: ["date", "content"],
  },
};

function isRetryableGeminiError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /"code":\s*(503|429)/.test(message);
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function executeTool(userId: string, name: string, args: Record<string, unknown>) {
  if (name === "list_tasks") {
    const from = String(args.from ?? "");
    const to = String(args.to ?? "");
    if (!isValidDateKey(from) || !isValidDateKey(to)) return { error: "تاریخ نامعتبر است." };

    const tasks = await prisma.task.findMany({
      where: { userId, date: rangeForKeys(from, to) },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    });
    return {
      tasks: tasks.map((t) => {
        const dateKey = dateKeyFromUtcDate(t.date);
        return {
          title: t.title,
          date: dateKey,
          dateJalali: `${formatJalaliWeekdayLong(dateKey)}، ${formatJalaliLong(dateKey)}`,
          completed: t.completed,
          priority: t.priority,
          startTime: t.startTime,
          endTime: t.endTime,
        };
      }),
    };
  }

  if (name === "create_task") {
    const title = String(args.title ?? "").trim();
    const date = String(args.date ?? "");
    if (!title) return { error: "عنوان تسک نامعتبر است." };
    if (!isValidDateKey(date)) return { error: "تاریخ نامعتبر است." };

    const priorityArg = String(args.priority ?? "MEDIUM");
    const priority = (["LOW", "MEDIUM", "HIGH"] as const).includes(priorityArg as "LOW")
      ? (priorityArg as "LOW" | "MEDIUM" | "HIGH")
      : "MEDIUM";
    const startTime = typeof args.startTime === "string" && timeRe.test(args.startTime) ? args.startTime : undefined;
    const endTime = typeof args.endTime === "string" && timeRe.test(args.endTime) ? args.endTime : undefined;

    // Idempotency guard: models occasionally call this tool twice for one user
    // request (same round or a retried round). If an identical task was just
    // created for this exact title+date, return it instead of duplicating.
    const existing = await prisma.task.findFirst({
      where: { userId, title, date: dayRangeForKey(date) },
    });
    if (existing) {
      return { success: true, alreadyExisted: true, task: { id: existing.id, title: existing.title, date } };
    }

    const task = await prisma.task.create({
      data: { userId, title, date: dayRangeForKey(date).gte, priority, startTime, endTime },
    });
    return { success: true, task: { id: task.id, title: task.title, date } };
  }

  if (name === "delete_task") {
    const titleSearch = String(args.titleSearch ?? "").trim();
    if (!titleSearch) return { error: "عنوان جستجو نامعتبر است." };

    const nearDate = typeof args.nearDate === "string" && isValidDateKey(args.nearDate) ? args.nearDate : undefined;
    const task = await prisma.task.findFirst({
      where: {
        userId,
        title: { contains: titleSearch },
        ...(nearDate ? { date: dayRangeForKey(nearDate) } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    if (!task) return { error: "تسکی با این عنوان پیدا نشد." };

    await prisma.task.delete({ where: { id: task.id } });
    return { success: true, deletedTitle: task.title };
  }

  if (name === "update_task") {
    const titleSearch = String(args.titleSearch ?? "").trim();
    if (!titleSearch) return { error: "عنوان جستجو نامعتبر است." };

    const nearDate = typeof args.nearDate === "string" && isValidDateKey(args.nearDate) ? args.nearDate : undefined;
    const task = await prisma.task.findFirst({
      where: {
        userId,
        title: { contains: titleSearch },
        ...(nearDate ? { date: dayRangeForKey(nearDate) } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    if (!task) return { error: "تسکی با این عنوان پیدا نشد." };

    const priorityArg = typeof args.priority === "string" ? args.priority : undefined;
    const priority =
      priorityArg && (["LOW", "MEDIUM", "HIGH"] as const).includes(priorityArg as "LOW")
        ? (priorityArg as "LOW" | "MEDIUM" | "HIGH")
        : undefined;
    const newDate = typeof args.newDate === "string" && isValidDateKey(args.newDate) ? args.newDate : undefined;
    const completed = typeof args.completed === "boolean" ? args.completed : undefined;

    const updated = await prisma.task.update({
      where: { id: task.id },
      data: {
        completed,
        priority,
        date: newDate ? dayRangeForKey(newDate).gte : undefined,
      },
    });
    return { success: true, task: { title: updated.title, date: dateKeyFromUtcDate(updated.date) } };
  }

  if (name === "list_habits") {
    const habits = await prisma.habit.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
    return { habits: habits.map((h) => ({ name: h.name })) };
  }

  if (name === "create_habit") {
    const habitName = String(args.name ?? "").trim();
    if (!habitName) return { error: "اسم عادت نامعتبر است." };
    const habit = await prisma.habit.create({ data: { userId, name: habitName } });
    return { success: true, habit: { name: habit.name } };
  }

  if (name === "log_habit") {
    const nameSearch = String(args.nameSearch ?? "").trim();
    const date = String(args.date ?? "");
    if (!nameSearch) return { error: "اسم عادت نامعتبر است." };
    if (!isValidDateKey(date)) return { error: "تاریخ نامعتبر است." };
    const completed = typeof args.completed === "boolean" ? args.completed : true;

    const habit = await prisma.habit.findFirst({ where: { userId, name: { contains: nameSearch } } });
    if (!habit) return { error: "عادتی با این اسم پیدا نشد." };

    const logDate = dayRangeForKey(date).gte;
    await prisma.habitLog.upsert({
      where: { habitId_date: { habitId: habit.id, date: logDate } },
      create: { habitId: habit.id, date: logDate, completed },
      update: { completed },
    });
    return { success: true, habit: habit.name, date, completed };
  }

  if (name === "update_habit") {
    const nameSearch = String(args.nameSearch ?? "").trim();
    if (!nameSearch) return { error: "اسم جستجو نامعتبر است." };

    const habit = await prisma.habit.findFirst({ where: { userId, name: { contains: nameSearch } } });
    if (!habit) return { error: "عادتی با این اسم پیدا نشد." };

    const newName = typeof args.newName === "string" ? args.newName.trim() : undefined;
    const newColor =
      typeof args.newColor === "string" && /^#[0-9a-fA-F]{6}$/.test(args.newColor) ? args.newColor : undefined;

    const updated = await prisma.habit.update({
      where: { id: habit.id },
      data: { name: newName || undefined, color: newColor },
    });
    return { success: true, habit: { name: updated.name, color: updated.color } };
  }

  if (name === "delete_habit") {
    const nameSearch = String(args.nameSearch ?? "").trim();
    if (!nameSearch) return { error: "اسم جستجو نامعتبر است." };

    const habit = await prisma.habit.findFirst({ where: { userId, name: { contains: nameSearch } } });
    if (!habit) return { error: "عادتی با این اسم پیدا نشد." };

    await prisma.habit.delete({ where: { id: habit.id } });
    return { success: true, deletedName: habit.name };
  }

  if (name === "list_goals") {
    const goals = await prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
    return { goals: goals.map((g) => ({ title: g.title, type: g.type, progress: g.progress })) };
  }

  if (name === "create_goal") {
    const title = String(args.title ?? "").trim();
    if (!title) return { error: "عنوان هدف نامعتبر است." };
    const typeArg = String(args.type ?? "SHORT_TERM");
    const type = (["SHORT_TERM", "LONG_TERM"] as const).includes(typeArg as "SHORT_TERM")
      ? (typeArg as "SHORT_TERM" | "LONG_TERM")
      : "SHORT_TERM";
    const targetDate = typeof args.targetDate === "string" && isValidDateKey(args.targetDate) ? args.targetDate : undefined;

    const goal = await prisma.goal.create({
      data: { userId, title, type, targetDate: targetDate ? dayRangeForKey(targetDate).gte : undefined },
    });
    return { success: true, goal: { title: goal.title, type: goal.type } };
  }

  if (name === "delete_goal") {
    const titleSearch = String(args.titleSearch ?? "").trim();
    if (!titleSearch) return { error: "عنوان جستجو نامعتبر است." };

    const goal = await prisma.goal.findFirst({ where: { userId, title: { contains: titleSearch } } });
    if (!goal) return { error: "هدفی با این عنوان پیدا نشد." };

    await prisma.goal.delete({ where: { id: goal.id } });
    return { success: true, deletedTitle: goal.title };
  }

  if (name === "update_goal_progress") {
    const titleSearch = String(args.titleSearch ?? "").trim();
    if (!titleSearch) return { error: "عنوان جستجو نامعتبر است." };
    const progressRaw = Number(args.progress);
    if (Number.isNaN(progressRaw)) return { error: "درصد پیشرفت نامعتبر است." };
    const progress = Math.max(0, Math.min(100, Math.round(progressRaw)));

    const goal = await prisma.goal.findFirst({ where: { userId, title: { contains: titleSearch } } });
    if (!goal) return { error: "هدفی با این عنوان پیدا نشد." };

    const updated = await prisma.goal.update({ where: { id: goal.id }, data: { progress } });
    return { success: true, goal: { title: updated.title, progress: updated.progress } };
  }

  if (name === "write_journal_entry") {
    const date = String(args.date ?? "");
    const content = String(args.content ?? "").trim();
    if (!isValidDateKey(date)) return { error: "تاریخ نامعتبر است." };
    if (!content) return { error: "متن یادداشت نامعتبر است." };

    const entryDate = dayRangeForKey(date).gte;
    await prisma.journalEntry.upsert({
      where: { userId_date: { userId, date: entryDate } },
      create: { userId, date: entryDate, content },
      update: { content },
    });
    return { success: true, date };
  }

  return { error: "ابزار ناشناخته است." };
}

export async function POST(request: NextRequest) {
  const userId = await getApiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "دستیار هوش مصنوعی هنوز تنظیم نشده. کلید GEMINI_API_KEY رو تو تنظیمات اضافه کن." },
      { status: 503 }
    );
  }

  const body = await readJson(request);
  if (body === null) return badRequest("بدنه درخواست معتبر نیست.");

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) return badRequest("پیام‌ها نامعتبر است.");

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const today = todayKey();
  const now = new Date();
  const nowTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const contents: Content[] = parsed.data.messages.map((m) => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));

  const [profileUser, profileGoals, profileHabits, profileTodayTasks] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { title: true, type: true, progress: true },
    }),
    prisma.habit.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, select: { name: true } }),
    prisma.task.findMany({
      where: { userId, date: dayRangeForKey(today) },
      orderBy: { startTime: "asc" },
      select: { title: true, startTime: true, endTime: true, completed: true },
    }),
  ]);

  const profileBlock = [
    profileUser?.name ? `اسم کاربر: ${profileUser.name}.` : "",
    profileGoals.length > 0
      ? `اهداف کاربر: ${profileGoals.map((g) => `«${g.title}» (${g.type === "LONG_TERM" ? "بلندمدت" : "کوتاه‌مدت"}, ${g.progress}٪ پیشرفت)`).join("، ")}.`
      : "کاربر هنوز هیچ هدفی ثبت نکرده.",
    profileHabits.length > 0
      ? `عادت‌های کاربر: ${profileHabits.map((h) => h.name).join("، ")}.`
      : "کاربر هنوز هیچ عادتی ثبت نکرده.",
    profileTodayTasks.length > 0
      ? `تسک‌های امروز کاربر: ${profileTodayTasks
          .map((t) => `«${t.title}»${t.startTime ? ` (${t.startTime}${t.endTime ? `–${t.endTime}` : ""})` : ""}${t.completed ? " [انجام‌شده]" : ""}`)
          .join("، ")}.`
      : "کاربر امروز هنوز هیچ تسکی نداره.",
  ]
    .filter(Boolean)
    .join(" ");

  const systemInstruction = [
    "تو دستیار هوشمند یه اپ برنامه‌ریز فارسی‌زبان هستی. فقط فارسی جواب بده، مختصر و دوستانه.",
    `امروز ${formatJalaliWeekdayLong(today)}، ${formatJalaliLong(today)} شمسیه (میلادی: ${today})، و ساعت الان دقیقاً ${nowTime} است.`,
    `این خلاصه‌ای از شناختت نسبت به این کاربر خاصه، همیشه در نظرش داشته باش و جواب‌هات رو بر همین اساس شخصی‌سازی کن: ${profileBlock}`,
    "این شناخت از کاربر رو فعالانه به کار ببر: مثلاً وقتی داره برنامه‌ریزی می‌کنه، اگه به یکی از اهداف یا عادت‌هاش مرتبطه اشاره کن؛ یا اگه ازش در مورد پیشرفت یکی از اهدافش بی‌خبر بودی، طبیعی وسط گفتگو ازش بپرس. زیاده‌روی نکن، فقط طوری رفتار کن که انگار واقعاً کاربر رو می‌شناسی.",
    "چون اهداف، عادت‌ها و تسک‌های امروز کاربر همین بالا در اختیارته، برای این‌ها دیگه نیازی به صدا زدن list_goals/list_habits نداری و برای تسک‌های امروز هم نیازی به list_tasks نداری — فقط وقتی به تسک‌های یه روز دیگه (نه امروز) نیاز داری از list_tasks استفاده کن. این باعث می‌شه سریع‌تر و با تعداد درخواست کمتر جواب بدی.",
    "اگه واقعاً به چند ابزار برای جمع‌آوری اطلاعات نیاز داری (مثلاً list_tasks یه روز دیگه)، تا حد امکان اون‌ها رو با هم و تو یه نوبت صدا بزن، نه پشت‌سرهم در نوبت‌های جدا — این تعداد رفت‌وبرگشت با سرویس هوش مصنوعی رو کم می‌کنه.",
    `تاریخ‌های نسبی مثل «فردا» یا «پس‌فردا» رو بر اساس تاریخ میلادی امروز (${today}) محاسبه کن و همون فرمت YYYY-MM-DD میلادی رو به ابزارها بده — چون تقویم برنامه‌ریز داخلاً میلادیه.`,
    `عبارت‌های نسبی زمانی مثل «۵ دقیقه دیگه»، «ده دقیقه دیگه»، «یک ربع دیگه» (= ۱۵ دقیقه)، «نیم ساعت دیگه» (= ۳۰ دقیقه)، «یک ساعت دیگه» رو دقیقاً با جمع‌زدن روی ساعت الان (${nowTime}) محاسبه کن و فرمت HH:mm بده — هیچ‌وقت این محاسبه رو تقریبی یا حدسی انجام نده.`,
    "هرگز خودت تاریخ شمسی رو با محاسبه دستی به کاربر نگو، چون احتمال اشتباه داری. تو جواب‌هات برای اشاره به تاریخ فقط از عبارت‌های نسبی مثل «فردا»، «پس‌فردا» یا اسم روز هفته (که تو ابزار list_tasks برات مشخصه) استفاده کن، نه یه عدد شمسی ساخته‌شده توسط خودت.",
    "علاوه بر تسک‌های روزانه (که با create_task/update_task/delete_task/list_tasks مدیریت می‌شن)، به این بخش‌های اپ هم دسترسی کامل داری: عادت‌ها (list_habits, create_habit, update_habit, delete_habit, log_habit)، اهداف (list_goals, create_goal, update_goal_progress, delete_goal)، و یادداشت روزانه (write_journal_entry).",
    "اگه کاربر سؤالی عمومی پرسید که به اطلاعات روز یا اینترنت نیاز داره (اخبار، قیمت، اطلاعات عمومی)، از قابلیت جستجوی وب استفاده کن تا جواب به‌روز و درست بدی، نه از حافظه‌ات.",
    "تو فقط محدود به کارهای برنامه‌ریز نیستی — هر سؤال عمومی دیگه‌ای هم (غیر از پلنر) پرسیده بشه، عادی و کامل جوابش رو بده، مثل یه دستیار هوشمند همه‌کاره.",
    "هیچ‌وقت رمز عبور، ایمیل حساب، یا هر تنظیمات امنیتی حساب کاربری رو تغییر نده یا پیشنهاد نده — این کارها فقط باید مستقیم توسط خود کاربر از تنظیمات انجام بشه.",
    "نمای هفتگی و ماهانه برنامه‌ریز، فقط یه شکل دیگه از همون تسک‌هاست — برای ساختن تسک تو هر روزی از هفته یا ماه، فقط کافیه create_task رو با همون تاریخ صدا بزنی، ابزار جدایی لازم نیست.",
    "مهم: «حذف کن» یا «پاکش کن» با «انجام‌شده/تیک‌زده کن» کاملاً فرق دارن. اگه کاربر گفت یه تسک رو حذف کن یا پاک کن، از delete_task استفاده کن (که واقعاً پاکش می‌کنه). فقط وقتی گفت انجامش دادم یا تمومش کردم، از update_task با completed:true استفاده کن. این دوتا رو هیچ‌وقت با هم قاطی نکن.",
    "هر ابزار (مخصوصاً create_task) رو برای یه درخواست کاربر فقط یه‌بار صدا بزن. اگه قبلاً تو همین گفتگو یه تسک/عادت/هدف با همین مشخصات ساختی، دوباره نسازش.",
    "وقتی کاربر ازت می‌خواد یه کار مشخص و ساده رو تو هر کدوم از این بخش‌ها انجام بدی (یه تسک/عادت/هدف بسازی، تغییر بدی، علامت بزنی، حذف کنی)، از ابزار مناسبش استفاده کن — پیشنهاد صرفاً متنی ندی، واقعاً انجامش بده. قبل از ساختن، اگه لازمه از list_tasks/list_habits/list_goals برای دیدن وضعیت فعلی استفاده کن. در جواب نهایی همیشه تأیید کن دقیقاً چیکار کردی.",
    "اما وقتی کاربر ازت خواست کل یه بازه زمانی رو براش برنامه‌ریزی کنی (مثلاً «۶ ساعت وقت خالی دارم برام برنامه بریز» یا «فردا رو برام پر کن»)، هیچ‌وقت مستقیم تسک نساز. اول با list_tasks (تسک‌های همون روز)، list_goals و list_habits وضعیت و اهداف/عادت‌های کاربر رو بررسی کن، بعد یه برنامه‌ی پیشنهادی مشخص (با ساعت شروع/پایان هر کار) بر اساس اهداف و عادت‌های واقعی کاربر — نه چیز الکی — به‌صورت متن تو همون پیام بنویس و ازش بپرس که تأیید می‌کنه یا نه. فقط وقتی تو پیام بعدی صراحتاً تأیید کرد (مثل «باشه»، «تأیید»، «انجامش بده»، «بله»)، همون آیتم‌های پیشنهادی رو یکی‌یکی با create_task بساز. اگه خواست تغییرش بده، برنامه رو اصلاح کن و دوباره از او تأیید بگیر.",
    "اگه ابزاری برای پیدا کردن یه تسک/عادت/هدف با اسمش نتیجه‌ای برنگردوند (پیدا نشد)، اینو صادقانه به کاربر بگو و ازش بخواه اسم دقیق‌تری بگه، خودت چیزی نساز که درخواست نشده.",
  ].join(" ");

  let finalText = "";
  const MAX_TOOL_ROUNDS = 5;
  const MAX_RETRIES = 3;

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      let response;
      for (let attempt = 0; ; attempt++) {
        try {
          response = await ai.models.generateContent({
            model: "gemini-flash-lite-latest",
            contents,
            config: {
              systemInstruction,
              tools: [
                {
                  functionDeclarations: [
                    listTasksDeclaration,
                    createTaskDeclaration,
                    updateTaskDeclaration,
                    deleteTaskDeclaration,
                    listHabitsDeclaration,
                    createHabitDeclaration,
                    updateHabitDeclaration,
                    deleteHabitDeclaration,
                    logHabitDeclaration,
                    listGoalsDeclaration,
                    createGoalDeclaration,
                    updateGoalProgressDeclaration,
                    deleteGoalDeclaration,
                    writeJournalEntryDeclaration,
                  ],
                },
                { googleSearch: {} },
              ],
            },
          });
          break;
        } catch (err) {
          if (attempt >= MAX_RETRIES - 1 || !isRetryableGeminiError(err)) throw err;
          await sleep(500 * 2 ** attempt);
        }
      }

      const modelParts = response.candidates?.[0]?.content?.parts ?? [];
      const callParts = modelParts.filter((p) => p.functionCall);
      if (callParts.length === 0) {
        finalText = response.text ?? "";
        break;
      }

      // Push the exact parts Gemini returned (not a reconstructed copy) — Gemini 3.x
      // attaches a `thoughtSignature` alongside each functionCall part that must be
      // replayed back verbatim, or the next call fails with a 400.
      contents.push({ role: "model", parts: modelParts });

      const responseParts = [];
      for (const part of callParts) {
        const call = part.functionCall!;
        const result = await executeTool(userId, call.name ?? "", call.args ?? {});
        responseParts.push({ functionResponse: { name: call.name, response: result } });
      }
      contents.push({ role: "user", parts: responseParts });
    }
  } catch (err) {
    console.error("[chat] Gemini error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "سرویس هوش مصنوعی الان شلوغه یا در دسترس نیست. چند لحظه دیگه دوباره امتحان کن." },
      { status: 503 }
    );
  }

  return NextResponse.json({ text: finalText || "متأسفم، نتونستم جواب مناسبی پیدا کنم." });
}
