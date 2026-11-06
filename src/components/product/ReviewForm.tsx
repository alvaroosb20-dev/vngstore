"use client";

import { useActionState, useState } from "react";
import { submitReview, type ReviewState } from "@/app/actions/reviews";
import { StarIcon } from "@/components/icons";

export function ReviewForm({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(submitReview, null);
  const [rating, setRating] = useState(5);

  if (state?.ok) return <p className="card p-6 text-sm text-espresso-700">{state.message}</p>;

  return (
    <form action={action} className="card space-y-4 p-6">
      <p className="font-serif text-xl text-espresso">Escribe tu valoración</p>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />
      <div className="flex gap-1 text-copper" role="radiogroup" aria-label="Puntuación">
        {[1, 2, 3, 4, 5].map((i) => (
          <button type="button" key={i} onClick={() => setRating(i)} aria-label={`${i} estrellas`} aria-checked={rating === i} role="radio">
            <StarIcon className="h-6 w-6" filled={i <= rating} />
          </button>
        ))}
      </div>
      <input name="title" placeholder="Título (opcional)" maxLength={120} className="input" />
      <textarea name="body" required minLength={10} maxLength={2000} rows={4} placeholder="¿Qué te ha parecido?" className="input" />
      {state && !state.ok && <p className="text-sm text-rose-700">{state.message}</p>}
      <button className="btn-primary" disabled={pending}>
        {pending ? "Enviando…" : "Publicar valoración"}
      </button>
    </form>
  );
}
