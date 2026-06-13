"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";

export type AuthState = { error?: string };

const registerSchema = z.object({
  name: z.string().trim().min(1, "Введите имя").max(80),
  email: z.string().trim().toLowerCase().email("Неверный email"),
  password: z.string().min(8, "Минимум 8 символов").max(200),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Неверный email"),
  password: z.string().min(1, "Введите пароль"),
});

export async function registerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ошибка ввода" };
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Email уже зарегистрирован" };

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await hashPassword(password) },
  });
  await createSession(user.id);
  redirect("/projects");
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ошибка ввода" };
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Неверный email или пароль" };
  }
  await createSession(user.id);
  redirect("/projects");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
