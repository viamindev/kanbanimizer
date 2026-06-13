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
  deleteColumnAction,
  deleteTaskAction,
  moveColumnAction,
  moveTaskAction,
  renameColumnAction,
  updateTaskAction,
} from "@/app/board-actions";
import { InvitePanel } from "./invite-panel";
import { TaskModal } from "./task-modal";
import { applyEvent, type ColumnT, type TaskT } from "./state";

export function BoardView({
  boardId,
  projectId,
  canInvite,
  currentUserId,
  role,
  initialColumns,
}: {
  boardId: string;
  projectId: string;
  canInvite: boolean;
  currentUserId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  initialColumns: ColumnT[];
}) {
  const router = useRouter();
  // OWNER/ADMIN may modify any entity; a MEMBER only their own.
  const canWrite = (creatorId: string | null) =>
    role === "OWNER" || role === "ADMIN" || creatorId === currentUserId;
  const [columns, setColumns] = useState<ColumnT[]>(initialColumns);
  const [connected, setConnected] = useState(false);
  const [activeTask, setActiveTask] = useState<TaskT | null>(null);
  const drag = useRef<{ type: "task" | "column"; id: string } | null>(null);

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

  async function renameColumn(columnId: string, name: string) {
    const column = await renameColumnAction({ columnId, name });
    dispatch({ type: "column.updated", column });
  }

  async function removeColumn(columnId: string) {
    dispatch({ type: "column.deleted", columnId });
    await deleteColumnAction(columnId);
  }

  async function moveColumn(columnId: string, beforeColumnId: string | null) {
    const others = columns
      .filter((c) => c.id !== columnId)
      .sort((a, b) => (a.position < b.position ? -1 : 1));

    let lower: string | null;
    let upper: string | null;
    if (beforeColumnId === null) {
      lower = others.at(-1)?.position ?? null;
      upper = null;
    } else {
      const idx = others.findIndex((c) => c.id === beforeColumnId);
      lower = idx > 0 ? others[idx - 1].position : null;
      upper = others[idx]?.position ?? null;
    }

    let position: string;
    try {
      position = positionBetween(lower, upper);
    } catch {
      position = positionBetween(others.at(-1)?.position ?? null, null);
    }

    dispatch({ type: "column.moved", columnId, position });
    try {
      await moveColumnAction({ columnId, position });
    } catch {
      router.refresh();
    }
  }

  // drop onto a column: reorder columns, or move the dragged task into it
  function handleDrop(targetColumnId: string, beforeTaskId: string | null) {
    const d = drag.current;
    if (!d) return;
    if (d.type === "column") moveColumn(d.id, targetColumnId);
    else moveTask(d.id, targetColumnId, beforeTaskId);
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
            canEditColumn={canWrite(col.createdById)}
            canEditTask={canWrite}
            onAddTask={(title) => addTask(col.id, title)}
            onOpenTask={setActiveTask}
            onDrop={(beforeTaskId) => handleDrop(col.id, beforeTaskId)}
            onTaskDragStart={(id) => (drag.current = { type: "task", id })}
            onColumnDragStart={(id) => (drag.current = { type: "column", id })}
            onRename={(name) => renameColumn(col.id, name)}
            onDelete={() => removeColumn(col.id)}
          />
        ))}
        <AddColumn
          onAdd={addColumn}
          onDropColumn={() => {
            if (drag.current?.type === "column") moveColumn(drag.current.id, null);
          }}
        />
      </div>

      {activeTask && (
        <TaskModal
          task={
            columns.flatMap((c) => c.tasks).find((t) => t.id === activeTask.id) ??
            activeTask
          }
          readOnly={!canWrite(activeTask.createdById)}
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
  canEditColumn,
  canEditTask,
  onAddTask,
  onOpenTask,
  onDrop,
  onTaskDragStart,
  onColumnDragStart,
  onRename,
  onDelete,
}: {
  column: ColumnT;
  canEditColumn: boolean;
  canEditTask: (creatorId: string | null) => boolean;
  onAddTask: (title: string) => void;
  onOpenTask: (task: TaskT) => void;
  onDrop: (beforeTaskId: string | null) => void;
  onTaskDragStart: (taskId: string) => void;
  onColumnDragStart: (columnId: string) => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(column.name);
  const tasks = [...column.tasks].sort((a, b) =>
    a.position < b.position ? -1 : 1,
  );

  function submit() {
    const t = title.trim();
    if (t) onAddTask(t);
    setTitle("");
    setAdding(false);
  }

  function submitName() {
    const n = name.trim();
    if (n && n !== column.name) onRename(n);
    else setName(column.name);
    setEditingName(false);
  }

  return (
    <div
      className="flex w-72 shrink-0 flex-col rounded-base border-2 border-border bg-secondary-background"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(null); // dropped on empty column area → append task / reorder column
      }}
    >
      <div
        draggable={canEditColumn && !editingName}
        onDragStart={(e) => {
          onColumnDragStart(column.id);
          e.stopPropagation();
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDrop(null); // dropping on the header reorders columns
        }}
        className={`flex items-center justify-between gap-2 border-b-2 border-border px-3 py-2 ${
          canEditColumn ? "cursor-grab active:cursor-grabbing" : ""
        }`}
      >
        {editingName ? (
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={submitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitName();
              if (e.key === "Escape") {
                setName(column.name);
                setEditingName(false);
              }
            }}
            className="h-7"
          />
        ) : (
          <span
            className="flex-1 truncate font-heading"
            onDoubleClick={() => canEditColumn && setEditingName(true)}
            title={canEditColumn ? "Двойной клик — переименовать" : undefined}
          >
            {column.name}
          </span>
        )}
        <span className="text-xs text-foreground/50">{tasks.length}</span>
        {canEditColumn && (
          <button
            onClick={onDelete}
            title="Удалить колонку"
            className="rounded-base px-1 text-foreground/50 hover:bg-chart-2/30 hover:text-foreground"
          >
            ×
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
        {tasks.map((task) => {
          const editable = canEditTask(task.createdById);
          return (
            <div
              key={task.id}
              draggable={editable}
              onDragStart={(e) => {
                onTaskDragStart(task.id);
                e.stopPropagation();
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDrop(task.id); // insert before this task
              }}
              onClick={() => onOpenTask(task)}
              className={`rounded-base border-2 border-border bg-background p-2 text-sm shadow-shadow ${
                editable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
              }`}
            >
              {task.title}
            </div>
          );
        })}
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

function AddColumn({
  onAdd,
  onDropColumn,
}: {
  onAdd: (name: string) => void;
  onDropColumn: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  function submit() {
    const n = name.trim();
    if (n) onAdd(n);
    setName("");
    setAdding(false);
  }

  return (
    <div
      className="w-72 shrink-0"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDropColumn(); // drop here → move column to the end
      }}
    >
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
