"use client";

import Link from "next/link";
import { useActionState } from "react";
import { subscribeNewsletter, type NewsletterState } from "@/app/actions/newsletter";

export function NewsletterForm() {
  const [state, action, pending] = useActionState<NewsletterState, FormData>(subscribeNewsletter, null);

  if (state?.ok) {
    return <p className="font-serif text-2xl text-espresso animate-fade-in">{state.message}</p>;
  }

  return (
    <form action={action} className="mx-auto w-full max-w-md">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input type="email" name="email" required placeholder="tu@email.com" className="input flex-1 rounded-full" aria-label="Email" autoComplete="email" />
        <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <button className="btn-primary" disabled={pending}>
          {pending ? "Enviando…" : "Suscribirme"}
        </button>
      </div>
      <label className="mt-3 flex items-start gap-2 text-left text-xs text-espresso-500">
        <input type="checkbox" name="consent" required className="mt-0.5 accent-espresso" />
        <span>
          Acepto recibir comunicaciones de VNG Store y la{" "}
          <Link href="/privacidad" className="underline">política de privacidad</Link>. Puedes darte de baja cuando quieras.
        </span>
      </label>
      {state && !state.ok && <p className="mt-2 text-sm text-rose-700">{state.message}</p>}
    </form>
  );
}
