import { useState } from "react";
import { Plus, Trash2, CheckSquare } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, Spinner, useAsync, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Client, HabitTask, TaskWeekItem } from "@/lib/domain";

export function TasksPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Сопровождение"
        title="Задачи и привычки"
        description="Привычки на неделю: шаги, вода, сон — с автоматическим % соблюдения."
      />
      <Tabs defaultValue="assign">
        <TabsList>
          <TabsTrigger value="assign">Назначение</TabsTrigger>
          <TabsTrigger value="compliance">Соблюдение</TabsTrigger>
          <TabsTrigger value="library">Библиотека</TabsTrigger>
        </TabsList>
        <TabsContent value="assign">
          <AssignTab />
        </TabsContent>
        <TabsContent value="compliance">
          <ComplianceTab />
        </TabsContent>
        <TabsContent value="library">
          <LibraryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LibraryTab() {
  const { data, loading, reload } = useAsync<{ habits: HabitTask[] }>(() => api.get("/tasks/habits"));
  const [title, setTitle] = useState("");

  async function add() {
    if (!title.trim()) return;
    await api.post("/tasks/habits", { title });
    setTitle("");
    reload();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex gap-2 pt-6">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: 10 000 шагов, вода 2л, сон до 23:00…"
          />
          <Button onClick={add} disabled={!title.trim()}>
            <Plus className="h-4 w-4" /> Добавить
          </Button>
        </CardContent>
      </Card>
      {loading && <Spinner />}
      {data &&
        (data.habits.length === 0 ? (
          <EmptyState text="Библиотека пуста" hint="Добавьте привычки (шаги, вода, сон), затем назначьте клиенту на неделю." />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {data.habits.map((h) => (
              <Card key={h.id}>
                <CardContent className="flex items-center justify-between py-3">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <CheckSquare className="h-4 w-4 text-primary" /> {h.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      await api.delete(`/tasks/habits/${h.id}`);
                      reload();
                    }}
                    aria-label="Удалить"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
    </div>
  );
}

function AssignTab() {
  const { data: clientsData } = useAsync<{ clients: Client[] }>(() => api.get("/clients"), []);
  const { data: habitsData } = useAsync<{ habits: HabitTask[] }>(() => api.get("/tasks/habits"), []);
  const [clientId, setClientId] = useState("");
  const [habitId, setHabitId] = useState("");
  const [msg, setMsg] = useState("");

  async function assign() {
    await api.post("/tasks/assign", { clientId, habitTaskId: habitId });
    setMsg("Задача назначена на текущую неделю ✓");
    setTimeout(() => setMsg(""), 2500);
  }

  return (
    <Card>
      <CardContent className="max-w-md space-y-3 pt-6">
        <div>
          <label className="mb-1 block text-sm font-medium">Клиент</label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите клиента" />
            </SelectTrigger>
            <SelectContent>
              {(clientsData?.clients ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Привычка</label>
          <Select value={habitId} onValueChange={setHabitId}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите привычку" />
            </SelectTrigger>
            <SelectContent>
              {(habitsData?.habits ?? []).map((h) => (
                <SelectItem key={h.id} value={h.id}>
                  {h.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={assign} disabled={!clientId || !habitId}>
          Назначить на неделю
        </Button>
        {msg && <p className="text-sm text-success" role="status">{msg}</p>}
      </CardContent>
    </Card>
  );
}

function ComplianceTab() {
  const { data: clientsData } = useAsync<{ clients: Client[] }>(() => api.get("/clients"), []);
  const [clientId, setClientId] = useState("");

  return (
    <div className="space-y-4">
      <div className="w-56">
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите клиента" />
          </SelectTrigger>
          <SelectContent>
            {(clientsData?.clients ?? []).map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {clientId && <ComplianceList clientId={clientId} />}
    </div>
  );
}

function ComplianceList({ clientId }: { clientId: string }) {
  const { data, loading } = useAsync<{ weekStart: string; tasks: TaskWeekItem[] }>(
    () => api.get(`/tasks/compliance?clientId=${clientId}`),
    [clientId],
  );
  if (loading) return <Spinner />;
  if (!data || data.tasks.length === 0) return <EmptyState text="На эту неделю задач нет" hint="Назначьте привычки клиенту — % соблюдения появится здесь." />;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Неделя с {data.weekStart}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.tasks.map((t) => (
          <div key={t.id}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium">{t.title}</span>
              <span className="text-muted-foreground">{t.compliance}%</span>
            </div>
            <Progress value={t.compliance} aria-label={`Соблюдение: ${t.compliance}%`} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
