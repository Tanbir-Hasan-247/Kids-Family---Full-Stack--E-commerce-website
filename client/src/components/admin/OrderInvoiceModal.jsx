import React from 'react';
import { X, Printer, Package, Phone, MapPin, Calendar, CheckCircle } from 'lucide-react';
import { useShopSettings } from '../../context/ShopSettingsContext';

const OrderInvoiceModal = ({ order, isOpen, onClose }) => {
  const { settings } = useShopSettings();

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const subtotal = Number(order.total) - Number(order.shipping_fee || 0);
  const shopName = settings?.shop_name || 'Kids & Family';
  const tagline = settings?.tagline || 'Premium Family Lifestyle & Outfits';
  const address = settings?.address || 'Dhaka, Bangladesh';
  const phone = settings?.phone || '+880 1700-000000';

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-2.5 sm:p-6 print:p-0 print:bg-white print:static overscroll-contain"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal Card */}
      <div
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden my-3 sm:my-8 print:shadow-none print:border-none print:rounded-none animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Hidden on print) */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-neutral-100/95 backdrop-blur-md border-b border-neutral-200 print:hidden">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#1b3b2b]" />
            <h3 className="font-extrabold text-xs sm:text-sm text-neutral-900 truncate">
              চালান ও ইনভয়েস
            </h3>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1b3b2b] hover:bg-[#142e22] text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>প্রিন্ট করুন</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl bg-neutral-200/80 hover:bg-neutral-300 text-neutral-600 hover:text-neutral-900 transition active:scale-90 cursor-pointer"
              title="বন্ধ করুন (Close)"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE INVOICE CONTENT */}
        <div id="printable-invoice" className="p-4 sm:p-10 space-y-6 sm:space-y-8 bg-white text-neutral-900">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-neutral-900 pb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1b3b2b] uppercase">
                {shopName}
              </h1>
              <p className="text-xs text-neutral-500 font-medium tracking-wide">
                {tagline}
              </p>
              <p className="text-[11px] text-neutral-600 mt-1">
                {address} | Helpline: {phone}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block px-3 py-1 rounded-md bg-[#1b3b2b] text-white text-xs font-black tracking-widest uppercase">
                INVOICE / মেমো
              </span>
              <p className="text-xs font-bold text-neutral-800 mt-2">
                Order #{order.order_number}
              </p>
              <p className="text-[11px] text-neutral-500">
                Date: {new Date(order.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {/* Customer & Shipping Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-neutral-50 p-5 rounded-2xl border border-neutral-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                Customer Details / গ্রাহকের তথ্য
              </span>
              <h4 className="text-sm font-bold text-neutral-900">
                {order.full_name || `${order.first_name || ''} ${order.last_name || ''}`.trim()}
              </h4>
              <p className="text-xs text-neutral-700 flex items-center gap-1.5 mt-1 font-semibold">
                <Phone className="w-3.5 h-3.5 text-neutral-400" />
                <span>{order.phone}</span>
              </p>
              {order.email && (
                <p className="text-xs text-neutral-500 mt-0.5">
                  {order.email}
                </p>
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                Delivery Address / ডেলিভারি ঠিকানা
              </span>
              <p className="text-xs text-neutral-800 leading-relaxed flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                <span>
                  {order.address_line || order.address}, {order.city}
                </span>
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-200 text-neutral-800 uppercase">
                  {order.payment_method === 'cod' ? 'Cash on Delivery (COD)' : order.payment_method}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {order.payment_status}
                </span>
              </div>
            </div>
          </div>

          {/* Cancelled Memo Notice */}
          {order.status === 'cancelled' && (
            <div className="bg-rose-50 border border-rose-300 p-3 rounded-xl text-xs text-rose-900 flex items-start gap-2">
              <strong className="font-bold text-rose-800 shrink-0">অর্ডার বাতিল (CANCELLED):</strong>
              <span>{order.cancel_reason || 'এই অর্ডারটি বাতিল করা হয়েছে।'}</span>
            </div>
          )}

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-300 text-neutral-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-2">SL</th>
                  <th className="py-2.5 px-2">Product Name</th>
                  <th className="py-2.5 px-2">Variant</th>
                  <th className="py-2.5 px-2 text-right">Unit Price</th>
                  <th className="py-2.5 px-2 text-center">Qty</th>
                  <th className="py-2.5 px-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {order.items?.map((item, idx) => {
                  const itemTotal = Number(item.price) * item.quantity;
                  return (
                    <tr key={item.id || idx}>
                      <td className="py-3 px-2 text-neutral-400 font-medium">{idx + 1}</td>
                      <td className="py-3 px-2 font-bold text-neutral-900">
                        {item.product_name}
                      </td>
                      <td className="py-3 px-2 text-neutral-600 font-medium">
                        {item.variant_sku || 'Standard'}
                      </td>
                      <td className="py-3 px-2 text-right font-medium text-neutral-700">
                        ৳{Number(item.price).toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-center font-bold text-neutral-900">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-neutral-900">
                        ৳{itemTotal.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pricing Totals */}
          <div className="flex justify-end pt-2 border-t border-neutral-200">
            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-600 font-medium">
                <span>Subtotal (সাবটোটাল):</span>
                <span>৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-neutral-600 font-medium">
                <span>Delivery Charge (ডেলিভারি চার্জ):</span>
                <span>৳{Number(order.shipping_fee || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-black text-neutral-900 border-t-2 border-neutral-900 pt-2">
                <span>Total Payable:</span>
                <span className="text-[#1b3b2b]">৳{Number(order.total).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Return Policy & Memo Footer */}
          <div className="pt-6 border-t border-dashed border-neutral-300 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end text-neutral-600">
            <div className="space-y-1 text-[11px] leading-relaxed">
              <p className="font-bold text-neutral-900">শর্তাবলী / Terms:</p>
              <p>১. ডেলিভারিম্যান উপস্থিত থাকা অবস্থায় পার্সেল চেক করে গ্রহণ করুন।</p>
              <p>২. সাইজ পরিবর্তন বা সমস্যার ক্ষেত্রে ৭ দিনের মধ্যে হেল্পলাইনে যোগাযোগ করুন।</p>
              <p className="text-[#1b3b2b] font-bold mt-2">Kids & Family-এর সাথে থাকার জন্য ধন্যবাদ!</p>
            </div>

            <div className="flex justify-between sm:justify-end gap-12 text-center text-[10px] text-neutral-500 pt-8 sm:pt-0">
              <div className="border-t border-neutral-400 pt-1 px-4">
                <span>Authorized Signature</span>
              </div>
              <div className="border-t border-neutral-400 pt-1 px-4">
                <span>Customer Signature</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Global Print Style Sheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible !important;
          }
          #printable-invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 24px !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default OrderInvoiceModal;

