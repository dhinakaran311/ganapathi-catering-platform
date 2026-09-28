// app/admin/page.tsx — Root /admin redirect to dashboard

import { redirect } from 'next/navigation';

export default function AdminRootPage() {
  redirect('/admin/dashboard');
}
