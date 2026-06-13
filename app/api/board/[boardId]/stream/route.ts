import { getCurrentUser } from "@/lib/auth";
import { requireBoardAccess } from "@/lib/access";
import { subscribe, type BoardEvent } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const { boardId } = await params;

  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  try {
    await requireBoardAccess(boardId, user.id);
  } catch {
    return new Response("Forbidden", { status: 403 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: BoardEvent) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );
      };

      // initial comment so the client `onopen` fires promptly
      controller.enqueue(encoder.encode(": connected\n\n"));

      const unsubscribe = subscribe(boardId, send);

      // heartbeat keeps proxies from closing the idle connection
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": ping\n\n"));
      }, 25_000);

      // tear down when the client disconnects
      _req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
