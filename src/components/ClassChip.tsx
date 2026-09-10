import type { Classificacao } from "@/lib/crm";

export function ClassChip({ value }: { value: Classificacao }) {
  const style =
    value === "A"
      ? "bg-ember/10 text-ember"
      : value === "B"
        ? "border border-ink/20"
        : "border border-line text-ink-soft";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${style}`}>{value}</span>
  );
}
