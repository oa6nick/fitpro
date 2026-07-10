import { db } from "../db/client.js";
import * as s from "../db/schema.js";
import { hashPassword } from "../auth/password.js";
import { weekStartOf } from "../services/weeks.js";

/**
 * Демо-данные: 1 тренер + 5 клиентов с анкетами, упражнениями, программой,
 * назначенными тренировками, дневником и замерами. Idempotent: чистит таблицы.
 */

function daysAgo(n: number): string {
  const d = new Date(Date.now() - n * 86400000);
  return d.toISOString().slice(0, 10);
}
function daysAgoTs(n: number): Date {
  return new Date(Date.now() - n * 86400000);
}

async function clearAll() {
  // Порядок: дети -> родители (на случай отсутствия каскада в pglite).
  for (const t of [
    s.reportAnswers,
    s.reportSubmissions,
    s.reportFields,
    s.reportForms,
    s.taskCompletions,
    s.taskAssignments,
    s.habitTasks,
    s.knowledgeAccess,
    s.knowledgeItems,
    s.workoutLogs,
    s.workoutExercises,
    s.workouts,
    s.templateExercises,
    s.workoutTemplates,
    s.measurements,
    s.trainerNotes,
    s.clientProfiles,
    s.achievements,
    s.payments,
    s.notifications,
    s.exercises,
    s.clientInvites,
    s.trainerSubscriptions,
    s.authEmailCodes,
    s.clients,
    s.users,
  ]) {
    await db.delete(t);
  }
}

