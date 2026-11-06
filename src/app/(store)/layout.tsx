import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CookieBanner } from "@/components/CookieBanner";
import { getCategories } from "@/lib/catalog";
import { getProfile } from "@/lib/auth";
import { missingEnv } from "@/lib/config";
import { SetupNotice } from "@/components/SetupNotice";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const missing = missingEnv();
  if (missing.length) return <SetupNotice missing={missing} />;
  const [categories, profile] = await Promise.all([getCategories(), getProfile()]);
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-espresso focus:px-4 focus:py-2 focus:text-cream-50">
        Saltar al contenido
      </a>
      <Header
        categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
        loggedIn={!!profile}
        isAdmin={profile?.role === "admin"}
      />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <CookieBanner />
    </>
  );
}
