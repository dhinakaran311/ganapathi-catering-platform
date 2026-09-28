// lib/audit/logger.ts — H60: Audit logging middleware helper

import { createClient } from '@/lib/supabase/server';

type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE';

interface AuditLogPayload {
  action: AuditAction;
  tableName: string;
  recordId: string;
  changes?: Record<string, unknown>;
  userEmail?: string;
}

/**
 * Write a record to the audit_logs table.
 * Call this from Server Actions or API routes after any data mutation.
 * Fire-and-forget — never throws.
 */
export async function logAuditEvent(payload: AuditLogPayload): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from('audit_logs').insert({
      action: payload.action,
      table_name: payload.tableName,
      record_id: payload.recordId,
      changes: payload.changes ?? null,
      user_email: payload.userEmail ?? null,
    });
  } catch (err) {
    // Never let audit logging break the main operation
    console.error('[audit] Failed to write audit log:', err);
  }
}
