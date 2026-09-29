'use client';

// components/admin/InvoiceBuilder.tsx — Phase 5: Full Invoice Generator
// Admin fills in this form → previews the invoice → saves to DB → sends via WhatsApp

import { useState, useCallback, useId } from 'react';
import { Plus, Trash2, MessageCircle, Save, FileText, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import type { InvoiceLineItem, InvoiceData, PaymentMethod } from '@/types/invoice';

/* ───────────────────────────── helpers ───────────────────────────── */
const uid = () => Math.random().toString(36).slice(2, 9);
const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const CATEGORY_LABELS: Record<InvoiceLineItem['category'], string> = {
  food: '🍛 Food',
  delivery: '🚚 Delivery',
  service: '⚙️ Service',
  extra: '➕ Extra',
  discount: '🏷️ Discount',
};

const PRESET_ITEMS: Partial<InvoiceLineItem>[] = [
  { description: 'Full Meals (Veg)', category: 'food', unit: 'person', unitPrice: 130 },
  { description: 'Full Meals (Non-Veg)', category: 'food', unit: 'person', unitPrice: 160 },
  { description: 'Basic Meal (Veg)', category: 'food', unit: 'person', unitPrice: 90 },
  { description: 'Breakfast Tiffin', category: 'food', unit: 'person', unitPrice: 50 },
  { description: 'Country Chicken Curry', category: 'food', unit: 'plate', unitPrice: 120 },
  { description: 'Chettinad Chicken Gravy', category: 'food', unit: 'plate', unitPrice: 150 },
  { description: 'Delivery Charge', category: 'delivery', unit: 'trip', unitPrice: 0 },
  { description: 'Serving Staff (per person/day)', category: 'service', unit: 'person', unitPrice: 500 },
  { description: 'Banana Leaf Setup', category: 'extra', unit: 'set', unitPrice: 200 },
  { description: 'Loyal Customer Discount', category: 'discount', unit: 'flat', unitPrice: 0 },
];

function emptyItem(): InvoiceLineItem {
  return { id: uid(), description: '', category: 'food', qty: 1, unit: 'person', unitPrice: 0, total: 0 };
}

/* ───────────────────────────── types ───────────────────────────── */
interface Props {
  enquiryId: string;
  defaultData?: Partial<InvoiceData>;
  existingInvoiceId?: string;
  onSaved?: (invoiceId: string, invoiceNumber: string) => void;
}

/* ───────────────────────────── component ───────────────────────────── */
export default function InvoiceBuilder({ enquiryId, defaultData, existingInvoiceId, onSaved }: Props) {
  const formId = useId();

  /* ── state ── */
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [savedInvoiceId, setSavedInvoiceId] = useState(existingInvoiceId ?? '');
  const [savedInvoiceNumber, setSavedInvoiceNumber] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const [customerName, setCustomerName] = useState(defaultData?.customerName ?? '');
  const [customerPhone, setCustomerPhone] = useState(defaultData?.customerPhone ?? '');
  const [customerAddress, setCustomerAddress] = useState(defaultData?.customerAddress ?? '');
  const [eventType, setEventType] = useState(defaultData?.eventType ?? '');
  const [eventDate, setEventDate] = useState(defaultData?.eventDate ?? '');
  const [eventLocation, setEventLocation] = useState(defaultData?.eventLocation ?? '');
  const [guestCount, setGuestCount] = useState(defaultData?.guestCount ?? '');
  const [foodType, setFoodType] = useState(defaultData?.foodType ?? '');
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(
    defaultData?.lineItems?.length ? defaultData.lineItems : [emptyItem()]
  );
  const [deliveryCharge, setDeliveryCharge] = useState(defaultData?.deliveryCharge ?? 0);
  const [discountAmount, setDiscountAmount] = useState(defaultData?.discountAmount ?? 0);
  const [discountNote, setDiscountNote] = useState(defaultData?.discountNote ?? '');
  const [taxRate, setTaxRate] = useState(defaultData?.taxRate ?? 0);
  const [advancePaid, setAdvancePaid] = useState(defaultData?.advancePaid ?? 0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>(defaultData?.paymentMethod ?? '');
  const [upiId, setUpiId] = useState(defaultData?.upiId ?? 'shanthishanthi2772@okaxis');
  const [bankDetails, setBankDetails] = useState(
    defaultData?.bankDetails ?? 'State Bank of India\nA/C: XXXXXXXXXXXXX\nIFSC: SBIN0XXXXXX'
  );
  const [notes, setNotes] = useState(defaultData?.notes ?? '');
  const [terms, setTerms] = useState(
    defaultData?.terms ??
      '• Advance payment required to confirm booking.\n• Food once delivered cannot be returned.\n• For any complaints, contact within 2 hours of delivery.'
  );

  /* ── calculations ── */
  const subtotal = lineItems.reduce((s, it) => s + (it.category === 'discount' ? 0 : it.total), 0);
  const totalDiscount = discountAmount + lineItems.filter((i) => i.category === 'discount').reduce((s, i) => s + i.total, 0);
  const taxAmount = ((subtotal - totalDiscount + deliveryCharge) * taxRate) / 100;
  const total = subtotal - totalDiscount + deliveryCharge + taxAmount;
  const balanceDue = total - advancePaid;

  /* ── line item helpers ── */
  const updateItem = useCallback((id: string, field: keyof InvoiceLineItem, value: string | number) => {
    setLineItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: value };
        updated.total = updated.qty * updated.unitPrice;
        return updated;
      })
    );
  }, []);

  const addItem = () => setLineItems((prev) => [...prev, emptyItem()]);
  const removeItem = (id: string) => setLineItems((prev) => prev.filter((it) => it.id !== id));
  const addPreset = (preset: Partial<InvoiceLineItem>) => {
    const newItem: InvoiceLineItem = { ...emptyItem(), ...preset, id: uid(), qty: 1 };
    newItem.total = newItem.qty * newItem.unitPrice;
    setLineItems((prev) => [...prev, newItem]);
  };
  const duplicateItem = (id: string) => {
    setLineItems((prev) => {
      const idx = prev.findIndex((it) => it.id === id);
      if (idx === -1) return prev;
      const copy = { ...prev[idx], id: uid() };
      return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)];
    });
  };

  /* ── build invoice data object ── */
  const buildInvoiceData = (): InvoiceData => ({
    customerName, customerPhone, customerAddress,
    eventType, eventDate, eventLocation, guestCount, foodType,
    lineItems,
    subtotal, deliveryCharge, discountAmount, discountNote, taxRate, taxAmount,
    total, advancePaid, balanceDue,
    paymentMethod: paymentMethod || undefined,
    upiId, bankDetails, notes, terms,
  });

  /* ── save to DB ── */
  const handleSave = async () => {
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const body = {
        enquiry_id: enquiryId,
        subtotal, tax_amount: taxAmount, delivery_charge: deliveryCharge,
        discount_amount: totalDiscount, total_amount: total,
        invoice_data: buildInvoiceData(),
        status: 'pending',
        payment_method: paymentMethod || null,
        notes,
        ...(savedInvoiceId ? { id: savedInvoiceId } : {}),
      };
      const res = await fetch('/api/admin/invoices', {
        method: savedInvoiceId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Save failed');
      setSavedInvoiceId(json.id);
      setSavedInvoiceNumber(json.invoice_number);
      setSuccessMsg(`✅ Invoice ${json.invoice_number} saved!`);
      onSaved?.(json.id, json.invoice_number);
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setSaving(false);
    }
  };

  /* ── send via WhatsApp ── */
  const handleWhatsApp = async () => {
    // Auto-save first if not saved
    if (!savedInvoiceId) await handleSave();

    const msg = buildWhatsAppText();
    const url = `https://wa.me/91${customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;

    // Mark as sent in DB
    if (savedInvoiceId) {
      setSending(true);
      try {
        await fetch('/api/admin/invoices', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: savedInvoiceId, status: 'sent', sent_at: new Date().toISOString() }),
        });
      } finally {
        setSending(false);
      }
    }
    window.open(url, '_blank');
  };

  const buildWhatsAppText = () => {
    const lines = [
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `🍛 *Shri Ganapathi Mess*`,
      `📋 INVOICE ${savedInvoiceNumber || ''}`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `*Customer:* ${customerName}`,
      customerPhone ? `*Phone:* ${customerPhone}` : '',
      '',
      `*Event:* ${eventType || '—'}`,
      eventDate ? `*Date:* ${eventDate}` : '',
      eventLocation ? `*Location:* ${eventLocation}` : '',
      guestCount ? `*Guests:* ${guestCount}` : '',
      '',
      `━━━ ITEMS ━━━`,
      ...lineItems
        .filter((it) => it.total > 0 || it.description)
        .map((it) => `• ${it.description} × ${it.qty} ${it.unit} = ${fmt(it.total)}`),
      '',
      subtotal !== total ? `Sub Total: ${fmt(subtotal)}` : '',
      deliveryCharge > 0 ? `Delivery: ${fmt(deliveryCharge)}` : '',
      totalDiscount > 0 ? `Discount: -${fmt(totalDiscount)} ${discountNote ? `(${discountNote})` : ''}` : '',
      taxRate > 0 ? `Tax (${taxRate}%): ${fmt(taxAmount)}` : '',
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `*TOTAL: ${fmt(total)}*`,
      advancePaid > 0 ? `Advance Paid: ${fmt(advancePaid)}` : '',
      balanceDue > 0 ? `*Balance Due: ${fmt(balanceDue)}*` : `✅ *Fully Paid*`,
      '',
      paymentMethod === 'upi' ? `💳 Pay via UPI: *${upiId}*` : '',
      notes ? `\n📝 ${notes}` : '',
      '',
      `Thank you for choosing Shri Ganapathi Mess! 🙏`,
    ];
    return lines.filter(Boolean).join('\n');
  };

  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-[var(--color-ivory-300)] bg-white font-body text-sm text-[var(--color-brown-900)] focus:outline-none focus:ring-2 focus:ring-[var(--color-green-800)] focus:border-transparent';
  const labelClass = 'block font-body text-xs font-semibold text-[var(--color-brown-600)] mb-1 uppercase tracking-wide';

  /* ── render ── */
  return (
    <div className="space-y-6">

      {/* ── Alerts ── */}
      {successMsg && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 font-body text-sm text-green-800">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 font-body text-sm text-red-800">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* ── Customer & Event Info ── */}
      <section className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-6">
        <h3 className="font-display text-base font-bold text-[var(--color-brown-900)] mb-4">
          Customer & Event Details
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Customer Name *</label>
            <input className={inputClass} value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g. Murugan K." />
          </div>
          <div>
            <label className={labelClass}>Phone Number *</label>
            <input className={inputClass} value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="9XXXXXXXXX" />
          </div>
          <div>
            <label className={labelClass}>Customer Address</label>
            <input className={inputClass} value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <label className={labelClass}>Event Type</label>
            <select className={inputClass} value={eventType} onChange={(e) => setEventType(e.target.value)}>
              <option value="">— Select —</option>
              {['Wedding', 'Ear Piercing', 'Engagement', 'House Warming', 'Baby Shower', 'Birthday', 'Family Function', 'Corporate', 'School/College', 'Temple Function', 'Bulk Order'].map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Event Date</label>
            <input type="date" className={inputClass} value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Guest Count</label>
            <input className={inputClass} value={guestCount} onChange={(e) => setGuestCount(e.target.value)} placeholder="e.g. 200" />
          </div>
          <div>
            <label className={labelClass}>Event Location</label>
            <input className={inputClass} value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder="Venue name / address" />
          </div>
          <div>
            <label className={labelClass}>Food Type</label>
            <select className={inputClass} value={foodType} onChange={(e) => setFoodType(e.target.value)}>
              <option value="">— Select —</option>
              <option value="Vegetarian">🌱 Vegetarian</option>
              <option value="Non-Vegetarian">🍗 Non-Vegetarian</option>
              <option value="Both">🌱🍗 Both</option>
            </select>
          </div>
        </div>
      </section>

      {/* ── Preset Quick-Add ── */}
      <section className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-6">
        <h3 className="font-display text-base font-bold text-[var(--color-brown-900)] mb-3">
          Quick Add Items
        </h3>
        <div className="flex flex-wrap gap-2">
          {PRESET_ITEMS.map((p) => (
            <button
              key={p.description}
              type="button"
              onClick={() => addPreset(p)}
              className="px-3 py-1.5 rounded-full border border-[var(--color-ivory-300)] bg-[var(--color-ivory-100)] font-body text-xs font-medium text-[var(--color-brown-700)] hover:bg-[var(--color-green-100)] hover:border-[var(--color-green-700)] hover:text-[var(--color-green-900)] transition-all"
            >
              + {p.description}
            </button>
          ))}
        </div>
      </section>

      {/* ── Line Items ── */}
      <section className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-bold text-[var(--color-brown-900)]">
            Line Items
          </h3>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-green-800)] text-white font-body text-sm font-semibold hover:bg-[var(--color-green-900)] transition-colors"
          >
            <Plus size={16} /> Add Row
          </button>
        </div>

        <div className="overflow-x-auto -mx-2">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--color-ivory-300)]">
                <th className="text-left pb-2 font-body text-xs font-semibold uppercase tracking-wide text-[var(--color-brown-500)] px-2">Category</th>
                <th className="text-left pb-2 font-body text-xs font-semibold uppercase tracking-wide text-[var(--color-brown-500)] px-2">Description</th>
                <th className="text-right pb-2 font-body text-xs font-semibold uppercase tracking-wide text-[var(--color-brown-500)] px-2 w-20">Qty</th>
                <th className="text-left pb-2 font-body text-xs font-semibold uppercase tracking-wide text-[var(--color-brown-500)] px-2 w-24">Unit</th>
                <th className="text-right pb-2 font-body text-xs font-semibold uppercase tracking-wide text-[var(--color-brown-500)] px-2 w-28">Price (₹)</th>
                <th className="text-right pb-2 font-body text-xs font-semibold uppercase tracking-wide text-[var(--color-brown-500)] px-2 w-28">Total</th>
                <th className="w-16 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item) => (
                <tr key={item.id} className="border-b border-[var(--color-ivory-200)] hover:bg-[var(--color-ivory-100)] group">
                  <td className="py-2 px-2">
                    <select
                      value={item.category}
                      onChange={(e) => updateItem(item.id, 'category', e.target.value as InvoiceLineItem['category'])}
                      className="w-full px-2 py-1.5 rounded border border-[var(--color-ivory-300)] bg-white font-body text-xs text-[var(--color-brown-900)] focus:outline-none focus:ring-1 focus:ring-[var(--color-green-800)]"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-2">
                    <input
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      placeholder="Item description"
                      className="w-full px-2 py-1.5 rounded border border-[var(--color-ivory-300)] bg-white font-body text-sm text-[var(--color-brown-900)] focus:outline-none focus:ring-1 focus:ring-[var(--color-green-800)] min-w-[160px]"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number" min="1"
                      value={item.qty}
                      onChange={(e) => updateItem(item.id, 'qty', Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded border border-[var(--color-ivory-300)] bg-white font-body text-sm text-right text-[var(--color-brown-900)] focus:outline-none focus:ring-1 focus:ring-[var(--color-green-800)]"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      value={item.unit}
                      onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                      placeholder="person"
                      className="w-full px-2 py-1.5 rounded border border-[var(--color-ivory-300)] bg-white font-body text-xs text-[var(--color-brown-900)] focus:outline-none focus:ring-1 focus:ring-[var(--color-green-800)]"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number" min="0"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded border border-[var(--color-ivory-300)] bg-white font-body text-sm text-right text-[var(--color-brown-900)] focus:outline-none focus:ring-1 focus:ring-[var(--color-green-800)]"
                    />
                  </td>
                  <td className="py-2 px-2 text-right font-body text-sm font-semibold text-[var(--color-brown-900)]">
                    {fmt(item.total)}
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => duplicateItem(item.id)} title="Duplicate" className="p-1 rounded text-[var(--color-brown-400)] hover:text-[var(--color-green-800)]">
                        <Copy size={14} />
                      </button>
                      <button type="button" onClick={() => removeItem(item.id)} title="Remove" className="p-1 rounded text-[var(--color-brown-400)] hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Charges, Discounts, Taxes ── */}
      <section className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-6">
        <h3 className="font-display text-base font-bold text-[var(--color-brown-900)] mb-4">
          Adjustments
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Delivery Charge (₹)</label>
            <input type="number" min="0" className={inputClass} value={deliveryCharge} onChange={(e) => setDeliveryCharge(Number(e.target.value))} />
          </div>
          <div>
            <label className={labelClass}>Discount (₹)</label>
            <input type="number" min="0" className={inputClass} value={discountAmount} onChange={(e) => setDiscountAmount(Number(e.target.value))} />
          </div>
          <div>
            <label className={labelClass}>Discount Reason</label>
            <input className={inputClass} value={discountNote} onChange={(e) => setDiscountNote(e.target.value)} placeholder="e.g. Regular customer" />
          </div>
          <div>
            <label className={labelClass}>Tax Rate (%)</label>
            <input type="number" min="0" max="28" step="0.5" className={inputClass} value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} placeholder="0 (food usually tax-free)" />
          </div>
          <div>
            <label className={labelClass}>Advance Received (₹)</label>
            <input type="number" min="0" className={inputClass} value={advancePaid} onChange={(e) => setAdvancePaid(Number(e.target.value))} />
          </div>
          <div>
            <label className={labelClass}>Payment Method</label>
            <select className={inputClass} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
              <option value="">— Select —</option>
              <option value="cash">💵 Cash</option>
              <option value="upi">📱 UPI / GPay / PhonePe</option>
              <option value="bank_transfer">🏦 Bank Transfer</option>
              <option value="cheque">📝 Cheque</option>
            </select>
          </div>
        </div>

        {paymentMethod === 'upi' && (
          <div className="mt-4">
            <label className={labelClass}>UPI ID</label>
            <input className={`${inputClass} max-w-xs`} value={upiId} onChange={(e) => setUpiId(e.target.value)} />
          </div>
        )}
        {paymentMethod === 'bank_transfer' && (
          <div className="mt-4">
            <label className={labelClass}>Bank Details</label>
            <textarea rows={3} className={inputClass} value={bankDetails} onChange={(e) => setBankDetails(e.target.value)} />
          </div>
        )}
      </section>

      {/* ── Totals Summary ── */}
      <section className="bg-[var(--color-green-900)] text-white rounded-xl shadow-sm p-6">
        <h3 className="font-display text-base font-bold mb-4">Invoice Summary</h3>
        <div className="space-y-2 font-body text-sm max-w-xs ml-auto">
          <div className="flex justify-between">
            <span className="text-white/70">Sub Total</span>
            <span>{fmt(subtotal)}</span>
          </div>
          {deliveryCharge > 0 && (
            <div className="flex justify-between">
              <span className="text-white/70">Delivery</span>
              <span>{fmt(deliveryCharge)}</span>
            </div>
          )}
          {totalDiscount > 0 && (
            <div className="flex justify-between text-green-300">
              <span>Discount {discountNote ? `(${discountNote})` : ''}</span>
              <span>−{fmt(totalDiscount)}</span>
            </div>
          )}
          {taxAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-white/70">Tax ({taxRate}%)</span>
              <span>{fmt(taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold border-t border-white/20 pt-2 mt-2">
            <span>Total</span>
            <span className="text-[var(--color-gold-300)]">{fmt(total)}</span>
          </div>
          {advancePaid > 0 && (
            <>
              <div className="flex justify-between text-white/70">
                <span>Advance Paid</span>
                <span>−{fmt(advancePaid)}</span>
              </div>
              <div className={`flex justify-between font-bold text-base ${balanceDue <= 0 ? 'text-green-300' : 'text-orange-300'}`}>
                <span>Balance Due</span>
                <span>{balanceDue <= 0 ? '✅ Paid' : fmt(balanceDue)}</span>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Notes & Terms ── */}
      <section className="bg-white rounded-xl border border-[var(--color-ivory-300)] shadow-sm p-6">
        <h3 className="font-display text-base font-bold text-[var(--color-brown-900)] mb-4">Notes & Terms</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Internal / Customer Notes</label>
            <textarea rows={3} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special notes for this invoice..." />
          </div>
          <div>
            <label className={labelClass}>Terms & Conditions</label>
            <textarea rows={3} className={inputClass} value={terms} onChange={(e) => setTerms(e.target.value)} />
          </div>
        </div>
      </section>

      {/* ── WhatsApp Preview ── */}
      {showPreview && (
        <section className="bg-[#ECE5DD] rounded-xl border border-[#d4c9b0] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-bold text-[var(--color-brown-900)]">
              📱 WhatsApp Message Preview
            </h3>
            <button onClick={() => setShowPreview(false)} className="text-[var(--color-brown-400)] hover:text-[var(--color-brown-900)] transition-colors">
              <ChevronUp size={18} />
            </button>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm font-mono text-xs text-[var(--color-brown-900)] whitespace-pre-wrap leading-relaxed">
            {buildWhatsAppText()}
          </div>
        </section>
      )}

      {/* ── Action Bar ── */}
      <div className="sticky bottom-4 z-20">
        <div className="bg-white border border-[var(--color-ivory-300)] rounded-2xl shadow-xl p-4 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-0">
            {savedInvoiceNumber && (
              <p className="font-body text-sm font-semibold text-[var(--color-green-800)]">
                📋 {savedInvoiceNumber}
                {balanceDue > 0 && <span className="ml-2 text-orange-600">Balance: {fmt(balanceDue)}</span>}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-body text-sm font-semibold text-[var(--color-brown-700)] border border-[var(--color-ivory-300)] hover:bg-[var(--color-ivory-100)] transition-colors"
          >
            <FileText size={16} />
            {showPreview ? 'Hide' : 'Preview'}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-body text-sm font-semibold text-white bg-[var(--color-green-800)] hover:bg-[var(--color-green-900)] transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Saving…' : savedInvoiceId ? 'Update Invoice' : 'Save Invoice'}
          </button>

          <button
            type="button"
            onClick={handleWhatsApp}
            disabled={sending || !customerPhone}
            title={!customerPhone ? 'Enter customer phone first' : 'Send invoice via WhatsApp'}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-body text-sm font-semibold text-white bg-[#25D366] hover:bg-[#1da851] transition-colors disabled:opacity-50"
          >
            <MessageCircle size={16} />
            {sending ? 'Sending…' : 'Send via WhatsApp'}
          </button>
        </div>
      </div>
    </div>
  );
}
