"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { positionBetween } from "@/lib/position";
import type { BoardEvent } from "@/lib/events";
import {
  createColumnAction,
  createTaskAction,
  deleteTaskAction,
  moveTaskAction,
  updateTaskAction,
} from "@/app/board-actions";
import { InvitePanel } from "./invite-panel";
import { TaskModal } from "./task-modal";
import { applyEvent, type ColumnT, type TaskT } from "./state";

export function BoardView({
  boardId,
  projectId,
  canInvite,
  initialColumns,
}: {
  boardId: string;
  projectId: string;
  canInvite: boolean;
  initialColumns: ColumnT[];
}) {
  const router = useRouter();
  const [columns, setColumns] = useState<ColumnT[]>(initialColumns);
  const [connected, setConnected] = useState(false);
  const [activeTask, setActiveTask] = useState<TaskT | null>(null);
  const draggingId = useRef<string | null>(null);

  const dispatch = useCallback(
    (ev: BoardEvent) => setColumns((cols) => applyEvent(cols, ev)),
    [],
  );

  // realtime stream
  useEffect(() => {
    const es = new EventSource(`/api/board/${boardId}/stream`);
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (e) => {
      try {
        dispatch(JSON.parse(e.data) as BoardEvent);
      } catch {
        /* ignore malformed frame */
      }
    };
    return () => es.close();
  }, [boardId, dispatch]);

  /* ----------------------------- mutations ---------------------------- */

  async function addTask(columnId: string, title: string) {
    const task = await createTaskAction({ columnId, title });
    dispatch({ type: "task.created", task });
  }

  async function saveTask(
    taskId: string,
    patch: { title: string; description: string | null },
  ) {
    const task = await updateTaskAction({ taskId, ...patch });
    dispatch({ type: "task.updated", task });
  }

  async function removeTask(taskId: string) {
    dispatch({ type: "task.deleted", taskId });
    await deleteTaskAction(taskId);
  }

  async function addColumn(name: string) {
    const column = await createColumnAction({ boardId, name });
    dispatch({ type: "column.created", column });
  }

  async function moveTask(taskId: string, toColumnId: string, beforeTaskId: string | null) {
    const target = columns.find((c) => c.id === toColumnId);
    if (!target) return;
    const siblings = target.tasks
      .filter((t) => t.id !== taskId)
      .sort((a, b) => (a.position < b.position ? -1 : 1));

    let lower: string | null;
    let upper: string | null;
    if (beforeTaskId === null) {
      lower = siblings.at(-1)?.position ?? null;
      upper = null;
    } else {
      const idx = siblings.findIndex((t) => t.id === beforeTaskId);
      lower = idx > 0 ? siblings[idx - 1].position : null;
      upper = siblings[idx]?.position ?? null;
    }

    let position: string;
    try {
      position = positionBetween(lower, upper);
    } catch {
      position = positionBetween(siblings.at(-1)?.position ?? null, null);
    }

    dispatch({ type: "task.moved", taskId, columnId: toColumnId, position });
    try {
      await moveTaskAction({ taskId, columnId: toColumnId, position });
    } catch {
      router.refresh(); // resync on conflict
    }
  }

  /* ------------------------------- render ----------------------------- */

  return (
    <>
      <div className="flex shrink-0 items-center justify-between px-4 py-2">
        <span className="flex items-center gap-2 text-xs text-foreground/60">
          <span
            className={`inline-block size-2 rounded-full ${
              connected ? "bg-chart-4" : "bg-chart-2"
            }`}
          />
          {connected ? "В реальном времени" : "Переподключение…"}
        </span>
        {canInvite && <InvitePanel projectId={projectId} />}
      </div>

      <div className="flex flex-1 gap-4 overflow-x-auto px-4 pb-4">
        {columns.map((col) => (
          <ColumnView
            key={col.id}
            column={col}
            onAddTask={(title) => addTask(col.id, title)}
            onOpenTask={setActiveTask}
            onDropTask={(beforeTaskId) => {
              if (draggingId.current)
                moveTask(draggingId.current, col.id, beforeTaskId);
            }}
            onDragStart={(id) => (draggingId.current = id)}
          />
        ))}
        <AddColumn onAdd={addColumn} />
      </div>

      {activeTask && (
        <TaskModal
          task={
            columns.flatMap((c) => c.tasks).find((t) => t.id === activeTask.id) ??
            activeTask
          }
          onClose={() => setActiveTask(null)}
          onSave={(patch) => saveTask(activeTask.id, patch)}
          onDelete={() => removeTask(activeTask.id)}
        />
      )}
    </>
  );
}

/* ------------------------------- column -------------------------------- */

function ColumnView({
  column,
  onAddTask,
  onOpenTask,
  onDropTask,
  onDragStart,
}: {
  column: ColumnT;
  onAddTask: (title: string) => void;
  onOpenTask: (task: TaskT) => void;
  onDropTask: (beforeTaskId: string | null) => void;
  onDragStart: (taskId: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const tasks = [...column.tasks].sort((a, b) =>
    a.position < b.position ? -1 : 1,
  );

  function submit() {
    const t = title.trim();
    if (t) onAddTask(t);
    setTitle("");
    setAdding(false);
  }

  return (
    <div
      className="flex w-72 shrink-0 flex-col rounded-base border-2 border-border bg-secondary-background"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDropTask(null); // dropped on empty column area → append
      }}
    >
      <div className="flex items-center justify-between border-b-2 border-border px-3 py-2">
        <span className="font-heading">{column.name}</span>
        <span className="text-xs text-foreground/50">{tasks.length}</span>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            draggable
            onDragStart={() => onDragStart(task.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDropTask(task.id); // insert before this task
            }}
            onClick={() => onOpenTask(task)}
            className="cursor-grab rounded-base border-2 border-border bg-background p-2 text-sm shadow-shadow active:cursor-grabbing"
          >
            {task.title}
          </div>
        ))}
      </div>

      <div className="border-t-2 border-border p-2">
        {adding ? (
          <div className="flex flex-col gap-2">
            <Input
              autoFocus
              value={title}
              placeholder="Заголовок задачи"
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
                if (e.key === "Escape") setAdding(false);
              }}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={submit}>
                Добавить
              </Button>
              <Button
                size="sm"
                variant="neutral"
                onClick={() => setAdding(false)}
              >
                Отмена
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full rounded-base px-2 py-1 text-left text-sm text-foreground/60 hover:bg-background"
          >
            + Задача
          </button>
        )}
      </div>
    </div>
  );
}

/* ----------------------------- add column ------------------------------ */

function AddColumn({ onAdd }: { onAdd: (name: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  function submit() {
    const n = name.trim();
    if (n) onAdd(n);
    setName("");
    setAdding(false);
  }

  return (
    <div className="w-72 shrink-0">
      {adding ? (
        <div className="flex flex-col gap-2 rounded-base border-2 border-border bg-secondary-background p-2">
          <Input
            autoFocus
            value={name}
            placeholder="Название колонки"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              if (e.key === "Escape") setAdding(false);
            }}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={submit}>
              Добавить
            </Button>
            <Button size="sm" variant="neutral" onClick={() => setAdding(false)}>
              Отмена
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full rounded-base border-2 border-dashed border-border px-3 py-2 text-left text-sm text-foreground/60 hover:bg-secondary-background"
        >
          + Колонка
        </button>
      )}
    </div>
  );
}
