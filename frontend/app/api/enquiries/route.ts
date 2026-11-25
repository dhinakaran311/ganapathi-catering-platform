// app/api/enquiries/route.ts
// Public endpoint — saves customer enquiry to Supabase enquiries table
// Called silently by Contact.tsx on every form submission
// Uses the SERVICE ROLE key (server-side only) to bypass RLS — safe because
// this is a Next.js API route, the key is never exposed to the browser.
//
// Input is validated with Zod (lib/validation.ts). Malformed payloads return
// 422 with field-level error details; the WhatsApp flow on the client is
// fire-and-forget so a validation failure never blocks the customer.

//
// Spam protection (Phase 1):
//   • Honeypot: a hidden `website` field — if filled, we pretend success and
//     save nothing (bots don't learn they were caught).
//   • Rate limit: 5 per IP per 10 min, 3 per phone per hour (DB-backed).
//   • Cloudflare Turnstile: enforced only when TURNSTILE_SECRET_KEY is set.
// Errors returned to the browser are generic; details go to the server log.

import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { enquirySchema } from '@/lib/validation';
import { getClientIp, hashIdentifier, isHoneypotTripped } from '@/lib/security/request';
import { checkRateLimits } from '@/lib/security/rate-limit';
import { verifyTurnstile } from '@/lib/security/turnstile';
import { normalizeIndianPhone, legacyPhoneForms } from '@/lib/phone';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ── Honeypot ──────────────────────────────────────────────────────────
    if (isHoneypotTripped(body?.website)) {
      return NextResponse.json({ success: true }, { status: 201 });
    }

    // ── Validate with Zod ──────────────────────────────────────────────────
    const parsed = enquirySchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || '_';
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      return NextResponse.json(
        { error: 'Validation failed', details: fieldErrors },
        { status: 422 }
      );
    }

    const input = parsed.data;
    const name = input.name;
    const phone = input.phone;
    const ip = getClientIp(req);

    // ── Bot check (only when Turnstile keys are configured) ──────────────
    if (!(await verifyTurnstile(input.turnstileToken, ip))) {
      return NextResponse.json(
        { error: 'Verification failed. Please refresh the page and try again.' },
        { status: 403 }
      );
    }

    // ── Rate limit ────────────────────────────────────────────────────────
    const allowed = await checkRateLimits([
      { bucket: `enquiry:ip:${hashIdentifier(ip)}`, limit: 5, windowSeconds: 600 },
      { bucket: `enquiry:phone:${hashIdentifier(phone.replace(/\D/g, '').slice(-10))}`, limit: 3, windowSeconds: 3600 },
    ]);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many enquiries. Please wait a little or message us on WhatsApp.' },
        { status: 429 }
      );
    }

    // Parse guest_count into min/max
    let guest_count_min: number | null = null;
    let guest_count_max: number | null = null;
    const guests: string = input.guests ?? '';
    if (guests.includes('-')) {
      const [lo, hi] = guests.split('-').map((s: string) => parseInt(s.trim(), 10));
      guest_count_min = isNaN(lo) ? null : lo;
      guest_count_max = isNaN(hi) ? null : hi;
    } else if (guests === '500+') {
      guest_count_min = 500;
      guest_count_max = null;
    }

    // Use admin client (service role) to bypass RLS — this is a server-side route
    const supabase = createAdminClient();

    // AUTO-CREATE OR LINK CUSTOMER
    // Phone is canonicalised to its last 10 digits so "+91 98765 43210" and
    // "9876543210" are one customer. Legacy formats saved before migration
    // 028 are still matched. total_orders is NOT touched here any more — it
    // counts COMPLETED orders and is maintained by a DB trigger (028).
    const cleanPhone = normalizeIndianPhone(phone);
    let customerId: string | null = null;

    if (cleanPhone) {
      const findExisting = async () => {
        const { data } = await supabase
          .from('customers')
          .select('id')
          .in('phone', legacyPhoneForms(cleanPhone))
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        return data?.id ?? null;
      };

      customerId = await findExisting();

      if (!customerId) {
        const { data: newCustomer, error: insertErr } = await supabase
          .from('customers')
          .insert({ name, phone: cleanPhone, total_orders: 0 })
          .select('id')
          .single();

        // Unique-phone race (two submissions at once): use the winner's row.
        customerId = newCustomer?.id ?? (insertErr ? await findExisting() : null);
      }
    }

    const enquiry = {
      name,
      phone,
      whatsapp: phone,
      customer_id: customerId,
      event_type: input.event || null,
      event_date: input.eventDate || null,
      event_location: input.eventLocation || null,
      guest_count: guests || null,
      guest_count_min,
      guest_count_max,
      food_type: input.foodType || null,
      message: input.message || null,
      custom_items: input.customItems
        ? input.customItems.split(',').map((s: string) => s.trim()).filter(Boolean)
        : null,
      status: 'NEW',
      source: 'form',
    };

    const { data, error } = await supabase
      .from('enquiries')
      .insert(enquiry)
      .select('id, tracking_code')
      .single();

    if (error) {
      console.error('[enquiries API] Supabase insert error:', error.message);
      return NextResponse.json({ error: 'Could not save enquiry' }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, id: data.id, tracking_code: data.tracking_code },
      { status: 201 }
    );
  } catch (err: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.error('[enquiries API] Unexpected error:', (err as any)?.message ?? err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
