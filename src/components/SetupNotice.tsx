import { Logo } from "@/components/Logo";

/** Se muestra mientras faltan variables de entorno en Vercel, en lugar de un error 500. */
export function SetupNotice({ missing }: { missing: string[] }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg text-center">
        <Logo size="lg" />
        <h1 className="h-display mt-10 text-3xl">Tienda en configuración</h1>
        <p className="mt-3 text-sm text-espresso-500">
          Faltan estas variables de entorno en Vercel (Settings → Environment Variables). Añádelas y vuelve a desplegar.
        </p>
        <ul className="card mt-6 space-y-2 p-5 text-left font-mono text-xs text-espresso">
          {missing.map((m) => (
            <li key={m}>• {m}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
