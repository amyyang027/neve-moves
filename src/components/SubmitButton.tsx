"use client";

import { useFormStatus } from "react-dom";
import { buttonClass, buttonSecondaryClass, buttonDangerClass } from "./ui";

/**
 * A submit button that shows a pending state while its <form> action runs.
 * Must be rendered inside a <form>.
 */
export function SubmitButton({
  children,
  pendingText,
  variant = "primary",
  confirm,
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: "primary" | "secondary" | "danger";
  /** If set, the browser asks for confirmation before submitting. */
  confirm?: string;
}) {
  const { pending } = useFormStatus();
  const cls =
    variant === "primary"
      ? buttonClass
      : variant === "danger"
        ? buttonDangerClass
        : buttonSecondaryClass;

  return (
    <button
      type="submit"
      disabled={pending}
      className={cls}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending ? (pendingText ?? "Working…") : children}
    </button>
  );
}
