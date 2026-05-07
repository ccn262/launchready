import { cn } from "@/lib/utils";

export function SectionShell({
  title,
  description,
  children,
  className,
}: Readonly<{
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-white/10 bg-card p-5 shadow-[0_18px_70px_-45px_rgba(0,0,0,0.85)] sm:p-6",
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-card-foreground">
            {title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}
