export type ProjectRole = "owner" | "member" | "viewer";

export type Action =
  | "project:read"
  | "project:update"
  | "project:delete"
  | "project:ownership:transfer"
  | "member:read"
  | "member:invite"
  | "member:remove"
  | "member:role:update"
  | "section:read"
  | "section:create"
  | "section:update"
  | "section:delete"
  | "board:read"
  | "board:create"
  | "board:update"
  | "board:delete"
  | "card:read"
  | "card:create"
  | "card:update"
  | "card:delete";

export type PermissionContext = {
  userId?: string;
  resourceCreatedBy?: string;
};

export function can(
  role: ProjectRole,
  action: Action,
  context: PermissionContext = {},
): boolean {
  if (role === "owner") {
    return true;
  }

  if (role === "viewer") {
    return (
      action === "project:read" ||
      action === "section:read" ||
      action === "board:read" ||
      action === "card:read"
    );
  }

  if (role === "member") {
    switch (action) {
      case "project:read":
      case "section:read":
      case "board:read":
      case "card:read":
      case "card:create":
      case "card:update":
      case "card:delete":
      case "board:create":
        return true;

      case "section:update":
      case "section:delete":
      case "board:update":
      case "board:delete":
        return (
          context.userId !== undefined &&
          context.resourceCreatedBy !== undefined &&
          context.userId === context.resourceCreatedBy
        );

      default:
        return false;
    }
  }

  return false;
}
