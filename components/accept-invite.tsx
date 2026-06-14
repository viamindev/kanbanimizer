"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { acceptInviteAction } from "@/app/invite-actions";

export function AcceptInvite({ token }: { token: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <Button
        disabled={pending}
        onClick={() =>
          start(async () => {
            try {
              await acceptInviteAction(token);
            } catch (e) {
              setError(
                e instanceof Error && e.message === "INVITE_EMAIL_MISMATCH"
                  ? "Приглашение отправлено на другой email"
                  : "Приглашение недействительно или истекло",
              );
            }
          })
        }
      >
        {pending ? "..." : "Принять приглашение"}
      </Button>
      {error && <p className="text-sm text-chart-2">{error}</p>}
    </div>
  );
}
