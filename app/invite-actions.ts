"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { requireProjectMember } from "@/lib/access";

const inviteSchema = z.object({
  projectId: z.string().uuid(),
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

const INVITE_TTL_DAYS = 7;

export type InviteResult = { token?: string; error?: string };

/** Owner/Admin creates an invite. Returns a token to share as /invite/<token>. */
export async function inviteMemberAction(input: {
  projectId: string;
  email: string;
  role?: "ADMIN" | "MEMBER";
}): Promise<InviteResult> {
  const user = await requireUser();
  const data = inviteSchema.parse(input);

  const membership = await requireProjectMember(data.projectId, user.id);
  if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
    return { error: "Только владелец или админ может приглашать" };
  }

  const token = randomBytes(24).toString("hex");
  await prisma.invitation.create({
    data: {
      projectId: data.projectId,
      email: data.email,
      token,
      role: data.role,
      allSubprojects: true,
      invitedById: user.id,
      expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 86400_000),
    },
  });
  return { token };
}

/** Logged-in user accepts an invite by token, becoming a project member. */
export async function acceptInviteAction(token: string) {
  const user = await requireUser();
  const invite = await prisma.invitation.findUnique({ where: { token } });

  if (!invite || invite.status !== "PENDING" || invite.expiresAt < new Date()) {
    throw new Error("INVITE_INVALID");
  }
  if (invite.email !== user.email.toLowerCase()) {
    throw new Error("INVITE_EMAIL_MISMATCH");
  }

  await prisma.$transaction([
    prisma.membership.upsert({
      where: { projectId_userId: { projectId: invite.projectId, userId: user.id } },
      create: {
        projectId: invite.projectId,
        userId: user.id,
        role: invite.role,
        allSubprojects: invite.allSubprojects,
      },
      update: { revokedAt: null, revokedById: null },
    }),
    prisma.invitation.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED" },
    }),
  ]);

  redirect("/projects");
}
