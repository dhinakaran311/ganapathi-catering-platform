// app/api/admin/settings/theme/route.ts
// A4: Persist theme customisation. OWNER/ADMIN only. Writes the single
// theme_settings row (creates it if missing) and records an audit event.

import { createAdminClient } from '@/lib/supabase/admin';
import { requireAnyRole } from '@/lib/auth/roles';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a 6-digit hex colour');

const themeSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  primary_color: hexColor,
  secondary_color: hexColor,
  accent_color: hexColor,
  font_heading: z.string().trim().min(1).max(60),
  font_body: z.string().trim().min(1).max(60),
  logo_url: z.string().trim().max(300).nullable().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAnyRole('OWNER', 'ADMIN');
  if (auth instanceof NextResponse) return auth;

  const raw = await req.json();
  const parsed = themeSchema.safeParse(raw);
  if (!parsed.success) {
    const details: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.') || '_';
      if (!details[key]) details[key] = issue.message;
    }
    return NextResponse.json({ error: 'Validation failed', details }, { status: 422 });
  }

  const body = parsed.data;
  const supabase = createAdminClient();

  // Find the existing row (there is only one in practice).
  const { data: existing } = await supabase
    .from('theme_settings')
    .select('id')
    .limit(1)
    .maybeSingle();

  const payload = {
    primary_color: body.primary_color,
    secondary_color: body.secondary_color,
    accent_color: body.accent_color,
    font_heading: body.font_heading,
    font_body: body.font_body,
    logo_url: body.logo_url ?? null,
  };

  let savedId: string | null = existing?.id ?? null;

  if (savedId) {
    const { data, error } = await supabase
      .from('theme_settings')
      .update(payload)
      .eq('id', savedId)
      .select('id')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    savedId = data.id;
  } else {
    const { data, error } = await supabase
      .from('theme_settings')
      .insert(payload)
      .select('id')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    savedId = data.id;
  }

  await supabase.from('audit_logs').insert({
    user_id: auth.user.id,
    action: 'SETTINGS_UPDATED',
    table_name: 'theme_settings',
    record_id: savedId,
    new_data: payload,
    metadata: { scope: 'theme' },
  });

  return NextResponse.json({ success: true, id: savedId });
}
