// components/admin/CompleteOrderButton.tsx
// Client wrapper that owns the open/close state for CompleteOrderModal.
// Rendered inside the server component enquiry detail page.

'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import CompleteOrderModal from './CompleteOrderModal';

interface CompleteOrderButtonProps {
  enquiryId:    string;
  customerName: string;
}

export default function CompleteOrderButton({ enquiryId, customerName }: CompleteOrderButtonProps) {
  const [open, setOpen]         = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  if (succeeded) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg font-body text-sm font-semibold text-green-800 bg-green-100 border border-green-200 min-h-[44px]">
        <CheckCircle2 size={18} className="text-green-700" />
        Order Completed
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-body text-sm font-semibold text-white bg-[var(--color-green-800)] hover:bg-[var(--color-green-900)] transition-colors min-h-[44px]"
      >
        <CheckCircle2 size={18} />
        Complete Order
      </button>

      {open && (
        <CompleteOrderModal
          enquiryId={enquiryId}
          customerName={customerName}
          onClose={() => setOpen(false)}
          onSuccess={() => {
            setOpen(false);
            setSucceeded(true);
          }}
        />
      )}
    </>
  );
}
