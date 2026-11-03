// app/api/reviews/route.ts
// J71: Public review submission.
//
// Anyone can submit a review; it is stored with is_approved = false and only
// appears on the public site after an admin approves it (see
// app/admin/reviews). Input is Zod-validated; rate/length are capped.

// Spam protection: honeypot, Turnstile (when configured), 3 reviews per IP per
// hour (DB-backed). See lib/security.

import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { reviewSchema } from '@/lib/validation';
import { getClientIp, hashIdentifier, isHoneypotTripped } from '@/lib/security/request';
import { checkRateLimits } from '@/lib/security/rate-limit';
import { verifyTurnstile } from '@/lib/security/turnstile';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Honeypot: pretend success, save nothing.
    if (isHoneypotTripped(body?.website)) {
      return NextResponse.json({ success: true }, { status: 201 });
    }

    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      const details: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || '_';
        if (!details[key]) details[key] = issue.message;
      }
      return NextResponse.json({ error: 'Validation failed', details }, { status: 422 });
    }

    const input = parsed.data;
    const ip = getClientIp(req);

    if (!(await verifyTurnstile(input.turnstileToken, ip))) {
      return NextResponse.json(
        { error: 'Verification failed. Please refresh the page and try again.' },
        { status: 403 }
      );
    }

    const allowed = await checkRateLimits([
      { bucket: `review:ip:${hashIdentifier(ip)}`, limit: 3, windowSeconds: 3600 },
    ]);
    if (!allowed) {
      return NextResponse.json(
        { error: 'You have submitted several reviews recently. Please try again later.' },
        { status: 429 }
      );
    }

    const supabase = createAdminClient();

    // Store the submitted text in BOTH language fields: the reviewer wrote it
    // in whatever language they chose; showing it verbatim on the public site
    // is correct regardless of locale. Admin can later split into review_ta /
    // review_en if they want a translated variant.
    const { error } = await supabase.from('reviews').insert({
      customer_name: input.customer_name,
      customer_phone: input.customer_phone || null,
      event_type: input.event_type || null,
      rating: input.rating,
      review_ta: input.review,
      review_en: input.review,
      is_approved: false, // pending moderation
    });

    if (error) {
      console.error('[reviews API] insert error:', error.message);
      return NextResponse.json({ error: 'Could not save review' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: unknown) {
    console.error('[reviews API] Unexpected error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
