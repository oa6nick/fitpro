import { Lock, FileText, Video, ListChecks } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, Spinner, useAsync, EmptyState } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  KNOWLEDGE_CATEGORY_LABELS,
  KNOWLEDGE_TYPE_LABELS,
  type KnowledgeItem,
} from "@/lib/domain";

const TYPE_ICON = { pdf: FileText, video: Video, checklist: ListChecks };

export function ClientKnowledge() {
  const { data, loading } = useAsync<{ currentWeek: number; items: KnowledgeItem[] }>(() =>
    api.get("/knowledge/mine"),
  );

  return (
    <div>
      <PageHeader
        title="Материалы"
        description={
          data ? `Вы на ${data.currentWeek}-й неделе сопровождения. Материалы открываются поэтапно.` : "База знаний"
        }
      />
      {loading && <Spinner />}
      {data &&
        (data.items.length === 0 ? (
          <EmptyState text="Тренер ещё не добавил материалы." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((it) => {
              const Icon = TYPE_ICON[it.type];
              return (
                <Card key={it.id} className={cn(it.locked && "opacity-60")}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      {it.locked ? (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Icon className="h-4 w-4 text-primary" />
                      )}
                      <span className="font-medium">{it.title}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="secondary">{KNOWLEDGE_CATEGORY_LABELS[it.category]}</Badge>
                      <Badge variant="outline">{KNOWLEDGE_TYPE_LABELS[it.type]}</Badge>
                    </div>
                    {it.locked ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Откроется на {it.unlockWeek}-й неделе
                      </p>
                    ) : it.fileUrl ? (
                      <a
                        href={it.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-sm text-primary hover:underline"
                      >
                        Открыть
                      </a>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">Файл не прикреплён</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ))}
    </div>
  );
}
