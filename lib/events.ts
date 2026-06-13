import { EventEmitter } from "node:events";

// In-memory pub/sub for realtime board updates. One Node process holds all
// SSE connections and rebroadcasts mutations to every subscriber of a board.
// Swap this module for Redis pub/sub when scaling to multiple processes.

const globalForBus = globalThis as unknown as {
  boardBus: EventEmitter | undefined;
};

const bus =
  globalForBus.boardBus ??
  (() => {
    const e = new EventEmitter();
    e.setMaxListeners(0); // unlimited concurrent SSE clients
    return e;
  })();

globalForBus.boardBus = bus;

export type BoardEvent =
  | { type: "task.created"; task: SerializedTask }
  | { type: "task.updated"; task: SerializedTask }
  | { type: "task.moved"; taskId: string; columnId: string; position: string }
  | { type: "task.deleted"; taskId: string }
  | { type: "column.created"; column: SerializedColumn }
  | { type: "column.updated"; column: SerializedColumn }
  | { type: "column.deleted"; columnId: string };

export type SerializedTask = {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  position: string;
};

export type SerializedColumn = {
  id: string;
  boardId: string;
  name: string;
  position: string;
};

function channel(boardId: string) {
  return `board:${boardId}`;
}

/** Publish an event to every SSE subscriber of a board. */
export function publish(boardId: string, event: BoardEvent) {
  bus.emit(channel(boardId), event);
}

/** Subscribe to a board's events. Returns an unsubscribe function. */
export function subscribe(
  boardId: string,
  handler: (event: BoardEvent) => void,
): () => void {
  bus.on(channel(boardId), handler);
  return () => bus.off(channel(boardId), handler);
}
