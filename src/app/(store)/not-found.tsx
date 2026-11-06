import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x flex flex-col items-center py-28 text-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="h-display mt-3 text-5xl">Página no encontrada</h1>
      <p className="mt-4 max-w-md text-espresso-500">Puede que el producto ya no esté disponible o que el enlace sea incorrecto.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/tienda" className="btn-primary">Ir a la tienda</Link>
        <Link href="/" className="btn-outline">Inicio</Link>
      </div>
    </div>
  );
}
