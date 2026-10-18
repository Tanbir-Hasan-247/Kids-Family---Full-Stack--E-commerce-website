import React from 'react';
import {
  Clock,
  CheckCircle2,
  Boxes,
  Truck,
  Package,
  ShieldAlert,
  AlertCircle,
} from 'lucide-react';

export const STATUS_STEPS = [
  {
    key: 'pending',
    label: 'অর্ডার প্লেসড',
    sublabel: 'অর্ডারটি সফলভাবে গৃহীত হয়েছে',
    icon: Clock,
  },
  {
    key: 'confirmed',
    label: 'অর্ডার কনফার্ম',
    sublabel: 'তথ্য যাচাই করে অর্ডারটি নিশ্চিত করা হয়েছে',
    icon: CheckCircle2,
  },
  {
    key: 'processing',
    label: 'প্যাকিং ও প্রস্তুত',
    sublabel: 'পণ্য কোয়ালিটি চেক ও প্যাকিং সম্পন্ন হচ্ছে',
    icon: Boxes,
  },
  {
    key: 'shipped',
    label: 'কুরিয়ারে হস্তান্তর',
    sublabel: 'পার্সেলটি আপনার ঠিকানায় প্রেরণের পথে আছে',
    icon: Truck,
  },
  {
    key: 'delivered',
    label: 'ডেলিভারি সম্পন্ন',
    sublabel: 'পণ্যটি আপনার হাতে সফলভাবে পৌঁছে দেওয়া হয়েছে',
    icon: Package,
  },
];

export const getStatusIndex = (status) => {
  switch (status) {
    case 'pending':
      return 0;
    case 'confirmed':
      return 1;
    case 'processing':
      return 2;
    case 'shipped':
      return 3;
    case 'delivered':
      return 4;
    case 'cancelled':
      return -1;
    default:
      return 0;
  }
};

export default function TrackStatusStepper({
  activeOrder,
  isCancelled,
  currentStepIdx,
}) {
  if (isCancelled) {
    return (
      <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-5 sm:p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-black text-rose-900">
            এই অর্ডারটি বাতিল করা হয়েছে
          </h3>
          <p className="text-xs text-rose-600">
            অর্ডার স্ট্যাটাসঃ <strong className="font-bold">বাতিল (Cancelled)</strong>
          </p>
        </div>

        {activeOrder.cancel_reason ? (
          <div className="bg-white border border-rose-200 rounded-2xl p-4 max-w-lg mx-auto text-left shadow-2xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>বাতিলের কারণ / নোট (Reason for Cancellation):</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-neutral-800 whitespace-pre-line pl-5.5">
              {activeOrder.cancel_reason}
            </p>
          </div>
        ) : (
          <p className="text-xs text-rose-700 max-w-md mx-auto">
            অর্ডারটি বাতিল সংক্রান্ত কোনো তথ্য জানতে বা পুনরায় অর্ডার করতে আমাদের হেল্পলাইনে যোগাযোগ করুন।
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="pt-2">
      {/* Desktop Horizontal Stepper */}
      <div className="hidden sm:block relative mb-8">
        {/* Progress Line */}
        <div className="absolute top-5 left-8 right-8 h-1 bg-neutral-200 -z-0">
          <div
            className="h-full bg-emerald-600 transition-all duration-500"
            style={{
              width: `${Math.min(
                100,
                Math.max(0, (currentStepIdx / (STATUS_STEPS.length - 1)) * 100)
              )}%`,
            }}
          />
        </div>

        {/* Desktop Step Circles */}
        <div className="relative z-10 flex justify-between">
          {STATUS_STEPS.map((step, idx) => {
            const isCompleted = idx <= currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            const StepIcon = step.icon;

            return (
              <div
                key={step.key}
                className="flex flex-col items-center text-center max-w-[120px]"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-md ring-4 ring-emerald-100'
                      : 'bg-neutral-100 text-neutral-400 border border-neutral-200'
                  } ${isCurrent ? 'scale-110 ring-4 ring-amber-200 bg-emerald-700' : ''}`}
                >
                  <StepIcon className="w-4 h-4" />
                </div>
                <span
                  className={`text-xs mt-2 font-bold ${
                    isCurrent
                      ? 'text-emerald-800'
                      : isCompleted
                      ? 'text-neutral-800'
                      : 'text-neutral-400'
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[10px] text-neutral-400 leading-tight mt-0.5">
                  {step.sublabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Vertical Stepper */}
      <div className="sm:hidden space-y-4 pl-2">
        {STATUS_STEPS.map((step, idx) => {
          const isCompleted = idx <= currentStepIdx;
          const isCurrent = idx === currentStepIdx;
          const StepIcon = step.icon;

          return (
            <div key={step.key} className="flex items-start gap-3 relative">
              {idx < STATUS_STEPS.length - 1 && (
                <div
                  className={`absolute left-4 top-8 bottom-0 w-0.5 -ml-[1px] ${
                    idx < currentStepIdx ? 'bg-emerald-600' : 'bg-neutral-200'
                  }`}
                />
              )}
              <div
                className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold z-10 transition ${
                  isCompleted
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-100'
                    : 'bg-neutral-100 text-neutral-400 border'
                } ${isCurrent ? 'ring-3 ring-amber-300' : ''}`}
              >
                <StepIcon className="w-4 h-4" />
              </div>
              <div className="pb-3">
                <h4
                  className={`text-xs font-bold ${
                    isCurrent
                      ? 'text-emerald-800 font-extrabold'
                      : isCompleted
                      ? 'text-neutral-800'
                      : 'text-neutral-400'
                  }`}
                >
                  {step.label}
                </h4>
                <p className="text-[11px] text-neutral-500 mt-0.5">{step.sublabel}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
