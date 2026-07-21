import { useState } from "react";
import { Plus, Trash2, FileText, Video, ListChecks, Lock } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, Spinner, useAsync, EmptyState, ErrorBanner } from "@/components/common";
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
import {
  KNOWLEDGE_CATEGORY_LABELS,
  KNOWLEDGE_TYPE_LABELS,
  type KnowledgeItem,
  type KnowledgeCategory,
  type KnowledgeType,
} from "@/lib/domain";

const TYPE_ICON = { pdf: FileText, video: Video, checklist: ListChecks };

export function KnowledgePage() {
  const { data, loading, error, reload } = useAsync<{ items: KnowledgeItem[] }>(() =>
    api.get("/knowledge"),
  );
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <PageHeader
        eyebrow="Материалы"
        title="База знаний"
        description="Гайды и видео с поэтапным открытием по неделям сопровождения."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Материал
          </Button>
        }
      />
      {loading && <Spinner />}
      {error && <ErrorBanner message={error} onRetry={reload} />}
      {data &&
        (data.items.length === 0 ? (
          <EmptyState text="Материалов пока нет" hint="Загрузите гайд, видео или чек-лист — клиент увидит его в кабинете." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((it) => {
              const Icon = TYPE_ICON[it.type];
              return (
                <Card key={it.id}>
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="font-medium">{it.title}</span>
                      </div>
                      <DeleteKnowledgeButton item={it} onDeleted={reload} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {KNOWLEDGE_CATEGORY_LABELS[it.category]}
                      </Badge>
                      <Badge variant="outline">{KNOWLEDGE_TYPE_LABELS[it.type]}</Badge>
                      <Badge variant="outline" className="gap-1">
                        <Lock className="h-3 w-3" /> неделя {it.unlockWeek}
                      </Badge>
                    </div>
                    {it.fileUrl && (
                      <a
                        href={it.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-sm text-primary hover:underline"
                      >
                        Открыть файл
                      </a>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ))}
      {creating && (
        <KnowledgeDialog
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            reload();
          }}
        />
      )}
    </div>
  );
}

/** Удаление материала каскадом снимает и выданные клиентам доступы к нему. */
function DeleteKnowledgeButton({
  item,
  onDeleted,
}: {
  item: KnowledgeItem;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      await api.delete(`/knowledge/${item.id}`);
      setOpen(false);
      onDeleted();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label={`Удалить: ${item.title}`}
        title="Удалить материал"
      >
        <Trash2 className="h-4 w-4 text-muted-foreground" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить материал?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Материал «{item.title}» будет удалён из базы знаний и пропадёт у клиентов,
              которым он уже открылся. Загруженный файл придётся прикреплять заново.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
                Отмена
              </Button>
              <Button variant="destructive" onClick={remove} disabled={busy}>
                {busy ? "Удаляем…" : "Удалить"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function KnowledgeDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<KnowledgeCategory>("nutrition");
  const [type, setType] = useState<KnowledgeType>("pdf");
  const [unlockWeek, setUnlockWeek] = useState("1");
  const [fileUrl, setFileUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { url } = await api.upload(file);
    setFileUrl(url);
    setUploading(false);
  }

  async function save() {
    setBusy(true);
    await api.post("/knowledge", {
      title,
      category,
      type,
      unlockWeek: Number(unlockWeek),
      fileUrl: fileUrl || undefined,
    });
    setBusy(false);
    onSaved();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый материал</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Название</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Категория</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as KnowledgeCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(KNOWLEDGE_CATEGORY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Тип</Label>
              <Select value={type} onValueChange={(v) => setType(v as KnowledgeType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(KNOWLEDGE_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Открыть на неделе</Label>
            <Input
              type="number"
              min={1}
              value={unlockWeek}
              onChange={(e) => setUnlockWeek(e.target.value)}
            />
          </div>
          <div>
            <Label>Файл (PDF / видео)</Label>
            <Input type="file" accept="application/pdf,video/*,image/*" onChange={onFile} />
            {uploading && <p className="text-xs text-muted-foreground">Загрузка…</p>}
            {fileUrl && <p className="text-xs text-success" role="status">Файл загружен ✓</p>}
          </div>
          <Button className="w-full" onClick={save} disabled={busy || !title}>
            {busy ? "Сохраняем…" : "Сохранить"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
