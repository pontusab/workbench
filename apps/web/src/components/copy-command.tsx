"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";

type CopyCommandProps = {
  command: string;
  variant?: "button" | "inline";
};

export function CopyCommand({ command, variant = "button" }: CopyCommandProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={onCopy}
        className="group inline-flex items-center gap-2 font-mono text-sm text-[color:var(--color-foreground)] underline decoration-[color:var(--color-border)] decoration-1 underline-offset-[6px] transition hover:decoration-[color:var(--color-foreground)]"
        aria-label={`Copy command: ${command}`}
      >
        <span>{command}</span>
        {copied ? (
          <CheckIcon className="h-3.5 w-3.5 text-emerald-400 opacity-100" />
        ) : (
          <CopyIcon className="h-3.5 w-3.5 text-[color:var(--color-muted-foreground)] opacity-0 transition group-hover:opacity-100" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className="group flex w-full items-start gap-2 overflow-hidden border border-[color:var(--color-border)] bg-[color:var(--color-muted)] px-5 py-3 font-mono text-sm transition hover:border-[color:var(--color-foreground)]/40"
      aria-label={`Copy command: ${command}`}
    >
      <span className="shrink-0 text-[color:var(--color-muted-foreground)]">$</span>
      <span className="min-w-0 flex-1 overflow-x-auto whitespace-pre text-start">{command}</span>
      {copied ? (
        <CheckIcon className="h-4 w-4 shrink-0 text-emerald-400" />
      ) : (
        <CopyIcon className="h-4 w-4 shrink-0 text-[color:var(--color-muted-foreground)] transition group-hover:text-[color:var(--color-foreground)]" />
      )}
    </button>
  );
}
