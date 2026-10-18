import React from 'react';
import { Plus } from 'lucide-react';

const AdminSliderHeader = ({ onAddSlide }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <p className="text-xs text-neutral-500">
          Manage the responsive, touch-friendly homepage hero carousel (inspired by GhorerBazar).
        </p>
      </div>
      <button
        onClick={onAddSlide}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1b3b2b] hover:bg-[#142e22] text-amber-400 font-extrabold text-xs rounded-full shadow-md transition self-start sm:self-auto cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Add Slide</span>
      </button>
    </div>
  );
};

export default AdminSliderHeader;
