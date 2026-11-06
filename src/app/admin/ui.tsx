export function PageHeader({ title, children, subtitle }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-4xl text-espresso">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-espresso-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-wider text-espresso-500">{label}</p>
      <p className="mt-2 font-serif text-3xl text-espresso">{value}</p>
      {hint && <p className="mt-1 text-xs text-espresso-300">{hint}</p>}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="card p-10 text-center text-sm text-espresso-500">{children}</div>;
}

export const th = "px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-espresso-500";
export const td = "px-4 py-3 align-middle";
