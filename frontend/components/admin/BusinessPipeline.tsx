// components/admin/BusinessPipeline.tsx
// Visual CRM pipeline showing the enquiry lifecycle with current stage highlighted.
// CANCELLED is shown separately as it can happen at any stage.

'use client';

import { CheckCircle2, Circle, XCircle } from 'lucide-react';
import type { EnquiryStatus } from '@/types/enquiry';

const PIPELINE_STAGES: { status: EnquiryStatus; label: string }[] = [
  { status: 'NEW',        label: 'New' },
  { status: 'CONTACTED',  label: 'Contacted' },
  { status: 'DISCUSSION', label: 'Discussion' },
  { status: 'QUOTE_SENT', label: 'Quote Sent' },
  { status: 'FOLLOW_UP',  label: 'Follow Up' },
  { status: 'CONFIRMED',  label: 'Confirmed' },
  { status: 'COMPLETED',  label: 'Completed' },
];

interface BusinessPipelineProps {
  currentStatus: EnquiryStatus;
}

export default function BusinessPipeline({ currentStatus }: BusinessPipelineProps) {
  const isCancelled = currentStatus === 'CANCELLED';
  const currentIdx  = PIPELINE_STAGES.findIndex((s) => s.status === currentStatus);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-body text-xs font-semibold uppercase tracking-wide text-[var(--color-brown-400)]">
          Business Pipeline
        </h3>
        {isCancelled && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200 font-body text-xs font-semibold">
            <XCircle size={12} /> Cancelled
          </span>
        )}
      </div>

      {/* Desktop: horizontal stepper */}
      <div className="hidden sm:flex items-center w-full overflow-x-auto gap-0 pb-1">
        {PIPELINE_STAGES.map((stage, idx) => {
          const isPast    = !isCancelled && idx < currentIdx;
          const isCurrent = !isCancelled && idx === currentIdx;

          return (
            <div key={stage.status} className="flex items-center flex-1 min-w-0">
              {/* Step */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCurrent
                      ? 'border-[var(--color-green-700)] bg-[var(--color-green-700)] text-white'
                      : isPast
                      ? 'border-[var(--color-green-600)] bg-[var(--color-green-100)] text-[var(--color-green-700)]'
                      : isCancelled
                      ? 'border-red-300 bg-red-50 text-red-400'
                      : 'border-[var(--color-ivory-400)] bg-[var(--color-ivory-100)] text-[var(--color-brown-300)]'
                  }`}
                >
                  {isPast ? (
                    <CheckCircle2 size={14} />
                  ) : isCancelled ? (
                    <XCircle size={14} />
                  ) : (
                    <Circle size={14} className={isCurrent ? 'fill-white' : ''} />
                  )}
                </div>
                <span
                  className={`mt-1 font-body text-[10px] font-medium whitespace-nowrap ${
                    isCurrent
                      ? 'text-[var(--color-green-800)] font-bold'
                      : isPast
                      ? 'text-[var(--color-green-600)]'
                      : 'text-[var(--color-brown-400)]'
                  }`}
                >
                  {stage.label}
                </span>
              </div>

              {/* Connector line (not after last) */}
              {idx < PIPELINE_STAGES.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 ${
                    isPast
                      ? 'bg-[var(--color-green-400)]'
                      : isCancelled
                      ? 'bg-red-200'
                      : 'bg-[var(--color-ivory-300)]'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: compact badge row */}
      <div className="sm:hidden flex flex-wrap gap-1.5 mt-1">
        {PIPELINE_STAGES.map((stage, idx) => {
          const isPast    = !isCancelled && idx < currentIdx;
          const isCurrent = !isCancelled && idx === currentIdx;
          return (
            <span
              key={stage.status}
              className={`px-2 py-0.5 rounded-full font-body text-[10px] font-semibold border ${
                isCurrent
                  ? 'bg-[var(--color-green-700)] text-white border-[var(--color-green-700)]'
                  : isPast
                  ? 'bg-[var(--color-green-100)] text-[var(--color-green-700)] border-[var(--color-green-200)]'
                  : 'bg-[var(--color-ivory-100)] text-[var(--color-brown-400)] border-[var(--color-ivory-300)]'
              }`}
            >
              {isPast ? '✓ ' : ''}{stage.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
