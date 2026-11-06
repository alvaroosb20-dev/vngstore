/**
 * Datos de la tienda y del titular.
 * ⚠️ Rellena los campos marcados como PENDIENTE antes de vender: aparecen en las páginas legales
 * y son obligatorios según la LSSI-CE y el RGPD.
 */
export const site = {
  name: "VNG Store",
  shortName: "VNG",
  tagline: "Trazo fino. Piezas para siempre.",
  description:
    "VNG Store: camisetas, tote bags y joyería de diseño minimalista. Envíos a toda España.",
  url: (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
  ).replace(/\/$/, ""),
  locale: "es_ES",

  owner: {
    legalName: "PENDIENTE: nombre o razón social",
    taxId: "PENDIENTE: NIF/CIF",
    address: "PENDIENTE: domicilio fiscal",
    email: "PENDIENTE: email de contacto",
    phone: "",
    registry: "", // Datos registrales si es sociedad (Registro Mercantil)
  },

  social: {
    instagram: "", // p. ej. "https://instagram.com/vngstore"
  },

  /** Plazo de desistimiento legal en días (mínimo 14 en la UE) */
  returnDays: 14,

  shipping: {
    carrier: "PENDIENTE: empresa de transporte",
    peninsulaDays: "PENDIENTE: plazo a Península y Baleares",
    canariasDays: "PENDIENTE: plazo a Canarias, Ceuta y Melilla",
    preparationDays: "PENDIENTE: días de preparación del pedido",
  },
};

export function isPending(value: string) {
  return value.startsWith("PENDIENTE");
}
