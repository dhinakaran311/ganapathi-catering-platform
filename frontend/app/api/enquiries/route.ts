// app/api/enquiries/route.ts
// Public endpoint — saves customer enquiry to Supabase enquiries table
// Called silently by Contact.tsx on every form submission
// Uses the SERVICE ROLE key (server-side only) to bypass RLS — safe because
// this is a Next.js API route, the key is never exposed to the browser.

import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    const name = (body.name ?? '').trim();
    const phone = (body.phone ?? '').trim();
    if (!name || !phone) {
      return NextResponse.json({ error: 'name and phone are required' }, { status: 400 });
    }

    // Parse guest_count into min/max
    let guest_count_min: number | null = null;
    let guest_count_max: number | null = null;
    const guests: string = body.guests ?? '';
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

    const enquiry = {
      name,
      phone,
      whatsapp: phone,
      event_type: body.event || null,
      event_date: body.eventDate || null,
      event_location: body.eventLocation || null,
      guest_count: guests || null,
      guest_count_min,
      guest_count_max,
      food_type: body.foodType || null,
      message: body.message || null,
      custom_items: body.customItems
        ? body.customItems.split(',').map((s: string) => s.trim()).filter(Boolean)
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, id: data.id, tracking_code: data.tracking_code },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[enquiries API] Unexpected error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
