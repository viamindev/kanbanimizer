"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createProjectAction,
  type ProjectFormState,
} from "@/app/project-actions";

export function CreateProjectForm() {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(
    createProjectAction,
    {},
  );
  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row">
      <Input
        name="name"
        placeholder="Название проекта"
        required
        className="sm:max-w-xs"
      />
      <Button type="submit" disabled={pending}>
        {pending ? "..." : "Создать проект"}
      </Button>
      {state.error && (
        <span className="self-center text-sm text-chart-2">{state.error}</span>
      )}
    </form>
  );
}
