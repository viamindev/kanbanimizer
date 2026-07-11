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
    }
  }
}

// oxlint-disable-next-line unicorn/require-module-specifiers
export {};
