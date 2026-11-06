import Link from "next/link";

export default function RootNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="h-display mt-3 text-5xl">Página no encontrada</h1>
      <Link href="/" className="btn-primary mt-8">Volver al inicio</Link>
    </div>
  );
}
