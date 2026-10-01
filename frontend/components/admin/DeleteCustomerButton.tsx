'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DeleteCustomerButton({ id, name }: { id: string; name: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete the customer "${name}"?\n\nTheir enquiries will remain in the system but will no longer be linked to this profile.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/customers?id=${id}`, {
        method: 'DELETE',
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to delete');
      
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Error deleting customer');
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-2 text-[var(--color-brown-400)] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
      title="Delete Customer"
    >
      <Trash2 size={16} />
    </button>
  );
}
