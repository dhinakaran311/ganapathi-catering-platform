// lib/audit/logger.ts — H60: Audit logging helper
//
// Uses the service-role (admin) client because audit_logs is a system-level
// table: writes must succeed regardless of the calling user's RLS grants, and
// the caller is already authenticated at the route layer. The row's user_id is
// passed in explicitly by the caller.
//
// Column mapping matches the audit_logs schema (009 + 018 metadata column):
//   user_id, action, table_name, record_id, old_data, new_data, metadata

import { createAdminClient } from '@/lib/supabase/admin';

type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE' | 'SETTINGS_UPDATED' | string;

interface AuditLogPayload {
  action: AuditAction;
  tableName: string;
  recordId: string | null;
  userId?: string | null;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Write a record to the audit_logs table.
 * Call this from Server Actions or API routes after any data mutation.
 * Fire-and-forget — never throws.
 */
export async function logAuditEvent(payload: AuditLogPayload): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from('audit_logs').insert({
      user_id: payload.userId ?? null,
      action: payload.action,
      table_name: payload.tableName,
      record_id: payload.recordId ?? null,
      old_data: payload.oldData ?? null,
      new_data: payload.newData ?? null,
      metadata: payload.metadata ?? null,
    });
  } catch (err) {
    // Never let audit logging break the main operation
    console.error('[audit] Failed to write audit log:', err);
  }
}
