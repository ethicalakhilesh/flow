export function Pill({
  children,
  tone = "accent",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "accent" | "neutral";
  className?: string;
}) {
  const toneClasses =
    tone === "accent"
      ? "bg-accent-bg text-accent-fg"
      : "bg-surface-muted text-text-secondary";

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${toneClasses} ${className}`}
    >
      {children}
    </span>
  );
}
