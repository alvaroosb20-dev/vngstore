"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="eyebrow">Algo ha fallado</p>
      <h1 className="h-display mt-3 text-4xl">No hemos podido cargar esta página</h1>
      <p className="mt-4 max-w-md text-espresso-500">Inténtalo de nuevo en unos segundos. Si el problema continúa, contacta con nosotros.</p>
      <div className="mt-8 flex gap-3">
        <button onClick={reset} className="btn-primary">Reintentar</button>
        <Link href="/" className="btn-outline">Inicio</Link>
      </div>
    </div>
  );
}
