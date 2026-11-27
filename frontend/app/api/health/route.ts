// app/api/health/route.ts: Liveness probe for the hosting platform (Render's
// healthCheckPath). Deliberately touches nothing external (no Supabase call),
// so a database hiccup doesn't make Render restart a healthy container.
//
// /api/health?check=1: setup self-check for the owner, opened in a browser
// after a deploy ("are enquiries able to save?"). It reports only yes/no
// flags and the deployed commit: never a secret or its value: and makes
// read-only database calls (nothing is written).

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' };

const isSet = (v: string | undefined) => Boolean(v && v.trim());

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('check') !== '1') {
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  }

  const env = {
    NEXT_PUBLIC_SUPABASE_URL: isSet(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: isSet(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: isSet(process.env.SUPABASE_SERVICE_ROLE_KEY),
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || null, // public value
    RATE_LIMIT_SALT: isSet(process.env.RATE_LIMIT_SALT),
    CRON_SECRET: isSet(process.env.CRON_SECRET),
    INVOICE_LINK_SECRET: isSet(process.env.INVOICE_LINK_SECRET),
  };

  // Turnstile must be configured on both sides or not at all.
  const tsSite = isSet(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const tsSecret = isSet(process.env.TURNSTILE_SECRET_KEY);
  const turnstile = tsSite && tsSecret ? 'on' : !tsSite && !tsSecret ? 'off' : 'MISCONFIGURED';

  const problems: string[] = [];
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    problems.push('Supabase URL / anon key missing: set them and REDEPLOY (they are baked in at build time).');
  }
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    problems.push('SUPABASE_SERVICE_ROLE_KEY missing: enquiries cannot be saved.');
  }
  if (turnstile === 'MISCONFIGURED') {
    problems.push('Only one Turnstile key is set: set both NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY, or neither.');
  }
  if (!env.NEXT_PUBLIC_SITE_URL) {
    problems.push('NEXT_PUBLIC_SITE_URL missing: invoice / tracking links fall back to the request address.');
  } else {
    try {
      if (new URL(env.NEXT_PUBLIC_SITE_URL).host !== req.nextUrl.host) {
        problems.push(`NEXT_PUBLIC_SITE_URL is ${env.NEXT_PUBLIC_SITE_URL} but this site is ${req.nextUrl.origin}: links sent to customers will point to the wrong address. Fix it and redeploy.`);
      }
    } catch {
      problems.push('NEXT_PUBLIC_SITE_URL is not a valid URL.');
    }
  }

  // Read-only database checks with the service role (what /api/enquiries uses).
  let database: Record<string, string> = { status: 'skipped (keys missing)' };
  if (env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const started = Date.now();
    const enq = await db.from('enquiries').select('id', { count: 'exact', head: true });
    const latest = await db
      .from('enquiries')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const rl = await db.from('rate_limit_hits').select('bucket', { head: true, count: 'exact' });
    database = {
      status: enq.error ? `ERROR ${enq.error.code ?? ''} ${enq.error.message}` : 'ok',
      enquiries: enq.error ? '?' : String(enq.count ?? 0),
      latestEnquiry: latest.data?.created_at ?? 'none',
      responseMs: String(Date.now() - started),
      migration027: rl.error ? 'NOT applied (rate limiting off)' : 'applied',
    };
    if (enq.error) problems.push(`Database error: ${enq.error.message}: check the Supabase URL / service role key, or whether the project is paused.`);
  }

  return NextResponse.json(
    {
      ok: problems.length === 0,
      problems,
      commit: (process.env.RENDER_GIT_COMMIT ?? 'unknown').slice(0, 7),
      env,
      turnstile,
      database,
    },
    { headers: NO_STORE }
  );
}
