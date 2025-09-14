import { Request, Response } from "express";
import Stripe from "stripe";
import { findTenantBySlug } from "../data/store";

const stripeSecret = process.env.STRIPE_SECRET || "";
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: "2024-06-20" }) : null;

export const getStripeConfig = (_req: Request, res: Response) => {
  const publishableKey = process.env.STRIPE_PUBLISHABLE || "";
  const paymentLinkBasic = process.env.STRIPE_LINK_BASIC || null;
  const paymentLinkPro = process.env.STRIPE_LINK_PRO || null;
  return res.json({ publishableKey: publishableKey || null, enabled: Boolean(stripe), paymentLinkBasic, paymentLinkPro });
};

export const createCheckout: any = async (req: Request, res: Response) => {
  try {
    const { plan, tenantSlug } = req.body as { plan: string; tenantSlug: string };
    const tenant = findTenantBySlug(tenantSlug);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const success_url = `${baseUrl}/app?checkout=success`;
    const cancel_url = `${baseUrl}/app?checkout=cancel`;

    if (!stripe) {
      return res.json({ url: null, message: "Stripe not configured" });
    }

    // Simple one-time payment checkout for Pro (test mode)
    const priceInCents = plan === "pro" ? 500 : 0; // $5 test
    if (priceInCents <= 0) {
      return res.json({ url: null, message: "No payment needed" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Notes ${plan.toUpperCase()} Plan` },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      success_url,
      cancel_url,
    });

    return res.json({ url: session.url });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || "Stripe error" });
  }
};
