import { Link } from "react-router-dom";
import { Dumbbell, Flame, ClipboardCheck, ChevronRight, Award } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, Spinner, StatCard, useAsync } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Client, ClientProfile, Workout, Achievement } from "@/lib/domain";

export function ClientHome() {
  const { user } = useAuth();
  const me = useAsync<{ client: Client; profile: ClientProfile | null; achievements: Achievement[] }>(
    () => api.get("/me/client"),
  );
  const workouts = useAsync<{ workouts: Workout[] }>(() => api.get("/workouts/mine"));

  if (me.loading || workouts.loading) return <Spinner />;
  if (me.error) return <p className="text-sm text-destructive">{me.error}</p>;

  const client = me.data?.client;
  const profileFilled = !!me.data?.profile;
  const next = workouts.data?.workouts.find((w) => w.status === "assigned");
  const completed = workouts.data?.workouts.filter((w) => w.status === "completed").length ?? 0;

  return (
    <div>
      <PageHeader
        eyebrow="Мой кабинет"
        title={`Привет, ${user?.name}!`}
        description="Ваш сегодняшний фокус"
      />

      {!profileFilled && (
        <Card className="mb-4 border-warning/30 bg-warning/10">
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="font-medium">Заполните анкету</p>
              <p className="text-sm text-muted-foreground">
                Это поможет тренеру составить программу под вас.
              </p>
            </div>
            <Button asChild>
              <Link to="/c/profile">Заполнить</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Ближайшая тренировка</CardTitle>
          </CardHeader>
          <CardContent>
            {next ? (
              <Link
                to={`/c/workouts/${next.id}`}
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Dumbbell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{next.title ?? "Тренировка"}</p>
                    <p className="text-xs text-muted-foreground">{next.date ?? "без даты"}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">
                Новых тренировок нет. Тренер скоро назначит программу.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <StatCard
            label="недель серии"
            value={client?.streakWeeks ?? 0}
            icon={Flame}
            tone="warning"
          />
          <StatCard
            label="тренировок выполнено"
            value={completed}
            icon={ClipboardCheck}
            tone="success"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="secondary">Цель: {client?.goal ?? "—"}</Badge>
        {client?.supportEndDate && (
          <Badge variant="outline">Сопровождение до {client.supportEndDate}</Badge>
        )}
      </div>

      {me.data?.achievements && me.data.achievements.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Достижения</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {me.data.achievements.map((a) => (
              <Badge key={a.id} variant="success" className="gap-1">
                <Award className="h-3 w-3" /> {a.type}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
