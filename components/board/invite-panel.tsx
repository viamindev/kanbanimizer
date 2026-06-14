"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inviteMemberAction } from "@/app/invite-actions";

export function InvitePanel({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"MEMBER" | "ADMIN">("MEMBER");
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    setError(null);
    setLink(null);
    start(async () => {
      const res = await inviteMemberAction({ projectId, email, role });
      if (res.error) setError(res.error);
      else if (res.token) {
        setLink(`${window.location.origin}/invite/${res.token}`);
        setEmail("");
      }
    });
  }

  return (
    <div className="relative">
      <Button variant="neutral" size="sm" onClick={() => setOpen((o) => !o)}>
        Пригласить
      </Button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow">
          <div className="flex flex-col gap-2">
            <Input
              placeholder="email коллеги"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "MEMBER" | "ADMIN")}
              className="h-9 rounded-base border-2 border-border bg-secondary-background px-2 text-sm"
            >
              <option value="MEMBER">Участник</option>
              <option value="ADMIN">Админ</option>
            </select>
            <Button size="sm" disabled={pending || !email} onClick={submit}>
              {pending ? "..." : "Создать ссылку"}
            </Button>
            {error && <p className="text-sm text-chart-2">{error}</p>}
            {link && (
              <div className="flex flex-col gap-1">
                <p className="text-xs text-foreground/70">
                  Отправьте коллеге ссылку:
                </p>
                <input
                  readOnly
                  value={link}
                  onFocus={(e) => e.currentTarget.select()}
                  className="rounded-base border-2 border-border bg-background px-2 py-1 text-xs"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
