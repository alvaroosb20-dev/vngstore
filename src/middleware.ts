import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // Refresca la sesión en cada petición
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const needsLogin =
    path.startsWith("/admin") || (path.startsWith("/cuenta") && !isPublicAccountPath(path));

  if (needsLogin && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/cuenta/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // La comprobación de rol de administrador se hace también en el layout de /admin (servidor).
  if (path.startsWith("/admin") && user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

function isPublicAccountPath(path: string) {
  return ["/cuenta/login", "/cuenta/registro", "/cuenta/recuperar", "/cuenta/nueva-contrasena"].some((p) =>
    path.startsWith(p),
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|products/|brand/|api/stripe/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)"],
};
