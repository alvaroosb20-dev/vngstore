import { isPending, site } from "@/lib/config";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="container-x max-w-3xl pt-12 md:pt-16">
      <p className="eyebrow">Información legal</p>
      <h1 className="h-display mt-3 text-4xl md:text-5xl">{title}</h1>
      <p className="mt-3 text-xs text-espresso-300">Última actualización: {new Date().getFullYear()}</p>
      <div className="prose-legal mt-10">{children}</div>
    </article>
  );
}

/** Muestra un dato del titular; si está pendiente lo resalta para que se vea que falta. */
export function V({ v }: { v: string }) {
  if (!v) return null;
  if (isPending(v)) return <mark className="rounded bg-copper-100 px-1 text-copper-600">[{v}]</mark>;
  return <>{v}</>;
}

export const owner = site.owner;
