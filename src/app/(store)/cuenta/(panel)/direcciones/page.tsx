import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { deleteAddress } from "@/app/actions/account";
import type { Address } from "@/lib/types";
import { EditAddress, NewAddress } from "./AddressForm";

export const metadata: Metadata = { title: "Mis direcciones", robots: { index: false } };

export default async function AddressesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user?.id ?? "")
    .order("is_default", { ascending: false })
    .order("created_at");
  const addresses = (data ?? []) as Address[];

  return (
    <div className="space-y-6">
      <h2 className="font-serif text-2xl text-espresso">Direcciones de envío</h2>
      <p className="text-sm text-espresso-500">Tu dirección principal aparecerá precargada en el pago seguro de Stripe.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {addresses.map((a) => (
          <div key={a.id} className="card flex flex-wrap gap-x-4 p-6 text-sm text-espresso-700">
            <div className="flex-1">
              {a.is_default && <p className="eyebrow mb-2">Principal</p>}
              <p className="font-medium text-espresso">{a.full_name}</p>
              <p>{a.line1}</p>
              {a.line2 && <p>{a.line2}</p>}
              <p>{a.postal_code} {a.city}, {a.province}</p>
              {a.phone && <p>{a.phone}</p>}
            </div>
            <div className="flex items-start gap-4">
              <EditAddress address={a} />
              <form action={deleteAddress}>
                <input type="hidden" name="id" value={a.id} />
                <button className="text-sm text-rose-700 underline underline-offset-2">Eliminar</button>
              </form>
            </div>
          </div>
        ))}
      </div>
      <NewAddress />
    </div>
  );
}
