import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <section className="border-b border-border bg-secondary">
      <div className="mx-auto max-w-7xl px-4 py-14 text-center">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-2 text-4xl md:text-5xl">{title}</h1>
        {children && <div className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">{children}</div>}
      </div>
    </section>
  );
}

export function SectionTitle({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <div className="mb-10 text-center">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <div className="mt-2 flex items-center justify-center gap-4">
        <span className="hidden h-px w-12 bg-primary/60 sm:block" />
        <h2 className="text-3xl md:text-4xl">{title}</h2>
        <span className="hidden h-px w-12 bg-primary/60 sm:block" />
      </div>
      {sub && <p className="mt-2 text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-3xl space-y-4 px-4 py-14 text-sm leading-7 text-foreground/85 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:text-foreground [&_ul]:list-disc [&_ul]:pl-5">{children}</div>;
}
