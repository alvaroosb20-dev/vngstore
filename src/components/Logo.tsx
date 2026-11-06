import Link from "next/link";

export function Logo({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const big = size === "lg" ? "text-6xl" : size === "sm" ? "text-2xl" : "text-[28px]";
  const small = size === "lg" ? "text-sm" : "text-[8px]";
  return (
    <Link href="/" aria-label="VNG Store — inicio" className={`group inline-flex flex-col items-center leading-none ${className}`}>
      <span className={`font-serif font-semibold tracking-[0.04em] text-espresso ${big}`}>VNG</span>
      <span className={`mt-0.5 flex items-center gap-1.5 font-serif italic tracking-[0.35em] text-copper ${small}`}>
        <span className="h-px w-3 bg-copper" />
        STORE
        <span className="h-px w-3 bg-copper" />
      </span>
    </Link>
  );
}
