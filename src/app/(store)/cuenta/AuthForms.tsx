"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, signIn, signUp, updatePassword, type FormState } from "@/app/actions/auth";
import { Field, FormMessage, SubmitButton } from "@/components/forms";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="container-x flex justify-center pt-14 md:pt-20">
      <div className="w-full max-w-md animate-fade-up">
        <h1 className="h-display text-center text-4xl md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-3 text-center text-sm text-espresso-500">{subtitle}</p>}
        <div className="card mt-10 p-7 sm:p-9">{children}</div>
      </div>
    </div>
  );
}

export function LoginForm({ next, linkError }: { next: string; linkError: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(signIn, null);
  return (
    <form action={action} className="space-y-5">
      {linkError && <FormMessage state={{ ok: false, message: "El enlace no es válido o ha caducado. Inténtalo de nuevo." }} />}
      <input type="hidden" name="next" value={next} />
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field label="Contraseña" name="password" type="password" autoComplete="current-password" required />
      <div className="text-right">
        <Link href="/cuenta/recuperar" className="text-sm text-espresso-500 underline underline-offset-2">¿Has olvidado tu contraseña?</Link>
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full py-3.5" pendingText="Entrando…">Iniciar sesión</SubmitButton>
      <p className="text-center text-sm text-espresso-500">
        ¿No tienes cuenta? <Link href={`/cuenta/registro${next !== "/cuenta" ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-espresso underline">Regístrate</Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [state, action] = useActionState<FormState, FormData>(signUp, null);
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-5">
      <Field label="Nombre y apellidos" name="fullName" autoComplete="name" required maxLength={120} />
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field label="Contraseña" name="password" type="password" autoComplete="new-password" required minLength={8} />
      <p className="-mt-3 text-xs text-espresso-300">Mínimo 8 caracteres, con letras y números.</p>
      <label className="flex items-start gap-2 text-sm text-espresso-700">
        <input type="checkbox" name="terms" required className="mt-1 accent-espresso" />
        <span>He leído y acepto la <Link href="/privacidad" className="underline">política de privacidad</Link>.</span>
      </label>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full py-3.5" pendingText="Creando cuenta…">Crear cuenta</SubmitButton>
      <p className="text-center text-sm text-espresso-500">
        ¿Ya tienes cuenta? <Link href="/cuenta/login" className="text-espresso underline">Inicia sesión</Link>
      </p>
    </form>
  );
}

export function RecoverForm() {
  const [state, action] = useActionState<FormState, FormData>(requestPasswordReset, null);
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-5">
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full py-3.5" pendingText="Enviando…">Enviar enlace</SubmitButton>
      <p className="text-center text-sm"><Link href="/cuenta/login" className="text-espresso-500 underline">Volver a iniciar sesión</Link></p>
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(updatePassword, null);
  return (
    <form action={action} className="space-y-5">
      <Field label="Nueva contraseña" name="password" type="password" autoComplete="new-password" required minLength={8} />
      <Field label="Repite la contraseña" name="confirm" type="password" autoComplete="new-password" required minLength={8} />
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full py-3.5">Guardar contraseña</SubmitButton>
    </form>
  );
}
