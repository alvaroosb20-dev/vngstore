"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "vng-cookie-notice";

/**
 * La tienda solo usa cookies y almacenamiento técnicos (sesión de usuario y carrito),
 * exentos de consentimiento según el art. 22.2 LSSI. Este aviso informa de ello.
 * Si en el futuro añades analítica o publicidad, necesitarás un gestor de consentimiento con opción de rechazar.
 */
export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      setShow(!window.localStorage.getItem(KEY));
    } catch {
      setShow(false);
    }
  }, []);

  if (!show) return null;

  function accept() {
    try {
      window.localStorage.setItem(KEY, new Date().toISOString());
    } catch {
      /* noop */
    }
    setShow(false);
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-xl rounded-2xl border border-espresso/10 bg-white/95 p-5 shadow-xl backdrop-blur animate-fade-up sm:inset-x-6 sm:bottom-6">
      <p className="text-sm leading-relaxed text-espresso-700">
        Usamos únicamente cookies técnicas necesarias para el inicio de sesión y el carrito. No usamos cookies de
        seguimiento ni publicidad.{" "}
        <Link href="/cookies" className="underline underline-offset-2">
          Más información
        </Link>
      </p>
      <div className="mt-4 flex justify-end">
        <button onClick={accept} className="btn-primary px-5 py-2">
          Entendido
        </button>
      </div>
    </div>
  );
}
