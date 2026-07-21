import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, LayoutGrid, List as ListIcon, AlertTriangle, ChevronRight, Users } from "lucide-react";
import { api } from "@/lib/api";
import {
  PageHeader,
  Spinner,
  useAsync,
  useIsMobile,
  ErrorBanner,
  EmptyState,
  EmptyHint,
  Avatar,
} from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FUNNEL_ORDER,
  FUNNEL_LABELS,
  FUNNEL_TONES,
  type Client,
  type FunnelStatus,
} from "@/lib/domain";

export function ClientsPage() {
  // На узком экране канбан режется — по умолчанию показываем список.
  const isMobile = useIsMobile();
  const [view, setView] = useState<"board" | "list">(isMobile ? "list" : "board");
  const { data, loading, error, reload } = useAsync<{ clients: Client[] }>(() =>
    api.get("/clients"),
  );

  return (
    <div>
      <PageHeader
        eyebrow="CRM"
        title="Клиенты"
        description="Воронка от заявки до архива. Зона риска подсвечена — не теряйте тех, кто затих."
        action={
          <div className="flex items-center gap-2">
            {/* Сегментированный переключатель вида — та же подложка, что у TabsList. */}
            <div className="surface-subtle inline-flex items-center rounded-full p-1">
              <Button
                variant={view === "board" ? "default" : "ghost"}
                size="icon"
                className={`h-8 w-8 ${
                  view === "board" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
                onClick={() => setView("board")}
                aria-label="Вид: доска"
                aria-pressed={view === "board"}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={view === "list" ? "default" : "ghost"}
                size="icon"
                className={`h-8 w-8 ${
                  view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
                onClick={() => setView("list")}
                aria-label="Вид: список"
                aria-pressed={view === "list"}
              >
                <ListIcon className="h-4 w-4" />
              </Button>
            </div>
            <NewClientDialog onCreated={reload} />
          </div>
        }
      />
      {loading && <Spinner />}
      {error && <ErrorBanner message={error} onRetry={reload} />}
      {data &&
        (data.clients.length === 0 ? (
          <EmptyState
            icon={Users}
            text="Клиентов пока нет"
            hint="Создайте карточку, отправьте приглашение — клиент заполнит анкету сам, а вы соберёте программу."
            action={<NewClientDialog onCreated={reload} />}
          />
        ) : view === "board" ? (
          <Board clients={data.clients} />
        ) : (
          <ClientList clients={data.clients} />
        ))}
    </div>
  );
}

function Board({ clients }: { clients: Client[] }) {
  return (
    <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4">
      {FUNNEL_ORDER.map((status) => {
        const list = clients.filter((c) => c.funnelStatus === status);
        return (
          <div key={status} className="w-[78vw] shrink-0 snap-start sm:w-64">
            <div className="surface-subtle mb-2.5 flex items-center justify-between gap-2 rounded-xl px-2.5 py-2">
              <span className="type-caption">{FUNNEL_LABELS[status]}</span>
              <Badge variant={FUNNEL_TONES[status]}>{list.length}</Badge>
            </div>
            <div className="surface-subtle min-h-[4.5rem] space-y-2 rounded-panel border-dashed p-1.5">
              {list.map((c) => (
                <Link
                  key={c.id}
                  to={`/t/clients/${c.id}`}
                  className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Card className="surface-interactive rounded-xl">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={c.name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate font-medium">{c.name}</span>
                            {c.riskFlag && c.funnelStatus === "active" && (
                              <AlertTriangle
                                className="h-3.5 w-3.5 shrink-0 text-destructive"
                                aria-label="Зона риска"
                              />
                            )}
                          </div>
                          {c.goal && (
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.goal}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {list.length === 0 && <EmptyHint className="text-xs">Пусто</EmptyHint>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Список клиентов: на десктопе таблица, на мобиле — строки-карточки. */
function ClientList({ clients }: { clients: Client[] }) {
  return (
    <Card>
      <CardContent className="p-0">
        {/* Десктоп */}
        <table className="hidden w-full text-sm md:table">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="p-3 font-medium">Имя</th>
              <th className="p-3 font-medium">Статус</th>
              <th className="p-3 font-medium">Цель</th>
              <th className="p-3 font-medium">Риск</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-accent/40">
                <td className="p-3">
                  <Link
                    to={`/t/clients/${c.id}`}
                    className="inline-flex items-center gap-2.5 font-medium hover:underline"
                  >
                    <Avatar name={c.name} size="sm" />
                    {c.name}
                  </Link>
                </td>
                <td className="p-3">
                  <Badge variant={FUNNEL_TONES[c.funnelStatus]}>
                    {FUNNEL_LABELS[c.funnelStatus]}
                  </Badge>
                </td>
                <td className="p-3 text-muted-foreground">{c.goal ?? "—"}</td>
                <td className="p-3">
                  {c.riskFlag && c.funnelStatus === "active" ? (
                    <Badge variant="destructive">риск</Badge>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Мобильный */}
        <ul className="divide-y divide-border md:hidden">
          {clients.map((c) => (
            <li key={c.id}>
              <Link
                to={`/t/clients/${c.id}`}
                className="flex items-start justify-between gap-3 p-4 transition-colors hover:bg-accent/50"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <Avatar name={c.name} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.name}</p>
                    {c.goal && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.goal}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge variant={FUNNEL_TONES[c.funnelStatus]}>
                        {FUNNEL_LABELS[c.funnelStatus]}
                      </Badge>
                      {c.riskFlag && c.funnelStatus === "active" && (
                        <Badge variant="destructive">риск</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function NewClientDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [status, setStatus] = useState<FunnelStatus>("new");
  const [supportEndDate, setSupportEndDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await api.post("/clients", {
        name,
        goal: goal || undefined,
        funnelStatus: status,
        supportEndDate: supportEndDate || undefined,
      });
      setOpen(false);
      setName("");
      setGoal("");
      setSupportEndDate("");
      setStatus("new");
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> Клиент
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый клиент</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Имя</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Цель</Label>
            <Input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Похудение / масса / рекомпозиция…"
            />
          </div>
          <div>
            <Label>Статус воронки</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as FunnelStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FUNNEL_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {FUNNEL_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Срок сопровождения (дата окончания)</Label>
            <Input
              type="date"
              value={supportEndDate}
              onChange={(e) => setSupportEndDate(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" onClick={submit} disabled={busy || !name}>
            {busy ? "Создаём…" : "Создать"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
