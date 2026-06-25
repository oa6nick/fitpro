import { Link } from "react-router-dom";
import { Users, AlertTriangle, Inbox, CalendarClock, UserCheck } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, Spinner, useAsync } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardData {
  counts: {
    total: number;
    active: number;
    newRequests: number;
    atRisk: number;
    ending: number;
  };
  atRisk: { id: string; name: string; lastActivityAt: string | null }[];
  newRequests: { id: string; name: string; funnelStatus: string }[];
  ending: { id: string; name: string; daysToEnd: number | null }[];
}

const WIDGETS = [
  { key: "total", label: "Всего клиентов", icon: Users, color: "text-sky-600" },
  { key: "active", label: "Активные", icon: UserCheck, color: "text-emerald-600" },
  { key: "newRequests", label: "Новые заявки и анкеты", icon: Inbox, color: "text-indigo-600" },
  { key: "atRisk", label: "Зона риска (7+ дней)", icon: AlertTriangle, color: "text-red-600" },
  { key: "ending", label: "Заканчивается сопровождение", icon: CalendarClock, color: "text-amber-600" },
] as const;

export function TrainerDashboard() {
  const { data, loading, error } = useAsync<DashboardData>(() => api.get("/dashboard"));

  return (
    <div>
      <PageHeader
        title="Главная"
        description="Оперативная сводка по клиентам — за 10 секунд видно, где нужно действие."
      />
      {loading && <Spinner />}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {WIDGETS.map((w) => (
              <Card key={w.key}>
                <CardContent className="p-4">
                  <w.icon className={`h-5 w-5 ${w.color}`} />
                  <p className="mt-2 text-2xl font-bold">{data.counts[w.key]}</p>
                  <p className="text-xs text-muted-foreground">{w.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <ListCard title="Зона риска" empty="Нет клиентов в зоне риска">
              {data.atRisk.map((c) => (
                <ClientRow key={c.id} id={c.id} name={c.name} hint="нет активности 7+ дней" />
              ))}
            </ListCard>
            <ListCard title="Новые заявки и анкеты" empty="Новых заявок нет">
              {data.newRequests.map((c) => (
                <ClientRow key={c.id} id={c.id} name={c.name} hint="ожидает обработки" />
              ))}
            </ListCard>
            <ListCard title="Заканчивается сопровождение" empty="Ближайших окончаний нет">
              {data.ending.map((c) => (
                <ClientRow
                  key={c.id}
                  id={c.id}
                  name={c.name}
                  hint={c.daysToEnd === 0 ? "сегодня" : `через ${c.daysToEnd} дн.`}
                />
              ))}
            </ListCard>
          </div>
        </>
      )}
    </div>
  );
}

function ListCard({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children : [children];
  const hasItems = items.flat().filter(Boolean).length > 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {hasItems ? children : <p className="text-sm text-muted-foreground">{empty}</p>}
      </CardContent>
    </Card>
  );
}

function ClientRow({ id, name, hint }: { id: string; name: string; hint: string }) {
  return (
    <Link
      to={`/t/clients/${id}`}
      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-accent"
    >
      <span className="font-medium">{name}</span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </Link>
  );
}
