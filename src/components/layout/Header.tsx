"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import { useCart } from "@/components/cart/CartProvider";
import { BagIcon, CloseIcon, MenuIcon, SearchIcon, UserIcon } from "@/components/icons";

interface Props {
  categories: { slug: string; name: string }[];
  loggedIn: boolean;
  isAdmin: boolean;
}

export function Header({ categories, loggedIn, isAdmin }: Props) {
  const { count, openDrawer, ready } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  const nav = [
    { href: "/tienda", label: "Tienda" },
    ...categories.map((c) => ({ href: `/tienda?categoria=${c.slug}`, label: c.name })),
    { href: "/tienda?orden=new", label: "Novedades" },
    { href: "/tienda?ofertas=1", label: "Ofertas" },
  ];

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/tienda?q=${encodeURIComponent(term)}` : "/tienda");
    setSearchOpen(false);
  }

  return (
    <>
      <div className="bg-espresso py-2 text-center text-[11px] uppercase tracking-[0.25em] text-cream-100">
        Pago 100% seguro · Envíos a toda España
      </div>
      <header
        className={`sticky top-0 z-40 transition-all duration-500 ${
          scrolled ? "border-b border-espresso/10 bg-cream-50/85 backdrop-blur-xl" : "bg-cream-50"
        }`}
      >
        <div className="container-x grid h-16 grid-cols-[1fr_auto_1fr] items-center sm:h-20">
          <div className="flex items-center gap-1">
            <button className="btn-ghost -ml-3 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Abrir menú">
              <MenuIcon />
            </button>
            <nav className="hidden items-center gap-7 lg:flex" aria-label="Principal">
              {nav.slice(0, 5).map((item) => (
                <Link key={item.href} href={item.href} className="link-underline text-[13px] tracking-wide text-espresso">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <Logo />

          <div className="flex items-center justify-end gap-0.5">
            <button className="btn-ghost" onClick={() => setSearchOpen((v) => !v)} aria-label="Buscar productos">
              <SearchIcon />
            </button>
            <Link href={loggedIn ? "/cuenta" : "/cuenta/login"} className="btn-ghost hidden sm:inline-flex" aria-label="Mi cuenta">
              <UserIcon />
            </Link>
            {isAdmin && (
              <Link href="/admin" className="btn-ghost hidden text-xs uppercase tracking-wider sm:inline-flex">
                Admin
              </Link>
            )}
            <button className="btn-ghost relative -mr-3" onClick={openDrawer} aria-label={`Carrito, ${count} artículos`}>
              <BagIcon />
              {ready && count > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-copper px-1 text-[10px] font-semibold text-white animate-fade-in">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-espresso/10 bg-cream-50 animate-fade-in">
            <form onSubmit={submitSearch} className="container-x flex items-center gap-3 py-4" role="search">
              <SearchIcon className="h-5 w-5 text-espresso-500" />
              <input
                ref={searchRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar camisetas, bolsos, joyería…"
                className="w-full bg-transparent text-lg text-espresso placeholder:text-espresso-300 focus:outline-none"
                aria-label="Buscar"
                maxLength={80}
              />
              <button type="submit" className="btn-primary px-5 py-2">Buscar</button>
            </form>
          </div>
        )}
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-ink/40 animate-fade-in" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-cream-50 p-6 shadow-2xl animate-fade-up">
            <div className="flex items-center justify-between">
              <Logo size="sm" />
              <button className="btn-ghost -mr-3" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú">
                <CloseIcon />
              </button>
            </div>
            <nav className="mt-10 flex flex-col gap-1" aria-label="Móvil">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className="border-b border-espresso/10 py-4 font-serif text-2xl text-espresso">
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-3 pt-8">
              <Link href={loggedIn ? "/cuenta" : "/cuenta/login"} className="btn-outline">
                <UserIcon /> {loggedIn ? "Mi cuenta" : "Iniciar sesión"}
              </Link>
              {isAdmin && (
                <Link href="/admin" className="btn-primary">
                  Panel de administración
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
