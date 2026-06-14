"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthState } from "@/app/auth-actions";

type Action = (prev: AuthState, formData: FormData) => Promise<AuthState>;

export function AuthForm({
  mode,
  action,
}: {
  mode: "login" | "register";
  action: Action;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const isRegister = mode === "register";

  return (
    <div className="mx-auto mt-24 w-full max-w-md px-4">
      <div className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
        <h1 className="mb-1 text-2xl font-heading">
          {isRegister ? "Регистрация" : "Вход"}
        </h1>
        <p className="mb-6 text-sm text-foreground/70">
          Canbanimizer — realtime канбан для команды
        </p>

        <form action={formAction} className="flex flex-col gap-4">
          {isRegister && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Имя</Label>
              <Input id="name" name="name" required autoComplete="name" />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete={isRegister ? "new-password" : "current-password"}
            />
          </div>

          {state.error && (
            <p className="rounded-base border-2 border-border bg-chart-2/20 px-3 py-2 text-sm">
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "..." : isRegister ? "Создать аккаунт" : "Войти"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm">
          {isRegister ? (
            <>
              Уже есть аккаунт?{" "}
              <Link href="/login" className="font-heading underline">
                Войти
              </Link>
            </>
          ) : (
            <>
              Нет аккаунта?{" "}
              <Link href="/register" className="font-heading underline">
                Регистрация
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
