// app/api/admin/staff/route.ts — Staff profile management (OWNER only for writes)
// GET  — list all staff profiles (VIEWER+)
// POST — invite/create a staff profile (OWNER only)
// PATCH — update role or name (OWNER only)
// DELETE — deactivate staff (OWNER only)

import { createAdminClient } from '@/lib/supabase/admin';
import { requireMinRole, requireAnyRole } from '@/lib/auth/roles';
import { NextRequest, NextResponse } from 'next/server';
import type { StaffRole } from '@/types/staff';

const VALID_ROLES: StaffRole[] = ['OWNER', 'ADMIN', 'STAFF', 'VIEWER'];

/* ── GET — list all staff ───────────────────────────────────────────────── */
export async function GET() {
  const auth = await requireMinRole('VIEWER');
  if (auth instanceof NextResponse) return auth;

  const supabase = createAdminClient();

  // Join staff_profiles with auth.users to get email
  const { data: profiles, error } = await supabase
    .from('staff_profiles')
    .select('id, user_id, role, full_name, is_active, created_at, updated_at')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get emails for staff profiles
  const { data: authUsers } = await supabase.auth.admin.listUsers();

  const emailMap: Record<string, string> = {};
  authUsers?.users?.forEach((u) => {
    emailMap[u.id] = u.email ?? '';
  });

  const enriched = profiles?.map((p) => ({
    ...p,
    email: emailMap[p.user_id] ?? null,
  }));

  return NextResponse.json(enriched);
}

/* ── POST — create staff profile ────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const auth = await requireAnyRole('OWNER');
  if (auth instanceof NextResponse) return auth;

  const supabase = createAdminClient();
  const body = await req.json();

  const { email, role, full_name } = body;

  if (!email || !role) {
    return NextResponse.json({ error: 'email and role are required' }, { status: 400 });
  }

  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` }, { status: 400 });
  }

  // OWNER protection: only existing OWNER can promote to OWNER
  // (redundant here since only OWNER can reach this endpoint, but explicit is better)
  if (role === 'OWNER' && auth.role !== 'OWNER') {
    return NextResponse.json({ error: 'Only OWNER can create another OWNER' }, { status: 403 });
  }

  // Find auth user by email
  const { data: userList } = await supabase.auth.admin.listUsers();
  const targetUser = userList?.users?.find((u) => u.email === email);

  if (!targetUser) {
    return NextResponse.json(
      { error: 'No Supabase auth account found for that email. User must sign up first.' },
      { status: 404 }
    );
  }

  // Check if profile already exists
  const { data: existing } = await supabase
    .from('staff_profiles')
    .select('id, role')
    .eq('user_id', targetUser.id)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: 'Staff profile already exists for this user. Use PATCH to update.' },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from('staff_profiles')
    .insert({ user_id: targetUser.id, role, full_name: full_name ?? null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit
  await supabase.from('audit_logs').insert({
    user_id: auth.user.id,
    action: 'ROLE_CHANGED',
    table_name: 'staff_profiles',
    record_id: data.id,
    old_data: null,
    new_data: { role, email, full_name },
    metadata: { action: 'profile_created', target_email: email },
  });

  return NextResponse.json(data, { status: 201 });
}

/* ── PATCH — update role / name ─────────────────────────────────────────── */
export async function PATCH(req: NextRequest) {
  const auth = await requireAnyRole('OWNER');
  if (auth instanceof NextResponse) return auth;

  const supabase = createAdminClient();
  const body = await req.json();
  const { profile_id, role, full_name, is_active } = body;

  if (!profile_id) {
    return NextResponse.json({ error: 'profile_id is required' }, { status: 400 });
  }

  // Fetch current profile for audit + protection
  const { data: current, error: fetchErr } = await supabase
    .from('staff_profiles')
    .select('*')
    .eq('id', profile_id)
    .single();

  if (fetchErr || !current) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  // OWNER protection: cannot demote the last OWNER
  if (current.role === 'OWNER' && role && role !== 'OWNER') {
    const { count } = await supabase
      .from('staff_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'OWNER')
      .eq('is_active', true);

    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: 'Cannot demote the last OWNER. Promote another user first.' },
        { status: 422 }
      );
    }
  }

  // OWNER protection: cannot promote to OWNER if caller is not OWNER
  if (role === 'OWNER' && auth.role !== 'OWNER') {
    return NextResponse.json({ error: 'Only OWNER can promote to OWNER' }, { status: 403 });
  }

  const patch: Record<string, unknown> = {};
  if (role !== undefined)       patch.role      = role;
  if (full_name !== undefined)  patch.full_name = full_name;
  if (is_active !== undefined)  patch.is_active = is_active;

  const { data, error } = await supabase
    .from('staff_profiles')
    .update(patch)
    .eq('id', profile_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit role change
  if (role && role !== current.role) {
    await supabase.from('audit_logs').insert({
      user_id: auth.user.id,
      action: 'ROLE_CHANGED',
      table_name: 'staff_profiles',
      record_id: profile_id,
      old_data: { role: current.role },
      new_data: { role },
      metadata: { changed_by: auth.user.email, target_user_id: current.user_id },
    });
  }

  return NextResponse.json(data);
}
