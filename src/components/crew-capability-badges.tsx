export type BadgeTone = "green" | "amber" | "red" | "grey";

export type CrewCapabilityBadgeItem = Readonly<{
  id: string;
  label: string;
  assetLabel: string;
  roleLabel: string;
  tone: BadgeTone;
}>;

export function CrewCapabilityBadges({
  items,
  emptyLabel = "No capabilities",
}: Readonly<{
  items: CrewCapabilityBadgeItem[];
  emptyLabel?: string;
}>) {
  if (!items.length) {
    return (
      <span className="text-xs text-muted-foreground">{emptyLabel}</span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item.id}
          className={[
            "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-wide",
            item.tone === "green"
              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
              : item.tone === "amber"
                ? "border-amber-500/30 bg-amber-500/15 text-amber-200"
                : item.tone === "red"
                  ? "border-rose-500/30 bg-rose-500/15 text-rose-200"
                  : "border-white/15 bg-white/5 text-muted-foreground",
          ].join(" ")}
          title={`${item.assetLabel} / ${item.roleLabel}`}
        >
          {item.label}
        </span>
      ))}
    </div>
  );
}
