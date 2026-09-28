// app/admin/audit-logs/page.tsx — H60: Audit log viewer

import { createClient } from '@/lib/supabase/server';

export default async function AuditLogsPage() {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from('audit_logs')
    .select('id, action, table_name, record_id, user_email, created_at, changes')
    .order('created_at', { ascending: false })
    .limit(100);

  const actionColors: Record<string, string> = {
    INSERT: 'bg-green-100 text-green-800',
    UPDATE: 'bg-yellow-100 text-yellow-800',
    DELETE: 'bg-red-100 text-red-800',
  };

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
                (logs as any[]).map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--color-ivory-100)] transition-colors">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded font-body text-xs font-bold ${
                          actionColors[log.action] ?? 'bg-gray-100 text-gray-800'
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
    </div>
  );
}
