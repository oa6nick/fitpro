/**
 * Безопасный upsert демо-аккаунтов для прода/стейджа.
 * НЕ чистит БД. Создаёт/обновляет:
 *   trainer@fitpro.ru / password123
 *   client1@fitpro.ru / password123 (Мария)
 * Если у тренера нет клиентов — подтягивает минимальный демо-контент.
 *
 * Запуск: npm run seed:demo --workspace server
 * Прод: cd /opt/fitpro/current && npm run seed:demo --workspace server
 */
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import * as s from "../db/schema.js";
import { hashPassword } from "../auth/password.js";

async function upsertUser(email: string, name: string, role: "trainer" | "client", pass: string) {
  const [existing] = await db.select().from(s.users).where(eq(s.users.email, email)).limit(1);
  const verifiedAt = new Date();
  if (existing) {
    await db
      .update(s.users)
      .set({ passwordHash: pass, name, role, emailVerifiedAt: verifiedAt })
      .where(eq(s.users.id, existing.id));
    return existing.id;
  }
  const [u] = await db
    .insert(s.users)
    .values({
      email,
      passwordHash: pass,
      role,
      name,
      emailVerifiedAt: verifiedAt,
    })
    .returning();
  return u!.id;
}

async function main() {
  console.log("🔐 Ensure demo accounts (no wipe)…");
  const pass = await hashPassword("password123");

  const trainerId = await upsertUser("trainer@fitpro.ru", "Алексей Тренеров", "trainer", pass);
  const clientUserId = await upsertUser("client1@fitpro.ru", "Мария Соколова", "client", pass);

  // Подписка trial, чтобы лимиты не мешали
  const [sub] = await db
    .select()
    .from(s.trainerSubscriptions)
    .where(eq(s.trainerSubscriptions.trainerId, trainerId))
    .limit(1);
  if (!sub) {
    const until = new Date();
    until.setDate(until.getDate() + 30);
    await db.insert(s.trainerSubscriptions).values({
      trainerId,
      plan: "pro",
      status: "active",
      paidUntil: until.toISOString().slice(0, 10),
      clientLimit: 50,
    });
  }

  let [client] = await db
    .select()
    .from(s.clients)
    .where(eq(s.clients.userId, clientUserId))
    .limit(1);

  if (!client) {
    [client] = await db
      .insert(s.clients)
      .values({
        trainerId,
        userId: clientUserId,
        name: "Мария Соколова",
        goal: "Рекомпозиция",
        level: "средний",
        workFormat: "онлайн",
        age: 28,
        height: 168,
        weight: 62,
        startDate: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
        supportEndDate: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
        funnelStatus: "active",
        lastActivityAt: new Date(),
        streakWeeks: 3,
      })
      .returning();
  } else {
    await db
      .update(s.clients)
      .set({
        trainerId,
        name: "Мария Соколова",
        funnelStatus: "active",
        lastActivityAt: new Date(),
      })
      .where(eq(s.clients.id, client.id));
  }

  const clientId = client!.id;

  // Анкета
  const [prof] = await db
    .select()
    .from(s.clientProfiles)
    .where(eq(s.clientProfiles.clientId, clientId))
    .limit(1);
  if (!prof) {
    await db.insert(s.clientProfiles).values({
      clientId,
      trainingExperience: "2 года зала",
      injuries: "Нет",
      lifestyle: "Офис, сон 7ч",
      nutrition: "3 приёма, белок ~1.6 г/кг",
      steps: 8000,
      equipment: "Зал",
      preferences: "База + гантели",
      dislikes: "Долгое кардио",
    });
  }

  // Минимум упражнений + шаблон + тренировка, если пусто
  const exCount = await db.select().from(s.exercises).where(eq(s.exercises.trainerId, trainerId)).limit(1);
  if (exCount.length === 0) {
    const [sq] = await db
      .insert(s.exercises)
      .values({
        trainerId,
        name: "Приседания со штангой",
        muscles: "Квадрицепсы, ягодицы",
        techniqueDescription: "Спина прямая, колени по носкам.",
        keyHints: "Пятки в пол, грудь вверх.",
      })
      .returning();
    const [bp] = await db
      .insert(s.exercises)
      .values({
        trainerId,
        name: "Жим лёжа",
        muscles: "Грудь, трицепс",
        techniqueDescription: "Лопатки сведены, ноги в пол.",
      })
      .returning();

    const [tpl] = await db
      .insert(s.workoutTemplates)
      .values({ trainerId, name: "Фуллбоди A", goal: "Сила" })
      .returning();

    await db.insert(s.templateExercises).values([
      { templateId: tpl!.id, exerciseId: sq!.id, order: 0, sets: 4, reps: "6-8", rest: "120 сек" },
      { templateId: tpl!.id, exerciseId: bp!.id, order: 1, sets: 3, reps: "8-10", rest: "90 сек" },
    ]);

    const [w] = await db
      .insert(s.workouts)
      .values({
        clientId,
        templateId: tpl!.id,
        title: "Фуллбоди A",
        date: new Date().toISOString().slice(0, 10),
        status: "assigned",
      })
      .returning();

    await db.insert(s.workoutExercises).values([
      {
        workoutId: w!.id,
        exerciseId: sq!.id,
        order: 0,
        sets: 4,
        reps: "6-8",
        rest: "120 сек",
      },
      {
        workoutId: w!.id,
        exerciseId: bp!.id,
        order: 1,
        sets: 3,
        reps: "8-10",
        rest: "90 сек",
      },
    ]);

    // Завершённая тренировка с логами для аналитики
    const [done] = await db
      .insert(s.workouts)
      .values({
        clientId,
        templateId: tpl!.id,
        title: "Фуллбоди A",
        date: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
        status: "completed",
        tonnage: 4200,
        clientFeeling: "moderate",
        reviewStatus: "pending",
      })
      .returning();

    const [we1] = await db
      .insert(s.workoutExercises)
      .values({
        workoutId: done!.id,
        exerciseId: sq!.id,
        order: 0,
        sets: 3,
        reps: "8",
        rest: "120 сек",
      })
      .returning();

    await db.insert(s.workoutLogs).values([
      {
        workoutExerciseId: we1!.id,
        clientId,
        setNumber: 1,
        weight: 60,
        reps: 8,
        feeling: "moderate",
      },
      {
        workoutExerciseId: we1!.id,
        clientId,
        setNumber: 2,
        weight: 65,
        reps: 6,
        feeling: "hard",
      },
      {
        workoutExerciseId: we1!.id,
        clientId,
        setNumber: 3,
        weight: 65,
        reps: 6,
        feeling: "hard",
      },
    ]);

    await db.insert(s.measurements).values([
      {
        clientId,
        date: new Date(Date.now() - 21 * 86400000).toISOString().slice(0, 10),
        weight: 64,
        waist: 74,
      },
      {
        clientId,
        date: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
        weight: 62.5,
        waist: 72,
      },
    ]);
  }

  console.log("✅ Demo ready:");
  console.log("   Тренер:  trainer@fitpro.ru / password123");
  console.log("   Клиент:  client1@fitpro.ru / password123");
  console.log(`   trainerId=${trainerId} clientId=${clientId}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
