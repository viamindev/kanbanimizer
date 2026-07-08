declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

// oxlint-disable-next-line unicorn/require-module-specifiers
export {};