async function main() {
  console.log("🌱 Очистка и заполнение демо-данными…");
  await clearAll();

  const pass = await hashPassword("password123");

  // --- Тренер ---
  const [trainer] = await db
    .insert(s.users)
    .values({ email: "trainer@fitpro.ru", passwordHash: pass, role: "trainer", name: "Алексей Тренеров" })
    .returning();
  const trainerId = trainer!.id;

  // --- Упражнения ---
  const exDefs = [
    {
      name: "Приседания со штангой",
      muscles: "Квадрицепсы, ягодицы",
      videoUrl: "https://example.com/squat",
      techniqueDescription: "Спина прямая, колени по направлению носков, таз назад.",
      keyHints: "Держи пятки прижатыми, грудь развёрнута.",
      commonMistakes: "Колени заваливаются внутрь, круглая спина.",
      easierVariant: "Присед в гакк-машине",
      harderVariant: "Фронтальный присед",
    },
    {
      name: "Жим лёжа",
      muscles: "Грудь, трицепс",
      videoUrl: "https://example.com/bench",
      techniqueDescription: "Лопатки сведены, штанга к низу груди.",
      keyHints: "Стабильный мост, локти 45°.",
      commonMistakes: "Отбив от груди, разведённые локти.",
      easierVariant: "Жим гантелей",
      harderVariant: "Жим с паузой",
    },
    {
      name: "Становая тяга",
      muscles: "Спина, ягодицы, бицепс бедра",
      techniqueDescription: "Штанга у голени, спина нейтральна, тяга от пола.",
      keyHints: "Толкай пол ногами, штанга вдоль тела.",
      commonMistakes: "Округление поясницы, рывок.",
    },
    {
      name: "Тяга верхнего блока",
      muscles: "Широчайшие, бицепс",
      techniqueDescription: "Тяга к верху груди, лопатки вниз.",
      keyHints: "Веди локти вниз-назад.",
    },
    {
      name: "Планка",
      muscles: "Кор",
      techniqueDescription: "Тело в линию, таз не провисает.",
      keyHints: "Напряги пресс и ягодицы.",
    },
  ];
  const ex = await db
    .insert(s.exercises)
    .values(exDefs.map((e) => ({ ...e, trainerId })))
    .returning();

  // --- Шаблон программы ---
  const [template] = await db
    .insert(s.workoutTemplates)
    .values({ trainerId, name: "Фуллбоди для новичка", goal: "новичок" })
    .returning();
  await db.insert(s.templateExercises).values([
    { templateId: template!.id, exerciseId: ex[0]!.id, order: 0, sets: 4, reps: "8-10", rest: "120 сек" },
    { templateId: template!.id, exerciseId: ex[1]!.id, order: 1, sets: 4, reps: "8-10", rest: "120 сек" },
    { templateId: template!.id, exerciseId: ex[3]!.id, order: 2, sets: 3, reps: "12", rest: "90 сек" },
    { templateId: template!.id, exerciseId: ex[4]!.id, order: 3, sets: 3, reps: "45 сек", rest: "60 сек" },
  ]);

  // --- Клиенты ---
  const clientDefs = [
    { name: "Мария Иванова", goal: "Похудение", level: "новичок", status: "active" as const, last: 1, end: 25 },
    { name: "Дмитрий Петров", goal: "Набор массы", level: "средний", status: "active" as const, last: 10, end: 40 },
    { name: "Ольга Смирнова", goal: "Рекомпозиция", level: "новичок", status: "profile_filled" as const, last: 2, end: 60 },
    { name: "Иван Кузнецов", goal: "Сила", level: "продвинутый", status: "active" as const, last: 3, end: 5 },
    { name: "Анна Соколова", goal: "Тонус", level: "новичок", status: "new" as const, last: null, end: null },
  ];

  const createdClients: { id: string; userId: string; name: string; status: string }[] = [];

  for (let i = 0; i < clientDefs.length; i++) {
    const c = clientDefs[i]!;
    // user-аккаунт клиента
    const [cUser] = await db
      .insert(s.users)
      .values({
        email: `client${i + 1}@fitpro.ru`,
        passwordHash: pass,
        role: "client",
        name: c.name,
      })
      .returning();

    const [client] = await db
      .insert(s.clients)
      .values({
        trainerId,
        userId: cUser!.id,
        name: c.name,
        goal: c.goal,
        level: c.level,
        workFormat: "онлайн",
        age: 25 + i * 3,
        height: 165 + i * 4,
        weight: 60 + i * 6,
        startDate: daysAgo(30),
        supportEndDate: c.end != null ? daysAgo(-c.end) : null,
        funnelStatus: c.status,
        lastActivityAt: c.last != null ? daysAgoTs(c.last) : null,
        streakWeeks: i,
      })
      .returning();
    const clientId = client!.id;
    createdClients.push({ id: clientId, userId: cUser!.id, name: c.name, status: c.status });

    // Анкета (кроме «новой заявки»)
    if (c.status !== "new") {
      await db.insert(s.clientProfiles).values({
        clientId,
        trainingExperience: `${i + 1} год(а) опыта`,
        injuries: i === 3 ? "Боль в пояснице" : "Нет",
        lifestyle: "Офис, сон 7ч, средний стресс",
        nutrition: "3 приёма пищи, белок ~1.5 г/кг",
        steps: 6000 + i * 1000,
        equipment: "Зал",
        preferences: "Базовые упражнения",
        dislikes: "Долгое кардио",
      });
      await db.insert(s.trainerNotes).values({
        clientId,
        text: `Стартовая заметка по клиенту ${c.name}. Цель: ${c.goal}.`,
      });
    }

    // Замеры (для активных)
    if (c.status === "active") {
      await db.insert(s.measurements).values([
        { clientId, date: daysAgo(28), weight: 60 + i * 6, waist: 80 - i, hips: 95, chest: 90 },
        { clientId, date: daysAgo(14), weight: 59 + i * 6, waist: 79 - i, hips: 94, chest: 90 },
        { clientId, date: daysAgo(1), weight: 58 + i * 6, waist: 77 - i, hips: 93, chest: 91 },
      ]);

      // Назначенная тренировка из шаблона
      const [w] = await db
        .insert(s.workouts)
        .values({
          clientId,
          templateId: template!.id,
          title: "Фуллбоди A",
          date: daysAgo(2),
          status: "completed",
          tonnage: 4820,
          clientFeeling: "moderate",
          clientComment: "Хорошо зашло, последний подход тяжело",
        })
        .returning();
      const we = await db
        .insert(s.workoutExercises)
        .values([
          { workoutId: w!.id, exerciseId: ex[0]!.id, order: 0, sets: 4, reps: "8-10", rest: "120 сек" },
          { workoutId: w!.id, exerciseId: ex[1]!.id, order: 1, sets: 4, reps: "8-10", rest: "120 сек" },
        ])
        .returning();
      // Дневник по первому упражнению
      await db.insert(s.workoutLogs).values([
        { workoutExerciseId: we[0]!.id, clientId, setNumber: 1, weight: 40, reps: 10, feeling: "moderate" },
        { workoutExerciseId: we[0]!.id, clientId, setNumber: 2, weight: 42.5, reps: 9, feeling: "hard" },
        { workoutExerciseId: we[0]!.id, clientId, setNumber: 3, weight: 45, reps: 8, feeling: "very_hard" },
      ]);

      // Новая (назначенная, ещё не выполнена) — с упражнениями, чтобы дневник был рабочим
      const [next] = await db
        .insert(s.workouts)
        .values({
          clientId,
          templateId: template!.id,
          title: "Фуллбоди B",
          date: daysAgo(-1),
          status: "assigned",
        })
        .returning();
      await db.insert(s.workoutExercises).values([
        { workoutId: next!.id, exerciseId: ex[0]!.id, order: 0, sets: 4, reps: "8-10", rest: "120 сек" },
        { workoutId: next!.id, exerciseId: ex[1]!.id, order: 1, sets: 3, reps: "10-12", rest: "90 сек" },
        { workoutId: next!.id, exerciseId: ex[2]!.id, order: 2, sets: 3, reps: "12", rest: "60 сек" },
      ]);

      // Оплата
      await db.insert(s.payments).values({
        clientId,
        amount: 5000,
        date: daysAgo(30),
        status: "paid",
        nextRenewalDate: daysAgo(0),
      });
      // Достижение
      await db.insert(s.achievements).values({ clientId, type: "10 тренировок" });
    }
  }

  // --- Форма отчёта + заполнения ---
  const [form] = await db
    .insert(s.reportForms)
    .values({ trainerId, name: "Еженедельный отчёт" })
    .returning();
  const fields = await db
    .insert(s.reportFields)
    .values([
      { formId: form!.id, label: "Вес", type: "number", order: 0 },
      { formId: form!.id, label: "Шаги (среднее)", type: "number", order: 1 },
      { formId: form!.id, label: "Сон", type: "text", order: 2 },
      { formId: form!.id, label: "Что было сложно", type: "text", order: 3 },
    ])
    .returning();

  // --- Привычки + назначения ---
  const habits = await db
    .insert(s.habitTasks)
    .values([
      { trainerId, title: "10 000 шагов" },
      { trainerId, title: "Вода 2 л" },
      { trainerId, title: "Сон до 23:00" },
      { trainerId, title: "Белок по норме" },
    ])
    .returning();

  // --- База знаний (часть заблокирована по неделям) ---
  await db.insert(s.knowledgeItems).values([
    { trainerId, category: "nutrition", title: "Гайд по питанию", type: "pdf", unlockWeek: 1 },
    { trainerId, category: "training", title: "Техника базовых упражнений", type: "video", unlockWeek: 1 },
    { trainerId, category: "measurements", title: "Как делать замеры", type: "checklist", unlockWeek: 2 },
    { trainerId, category: "recovery", title: "Восстановление и сон", type: "pdf", unlockWeek: 4 },
  ]);

  // Активным клиентам — отчёт + недельные задачи с отметками.
  const weekStart = weekStartOf();
  for (const cc of createdClients.filter((c) => c.status === "active")) {
    const [submission] = await db
      .insert(s.reportSubmissions)
      .values({ formId: form!.id, clientId: cc.id, weekStart, status: "awaiting_review" })
      .returning();
    await db.insert(s.reportAnswers).values([
      { submissionId: submission!.id, fieldId: fields[0]!.id, value: "58.5" },
      { submissionId: submission!.id, fieldId: fields[1]!.id, value: "8200" },
      { submissionId: submission!.id, fieldId: fields[2]!.id, value: "7 часов, норм" },
      { submissionId: submission!.id, fieldId: fields[3]!.id, value: "Жим — тяжело" },
    ]);

    // 2 привычки на неделю + отметки за 4 дня.
    for (const habit of habits.slice(0, 2)) {
      const [assignment] = await db
        .insert(s.taskAssignments)
        .values({ clientId: cc.id, habitTaskId: habit!.id, weekStart })
        .returning();
      for (let d = 0; d < 4; d++) {
        const day = new Date(new Date(weekStart).getTime() + d * 86400000)
          .toISOString()
          .slice(0, 10);
        await db
          .insert(s.taskCompletions)
          .values({ assignmentId: assignment!.id, date: day, done: true });
      }
    }

    // Уведомление тренеру о новом отчёте.
    await db.insert(s.notifications).values({
      userId: trainerId,
      text: `Новый отчёт от ${cc.name}`,
      link: "/t/reports",
    });
  }

  console.log("✅ Демо-данные готовы.");
  console.log("   Тренер:  trainer@fitpro.ru / password123");
  console.log("   Клиент:  client1@fitpro.ru / password123 (Мария, активна)");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Ошибка seed:", err);
  process.exit(1);
});
