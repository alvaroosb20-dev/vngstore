import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

export function stripe() {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("Falta STRIPE_SECRET_KEY en las variables de entorno");
    client = new Stripe(key, { typescript: true });
  }
  return client;
}
