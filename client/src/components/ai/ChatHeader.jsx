import React from 'react';
import { Bot, RotateCcw, ChevronDown, X } from 'lucide-react';

export default function ChatHeader({
  isMinimized,
  onReset,
  onToggleMinimize,
  onClose,
}) {
  return (
    <div className="bg-linear-to-r from-[#1b3b2b] to-[#12281d] text-white p-3.5 sm:p-4 flex items-center justify-between shadow-md shrink-0 select-none">
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center shrink-0">
          <Bot className="w-5 h-5 text-amber-300" />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#1b3b2b] rounded-full" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs sm:text-sm font-extrabold text-amber-300 tracking-tight">
              Kids & Family AI
            </h3>
            <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full border border-emerald-400/30">
              Active
            </span>
          </div>
          <p className="text-[10px] text-neutral-300">২৪/৭ স্মার্ট শপিং ও অর্ডার সহায়তা</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onReset}
          title="নতুন কথোপকথন শুরু করুন"
          className="p-1.5 text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleMinimize}
          title={isMinimized ? 'বড় করুন' : 'মিনিমাইজ করুন'}
          className="p-1.5 text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isMinimized ? 'rotate-180' : ''}`}
          />
        </button>
        <button
          onClick={onClose}
          title="বন্ধ করুন"
          className="p-1.5 text-neutral-300 hover:text-rose-400 hover:bg-white/10 rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
