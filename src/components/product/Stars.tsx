import { StarIcon } from "@/components/icons";

export function Stars({ value, count, size = "h-3.5 w-3.5" }: { value: number; count?: number; size?: string }) {
  const rounded = Math.round(value);
  return (
    <div className="flex items-center gap-1.5" aria-label={`Valoración ${value.toFixed(1)} de 5`}>
      <div className="flex text-copper">
        {[1, 2, 3, 4, 5].map((i) => (
          <StarIcon key={i} className={size} filled={i <= rounded} />
        ))}
      </div>
      {count != null && <span className="text-xs text-espresso-500">({count})</span>}
    </div>
  );
}
