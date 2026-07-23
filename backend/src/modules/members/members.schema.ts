import { z } from "zod"

export const AddProjectMemberSchema = z.object({
  email: z.email().toLowerCase(),
  role: z.enum(["member", "viewer"]).default("member")
})

export const AddSectionMemberSchema = z.object({
  email: z.email().toLowerCase(),
})
