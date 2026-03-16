import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: unknown) => {
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!stripeKey || !webhookSecret) {
    logStep("ERROR", "Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
    return new Response("Server misconfigured", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    logStep("Signature verification failed", { error: String(err) });
    return new Response("Invalid signature", { status: 400 });
  }

  logStep("Event received", { type: event.type, id: event.id });

  // Only handle checkout.session.completed for subscription mode
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.mode !== "subscription") {
      logStep("Skipping non-subscription checkout");
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    const customerEmail = session.customer_details?.email || session.customer_email;
    if (!customerEmail) {
      logStep("No customer email found in session");
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    logStep("Processing subscription checkout", { email: customerEmail });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find the subscriber's profile and check if they were referred
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, referred_by")
      .eq("email", customerEmail.toLowerCase())
      .single();

    if (profileError || !profile?.referred_by) {
      logStep("No referral found for subscriber", { email: customerEmail, error: profileError?.message });
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    logStep("Referral found", { subscriberId: profile.id, referrerId: profile.referred_by });

    // Check if reward already applied for this referral
    const { data: existingReferral } = await supabase
      .from("referrals")
      .select("id, reward_applied")
      .eq("referred_user_id", profile.id)
      .eq("referrer_user_id", profile.referred_by)
      .single();

    if (existingReferral?.reward_applied) {
      logStep("Reward already applied, skipping");
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    // Get referrer's email to find their Stripe customer
    const { data: referrerProfile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", profile.referred_by)
      .single();

    if (!referrerProfile?.email) {
      logStep("Referrer email not found");
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    logStep("Creating Stripe coupon for referrer", { referrerEmail: referrerProfile.email });

    try {
      // Create a 100% off coupon for 1 month
      const coupon = await stripe.coupons.create({
        percent_off: 100,
        duration: "once",
        name: `Referral-Belohnung: Gratismonat für Einladung von ${customerEmail}`,
        max_redemptions: 1,
      });

      logStep("Coupon created", { couponId: coupon.id });

      // Find referrer's Stripe customer
      const customers = await stripe.customers.list({
        email: referrerProfile.email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        const referrerCustomerId = customers.data[0].id;

        // Find active subscription
        const subs = await stripe.subscriptions.list({
          customer: referrerCustomerId,
          status: "active",
          limit: 1,
        });

        if (subs.data.length > 0) {
          // Apply the coupon to the referrer's subscription as a discount
          await stripe.subscriptions.update(subs.data[0].id, {
            coupon: coupon.id,
          });
          logStep("Coupon applied to referrer subscription", { subscriptionId: subs.data[0].id });
        } else {
          logStep("Referrer has no active subscription, coupon saved for later use");
        }
      } else {
        logStep("Referrer not yet a Stripe customer, coupon saved for later use");
      }

      // Update referral record in database
      const updateData = {
        reward_applied: true,
        reward_applied_at: new Date().toISOString(),
        reward_type: "free_month",
        stripe_coupon_id: coupon.id,
      };

      if (existingReferral) {
        await supabase
          .from("referrals")
          .update(updateData)
          .eq("id", existingReferral.id);
      } else {
        // Update by referrer + referred user match
        await supabase
          .from("referrals")
          .update(updateData)
          .eq("referred_user_id", profile.id)
          .eq("referrer_user_id", profile.referred_by);
      }

      logStep("Referral reward applied successfully");

      // Create notification for the referrer
      await supabase.from("notifications").insert({
        user_id: profile.referred_by,
        title: "Referral-Belohnung erhalten! 🎉",
        message: `${customerEmail} hat ein Abo abgeschlossen. Sie erhalten einen Gratismonat!`,
        type: "success",
        link: "/einstellungen?tab=billing",
      });

      logStep("Notification sent to referrer");
    } catch (stripeErr) {
      logStep("ERROR applying referral reward", { error: String(stripeErr) });
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
