// app/admin/audit-logs/page.tsx — H60: Audit log viewer

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Pagination from '@/components/admin/Pagination';
import { pageRange, parsePage } from '@/lib/admin/pagination';

const PAGE_SIZE = 50;

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = parsePage((await searchParams).page);
  const [from, to] = pageRange(page, PAGE_SIZE);
  const supabase = await createClient();

  // audit_logs columns are user_id / old_data / new_data / metadata (009 +
  // 018). The page previously selected non-existent user_email / changes
  // columns, so the query failed and the list was always empty.
  const { data: rows, count: totalLogs } = await supabase
    .from('audit_logs')
    .select('id, action, table_name, record_id, user_id, created_at, old_data, new_data, metadata', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  // Resolve user ids → emails for display (server-side, service role).
  const userIds = [...new Set((rows ?? []).map((r) => r.user_id).filter(Boolean))];
  const emailById: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: users } = await createAdminClient().auth.admin.listUsers({ perPage: 1000 });
    users?.users?.forEach((u) => { emailById[u.id] = u.email ?? ''; });
  }

  const logs = (rows ?? []).map((r) => {
    const changes =
      r.old_data || r.new_data || r.metadata
        ? {
            ...(r.old_data ? { before: r.old_data } : {}),
            ...(r.new_data ? { after: r.new_data } : {}),
            ...(r.metadata ? { details: r.metadata } : {}),
          }
        : null;
    return { ...r, user_email: r.user_id ? emailById[r.user_id] || r.user_id.slice(0, 8) : null, changes };
  });

  const actionColors: Record<string, string> = {
    INSERT: 'bg-green-100 text-green-800',
    UPDATE: 'bg-yellow-100 text-yellow-800',
    DELETE: 'bg-red-100 text-red-800',
  };
  // Descriptive actions (INVOICE_CREATED, PAYMENT_REJECTED, …) by keyword.
  const colorFor = (action: string) =>
    actionColors[action] ??
    (/DELETE|CANCEL|REJECT/.test(action)
      ? actionColors.DELETE
      : /CREATE|INSERT|VERIFIED|COMPLETED/.test(action)
        ? actionColors.INSERT
        : actionColors.UPDATE);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-brown-900)] mb-1">
          Audit Logs
        </h1>
        <p className="font-body text-sm text-[var(--color-brown-500)]">
          Record of all admin actions — inserts, updates, and deletes
        </p>
      </div>

      <div className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" aria-label="Audit logs">
            <thead className="bg-[var(--color-ivory-100)] border-b border-[var(--color-ivory-300)]">
              <tr>
                {['Action', 'Table', 'Record ID', 'User', 'Timestamp', 'Changes'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 font-body text-xs font-semibold uppercase tracking-wide text-[var(--color-brown-500)]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-ivory-200)]">
              {!logs || logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center font-body text-sm text-[var(--color-brown-400)]">
                    No audit logs yet.
                  </td>
                </tr>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (logs as any[]).map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--color-ivory-100)] transition-colors">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded font-body text-xs font-bold ${
                          colorFor(log.action)
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-body text-sm font-mono text-[var(--color-brown-700)]">
                      {log.table_name}
                    </td>
                    <td className="px-4 py-3 font-body text-xs font-mono text-[var(--color-brown-500)]">
                      {log.record_id?.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-[var(--color-brown-600)]">
                      {log.user_email ?? 'system'}
                    </td>
                    <td className="px-4 py-3 font-body text-xs text-[var(--color-brown-500)]">
                      {new Date(log.created_at).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      {log.changes ? (
                        <details className="cursor-pointer">
                          <summary className="font-body text-xs text-[var(--color-green-700)] hover:text-[var(--color-green-900)]">
                            View changes
                          </summary>
                          <pre className="mt-2 text-[10px] font-mono text-[var(--color-brown-700)] bg-[var(--color-ivory-100)] rounded p-2 max-w-xs overflow-auto">
                            {JSON.stringify(log.changes, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span className="font-body text-xs text-[var(--color-brown-400)]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} pageSize={PAGE_SIZE} total={totalLogs ?? 0} basePath="/admin/audit-logs" />
    </div>
  );
}
