import { Lock, FileText, Video, ListChecks, BookOpen, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import {
  PageHeader,
  Spinner,
  useAsync,
  EmptyState,
  ErrorBanner,
  SectionTitle,
} from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  KNOWLEDGE_CATEGORY_LABELS,
  KNOWLEDGE_TYPE_LABELS,
  type KnowledgeItem,
} from "@/lib/domain";

const TYPE_ICON = { pdf: FileText, video: Video, checklist: ListChecks };

export function ClientKnowledge() {
  const { data, loading, error, reload } = useAsync<{
    currentWeek: number;
    items: KnowledgeItem[];
  }>(() => api.get("/knowledge/mine"));

  const open = data?.items.filter((i) => !i.locked) ?? [];
  const locked = data?.items.filter((i) => i.locked) ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="База знаний"
        title="Материалы"
        description={
          data
            ? `Вы на ${data.currentWeek}-й неделе сопровождения. Материалы открываются поэтапно — ровно тогда, когда нужны.`
            : "Гайды и разборы от тренера"
        }
      />
      {loading && <Spinner />}
      {error && <ErrorBanner message={error} onRetry={reload} />}
      {data &&
        (data.items.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            text="Тренер ещё не добавил материалы"
            hint="Здесь появятся гайды, видео и чек-листы с поэтапным доступом по неделям."
          />
        ) : (
          <div className="space-y-6">
            {open.length > 0 && (
              <div>
                <SectionTitle title="Доступно сейчас" />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {open.map((it) => (
                    <KnowledgeCard key={it.id} item={it} />
                  ))}
                </div>
              </div>
            )}
            {locked.length > 0 && (
              <div>
                <SectionTitle title="Откроются позже" />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {locked.map((it) => (
                    <KnowledgeCard key={it.id} item={it} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}

function KnowledgeCard({ item: it }: { item: KnowledgeItem }) {
  const Icon = TYPE_ICON[it.type] ?? FileText;
  return (
    <Card className={cn("flex h-full flex-col", !it.locked && "surface-interactive")}>
      <CardContent className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              // закрытый материал: нейтральная плитка вместо акцентной, контраст текста не режем
              it.locked
                ? "border border-border bg-muted text-muted-foreground"
                : "icon-well",
            )}
          >
            {it.locked ? <Lock className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium leading-snug">{it.title}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant={it.locked ? "neutral" : "secondary"}>
                {KNOWLEDGE_CATEGORY_LABELS[it.category]}
              </Badge>
              <Badge variant="outline">{KNOWLEDGE_TYPE_LABELS[it.type]}</Badge>
            </div>
          </div>
        </div>
        <div className="mt-auto pt-4">
          {it.locked ? (
            <p className="surface-subtle rounded-xl px-3 py-2 text-xs text-muted-foreground">
              <Lock className="mr-1.5 inline h-3 w-3 align-[-1px]" />
              Откроется на {it.unlockWeek}-й неделе
            </p>
          ) : it.fileUrl ? (
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href={it.fileUrl} target="_blank" rel="noreferrer">
                Открыть <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">Файл пока не прикреплён</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
