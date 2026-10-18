import React from 'react';
import { Send } from 'lucide-react';

export default function ChatInputBar({
  inputValue,
  setInputValue,
  isLoading,
  onSubmit,
  inputRef,
}) {
  return (
    <div className="p-3 bg-white border-t border-neutral-200 shrink-0">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="flex items-center gap-2"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="পোশাক খুঁজুন বা প্রশ্ন লিখুন..."
          disabled={isLoading}
          className="flex-1 px-3.5 py-2.5 text-xs bg-neutral-100 border border-transparent rounded-2xl focus:bg-white focus:border-[#1b3b2b] focus:outline-none transition placeholder:text-neutral-400"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="w-10 h-10 rounded-2xl bg-[#1b3b2b] text-amber-400 hover:bg-[#25523c] flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs shrink-0 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
      <p className="text-[9px] text-center text-neutral-400 mt-1.5 font-medium">
        Kids & Family AI Assistant • Real-time Order & Product Recommendations
      </p>
    </div>
  );
}
