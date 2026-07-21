import type { Section } from "@/db/schema/sections";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };

      membership?: {
        role: "owner" | "member" | "viewer";
        projectId: string;
      };

      section?: Section;
    }
  }
}

// oxlint-disable-next-line unicorn/require-module-specifiers
export {};
