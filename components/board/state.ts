import type { BoardEvent } from "@/lib/events";

export type TaskT = {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  position: string;
};

export type ColumnT = {
  id: string;
  boardId: string;
  name: string;
  position: string;
  tasks: TaskT[];
};

const byPosition = <T extends { position: string }>(a: T, b: T) =>
  a.position < b.position ? -1 : a.position > b.position ? 1 : 0;

/** Pure, idempotent reducer applied to both local optimistic and SSE events. */
export function applyEvent(columns: ColumnT[], ev: BoardEvent): ColumnT[] {
  switch (ev.type) {
    case "column.created": {
      if (columns.some((c) => c.id === ev.column.id)) return columns;
      return [...columns, { ...ev.column, tasks: [] }].sort(byPosition);
    }
    case "column.updated":
      return columns.map((c) =>
        c.id === ev.column.id ? { ...c, name: ev.column.name } : c,
      );
    case "column.moved":
      return columns
        .map((c) =>
          c.id === ev.columnId ? { ...c, position: ev.position } : c,
        )
        .sort(byPosition);
    case "column.deleted":
      return columns.filter((c) => c.id !== ev.columnId);

    case "task.created": {
      return columns.map((c) => {
        if (c.id !== ev.task.columnId) return c;
        if (c.tasks.some((t) => t.id === ev.task.id)) return c;
        return { ...c, tasks: [...c.tasks, ev.task].sort(byPosition) };
      });
    }
    case "task.updated":
      return columns.map((c) => ({
        ...c,
        tasks: c.tasks.map((t) =>
          t.id === ev.task.id ? { ...t, ...ev.task } : t,
        ),
      }));
    case "task.deleted":
      return columns.map((c) => ({
        ...c,
        tasks: c.tasks.filter((t) => t.id !== ev.taskId),
      }));

    case "task.moved": {
      let moving: TaskT | undefined;
      const stripped = columns.map((c) => {
        const found = c.tasks.find((t) => t.id === ev.taskId);
        if (found) moving = found;
        return { ...c, tasks: c.tasks.filter((t) => t.id !== ev.taskId) };
      });
      if (!moving) return columns;
      const moved: TaskT = {
        ...moving,
        columnId: ev.columnId,
        position: ev.position,
      };
      return stripped.map((c) =>
        c.id === ev.columnId
          ? { ...c, tasks: [...c.tasks, moved].sort(byPosition) }
          : c,
      );
    }
    default:
      return columns;
  }
}
