import { NextResponse } from 'next/server';
import { billingPlans } from '@/lib/billing';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const planId = String(body.planId || 'pro');
    const plan = billingPlans.find((item) => item.id === planId);

    if (!plan) {
      return NextResponse.json({ error: 'Unknown billing plan.' }, { status: 400 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeKey) {
      return NextResponse.json({
        source: 'mock',
        checkoutUrl: `/store?plan=${plan.id}&checkout=mock`,
        plan,
      });
    }

    // Production integration point:
    // Replace this mock response with a Stripe Checkout Session create call.
    return NextResponse.json({
      source: 'stripe-ready',
      checkoutUrl: `/store?plan=${plan.id}&checkout=configure-stripe`,
      plan,
    });
  } catch {
    return NextResponse.json({ error: 'Checkout creation failed.' }, { status: 500 });
  }
}
