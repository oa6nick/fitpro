import { useState } from "react";
import { Plus, Bell, Wallet, Check } from "lucide-react";
import { api } from "@/lib/api";
import {
  PageHeader,
  Spinner,
  StatCard,
  useAsync,
  EmptyState,
  ErrorBanner,
  FormError,
  TableScroll,
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Client, Payment } from "@/lib/domain";

interface FinanceData {
  payments: Payment[];
  totals: { paid: number; overdue: number };
}

/** Состояние отправки напоминания по конкретному платежу. */
type RemindState =
  | { status: "sending" }
  | { status: "sent" }
  | { status: "error"; message: string };

/** Сколько держим подпись «Отправлено», прежде чем вернуть кнопку в обычный вид. */
const SENT_LABEL_MS = 4000;

export function FinancePage() {
  const { data, loading, error, reload } = useAsync<FinanceData>(() => api.get("/finance"));
  const [adding, setAdding] = useState(false);
  // Ключ — id платежа: таблица и мобильный список рендерятся отдельно,
  // но состояние у них общее, поэтому храним его здесь, а не внутри кнопки.
  const [reminders, setReminders] = useState<Record<string, RemindState>>({});

  async function sendReminder(payment: Payment) {
    setReminders((s) => ({ ...s, [payment.id]: { status: "sending" } }));
    try {
      await api.post(`/finance/${payment.id}/remind`);
      setReminders((s) => ({ ...s, [payment.id]: { status: "sent" } }));
      setTimeout(() => {
        setReminders((s) => {
          const next = { ...s };
          delete next[payment.id];
          return next;
        });
      }, SENT_LABEL_MS);
    } catch (e) {
      setReminders((s) => ({
        ...s,
        [payment.id]: {
          status: "error",
          message: e instanceof Error ? e.message : "Не удалось отправить напоминание",
        },
      }));
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Деньги"
        title="Финансы"
        description="Оплаты, статусы и продления — без сторонних таблиц."
        action={
          <Button onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> Оплата
          </Button>
        }
      />
      {loading && <Spinner />}
      {error && <ErrorBanner message={error} onRetry={reload} />}
      {data && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:max-w-md">
            <StatCard
              label="Получено всего"
              value={`${data.totals.paid.toLocaleString("ru-RU")} ₽`}
              icon={Wallet}
              tone="success"
            />
            <StatCard
              label="Просроченных"
              value={data.totals.overdue}
              icon={Bell}
              tone="warning"
            />
          </div>
          {data.payments.length === 0 ? (
            <EmptyState text="Оплат пока нет" hint="История платежей клиентов появится здесь, как только вы начнёте фиксировать оплаты." />
          ) : (
            <Card>
              <CardContent className="p-0">
                {/* Мобильный: строки-карточки вместо обрезанной таблицы */}
                <ul className="divide-y divide-border md:hidden">
                  {data.payments.map((p) => (
                    <li key={p.id} className="space-y-2 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{p.clientName}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {p.date}
                            {p.nextRenewalDate && ` · продление ${p.nextRenewalDate}`}
                          </p>
                        </div>
                        <p className="shrink-0 font-semibold tabular-nums">
                          {p.amount.toLocaleString("ru-RU")} ₽
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant={p.status === "paid" ? "success" : "destructive"}>
                          {p.status === "paid" ? "Оплачено" : "Просрочено"}
                        </Badge>
                        <RemindButton
                          payment={p}
                          state={reminders[p.id]}
                          onSend={sendReminder}
                        />
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Десктоп */}
                <TableScroll>
                <table className="hidden w-full text-sm md:table">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th scope="col" className="p-3 font-medium">Клиент</th>
                      <th scope="col" className="p-3 font-medium">Сумма</th>
                      <th scope="col" className="p-3 font-medium">Дата</th>
                      <th scope="col" className="p-3 font-medium">Статус</th>
                      <th scope="col" className="p-3 font-medium">Продление</th>
                      <th scope="col" className="p-3">
                        <span className="sr-only">Действия</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments.map((p) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="p-3 font-medium">{p.clientName}</td>
                        <td className="p-3 tabular-nums">{p.amount.toLocaleString("ru-RU")} ₽</td>
                        <td className="p-3 text-muted-foreground">{p.date}</td>
                        <td className="p-3">
                          <Badge variant={p.status === "paid" ? "success" : "destructive"}>
                            {p.status === "paid" ? "Оплачено" : "Просрочено"}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">{p.nextRenewalDate ?? "—"}</td>
                        <td className="p-3">
                          <RemindButton
                            payment={p}
                            state={reminders[p.id]}
                            onSend={sendReminder}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </TableScroll>
              </CardContent>
            </Card>
          )}
        </>
      )}
      {adding && (
        <PaymentDialog
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            reload();
          }}
        />
      )}
    </div>
  );
}

function RemindButton({
  payment,
  state,
  onSend,
}: {
  payment: Payment;
  state?: RemindState;
  onSend: (payment: Payment) => void;
}) {
  const status = state?.status;

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant={status === "sent" ? "outline" : "ghost"}
        size="sm"
        onClick={() => onSend(payment)}
        disabled={status === "sending" || status === "sent"}
        aria-label={`Напомнить ${payment.clientName}`}
      >
        {status === "sent" ? (
          <Check className="h-4 w-4 text-success" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
        {/* role="status" — чтобы скринридер сам озвучил смену «Отправляем…» → «Отправлено». */}
        <span role="status">
          {status === "sending" ? "Отправляем…" : status === "sent" ? "Отправлено" : "Напомнить"}
        </span>
      </Button>
      {state?.status === "error" && (
        <FormError message={state.message} className="px-2 py-1 text-xs" />
      )}
    </div>
  );
}

function PaymentDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { data } = useAsync<{ clients: Client[] }>(() => api.get("/clients"), []);
  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<"paid" | "overdue">("paid");
  const [nextRenewalDate, setNext] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await api.post("/finance", {
      clientId,
      amount: Number(amount),
      date,
      status,
      nextRenewalDate: nextRenewalDate || undefined,
    });
    setBusy(false);
    onSaved();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новая оплата</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Клиент</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите клиента" />
              </SelectTrigger>
              <SelectContent>
                {(data?.clients ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Сумма, ₽</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <Label>Дата</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Статус</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as "paid" | "overdue")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Оплачено</SelectItem>
                  <SelectItem value="overdue">Просрочено</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>След. продление</Label>
              <Input type="date" value={nextRenewalDate} onChange={(e) => setNext(e.target.value)} />
            </div>
          </div>
          <Button className="w-full" onClick={save} disabled={busy || !clientId || !amount}>
            {busy ? "Сохраняем…" : "Сохранить"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
