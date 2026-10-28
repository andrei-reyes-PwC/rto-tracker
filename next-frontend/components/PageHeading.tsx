import type { ReactNode } from "react";

type PageHeadingProps = {
  category: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export default function PageHeading({ category, title, description, actions }: PageHeadingProps) {
  return (
    <section className="flex flex-col justify-between gap-5 border-b border-[#e8e2dc] pb-6 sm:flex-row sm:items-end">
      <div className="flex min-w-0 gap-4">
        <span aria-hidden="true" className="w-1 shrink-0 self-stretch rounded-full bg-[#e65300]" />
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[#a33a08]">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-[#e65300]" />
            {category}
          </p>
          <h1 className="mt-1.5 text-3xl font-semibold leading-tight tracking-tight text-[#2d2926]">{title}</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center">{actions}</div>}
    </section>
  );
}
