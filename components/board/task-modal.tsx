"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TaskT } from "./state";

export function TaskModal({
  task,
  readOnly = false,
  onClose,
  onSave,
  onDelete,
}: {
  task: TaskT;
  readOnly?: boolean;
  onClose: () => void;
  onSave: (patch: { title: string; description: string | null }) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [pending, start] = useTransition();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-heading">Заголовок</label>
            <Input
              value={title}
              readOnly={readOnly}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-heading">Описание</label>
            <textarea
              value={description}
              readOnly={readOnly}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="rounded-base border-2 border-border bg-background px-3 py-2 text-sm outline-none read-only:opacity-70"
            />
          </div>
          {readOnly ? (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-foreground/60">
                Только просмотр — карточка создана другим участником
              </span>
              <Button variant="neutral" size="sm" onClick={onClose}>
                Закрыть
              </Button>
            </div>
          ) : (
            <div className="mt-2 flex items-center justify-between">
              <Button
                variant="neutral"
                size="sm"
                disabled={pending}
                onClick={() => start(async () => { await onDelete(); onClose(); })}
                className="bg-chart-2/30"
              >
                Удалить
              </Button>
              <div className="flex gap-2">
                <Button variant="neutral" size="sm" onClick={onClose}>
                  Отмена
                </Button>
                <Button
                  size="sm"
                  disabled={pending || !title.trim()}
                  onClick={() =>
                    start(async () => {
                      await onSave({
                        title: title.trim(),
                        description: description.trim() || null,
                      });
                      onClose();
                    })
                  }
                >
                  {pending ? "..." : "Сохранить"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
