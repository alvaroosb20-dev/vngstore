"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@/lib/types";

export function Gallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) {
    return <div className="flex aspect-[4/5] items-center justify-center rounded-3xl bg-cream-200 font-serif text-5xl text-espresso-300">VNG</div>;
  }
  const current = images[Math.min(active, images.length - 1)];
  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row">
      {images.length > 1 && (
        <div className="flex gap-3 md:flex-col">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-cream-200 transition ${i === active ? "ring-2 ring-espresso" : "opacity-60 hover:opacity-100"}`}
              aria-label={`Ver imagen ${i + 1}`}
            >
              <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="relative aspect-[4/5] flex-1 overflow-hidden rounded-3xl bg-cream-200">
        <Image key={current.id} src={current.url} alt={current.alt || name} fill priority sizes="(min-width:1024px) 50vw, 100vw" className="object-cover animate-fade-in" />
      </div>
    </div>
  );
}
