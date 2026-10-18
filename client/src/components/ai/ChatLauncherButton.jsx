import React from 'react';
import { Sparkles } from 'lucide-react';

export default function ChatLauncherButton({ onClick }) {
  return (
    <div className="fixed bottom-20 lg:bottom-22 right-4 sm:right-6 z-40 flex items-center pointer-events-auto">
      <button
        onClick={onClick}
        className="flex items-center gap-2 bg-linear-to-r from-[#1b3b2b] via-[#244f3a] to-[#1b3b2b] text-white px-3.5 py-2.5 sm:px-4 sm:py-2.5 rounded-full shadow-xl hover:shadow-2xl border-2 border-amber-400 hover:border-amber-300 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer group"
        aria-label="Open AI Assistant"
      >
        <div className="relative">
          <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-300 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-ping" />
        </div>
        <div className="flex flex-col text-left pr-0.5">
          <span className="text-[9px] font-black uppercase tracking-wider text-amber-300 leading-none">
            AI Assistant
          </span>
          <span className="text-xs font-bold leading-tight">শপিং সহকারী</span>
        </div>
      </button>
    </div>
  );
}
