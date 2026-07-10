import { db } from "../db/client.js";
import { clients, exercises, workouts, workoutExercises } from "../db/schema.js";

/**
 * Тестовый клиент новому тренеру: даёт пощупать продукт до первого реального
 * клиента. Помечен isDemo — не занимает место в лимите тарифа и удаляется
 * обычной кнопкой «Удалить клиента» (каскадом уносит свои тренировки).
 */
export async function createDemoClient(trainerId: string): Promise<void> {
  const [demoExercise] = await db
    .insert(exercises)
    .values([
      {
        trainerId,
        name: "Приседания со штангой",
        muscles: "Квадрицепсы, ягодицы",
        techniqueDescription: "Спина прямая, колени по направлению носков, таз назад.",
        keyHints: "Пятки прижаты, грудь развёрнута.",
        commonMistakes: "Колени заваливаются внутрь, круглая спина.",
      },
      {
        trainerId,
        name: "Жим лёжа",
        muscles: "Грудь, трицепс",
        techniqueDescription: "Лопатки сведены, штанга к низу груди.",
        keyHints: "Стабильный мост, локти 45°.",
      },
    ])
    .returning();

  const [client] = await db
    .insert(clients)
    .values({
      trainerId,
      name: "Тестовый клиент",
      goal: "Знакомство с платформой",
      level: "новичок",
      workFormat: "онлайн",
      funnelStatus: "active",
      startDate: new Date().toISOString().slice(0, 10),
      isDemo: true,
    })
    .returning();

  if (!client || !demoExercise) return;

  const [workout] = await db
    .insert(workouts)
    .values({
      clientId: client.id,
      title: "Пробная тренировка",
      date: new Date().toISOString().slice(0, 10),
    })
    .returning();

  if (workout) {
    await db.insert(workoutExercises).values({
      workoutId: workout.id,
      exerciseId: demoExercise.id,
      order: 0,
      sets: 3,
      reps: "10",
      rest: "90 сек",
    });
  }
}
