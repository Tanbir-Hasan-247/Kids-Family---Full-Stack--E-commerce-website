import React from 'react';
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Star,
  Camera,
  Upload,
} from 'lucide-react';

export default function ReviewSubmitForm({
  formRef,
  onClose,
  submitSuccess,
  errorMessage,
  handleSubmit,
  rating,
  setRating,
  hoverRating,
  setHoverRating,
  userName,
  setUserName,
  comment,
  setComment,
  imagePreview,
  handleClearImage,
  fileInputRef,
  handleImageSelect,
  submitting,
}) {
  return (
    <div
      ref={formRef}
      className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-300 shadow-xl space-y-5 animate-in fade-in slide-in-from-top-4"
    >
      <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
        <div>
          <h3 className="text-base sm:text-lg font-black text-neutral-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <span>আপনার বাচ্চার অভিজ্ঞতা ও ছবি শেয়ার করুন</span>
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            অন্যান্য অভিভাবকদের সঠিক মাপ ও কোয়ালিটি বেছে নিতে আপনার রিভিউ সাহায্য করবে।
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-neutral-400 hover:text-neutral-600 p-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {submitSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs sm:text-sm rounded-2xl font-bold flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>ধন্যবাদ! আপনার রিভিউ ও ছবিটি সফলভাবে পাবলিশ হয়েছে।</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-2xl font-bold flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star Rating Picker */}
        <div>
          <label className="block text-xs font-black text-neutral-800 mb-1.5 uppercase tracking-wider">
            রেটিং নির্বাচন করুন *
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition transform hover:scale-110 cursor-pointer"
              >
                <Star
                  className={`w-7 h-7 sm:w-8 sm:h-8 ${
                    star <= (hoverRating || rating)
                      ? 'text-amber-500 fill-amber-500'
                      : 'text-neutral-200 fill-neutral-200'
                  }`}
                />
              </button>
            ))}
            <span className="text-xs font-extrabold text-amber-700 ml-2">
              {rating === 5
                ? 'অসাধারণ (৫ স্টার)'
                : rating === 4
                ? 'খুব ভালো (৪ স্টার)'
                : rating === 3
                ? 'মোটামুটি (৩ স্টার)'
                : rating === 2
                ? 'চলনসই (২ স্টার)'
                : 'ভালো না (১ স্টার)'}
            </span>
          </div>
        </div>

        {/* Name Input */}
        <div>
          <label className="block text-xs font-black text-neutral-800 mb-1.5 uppercase tracking-wider">
            আপনার নাম
          </label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="যেমন: তানভীর হাসান"
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm font-semibold bg-neutral-50/50 focus:bg-white focus:outline-none focus:border-[#1b3b2b]"
          />
        </div>

        {/* Comment Textarea */}
        <div>
          <label className="block text-xs font-black text-neutral-800 mb-1.5 uppercase tracking-wider">
            আপনার মন্তব্য ও বাচ্চার ফিটিং কেমন হয়েছে? *
          </label>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="যেমন: কাপড়ের কাপড়টা খুবই নরম ও আরামদায়ক, কালার ছবির চেয়েও সুন্দর আর ৩ বছরের বাচ্চার পারফেক্ট সাইজ হয়েছে..."
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm font-medium bg-neutral-50/50 focus:bg-white focus:outline-none focus:border-[#1b3b2b]"
            required
          />
        </div>

        {/* Photo Upload with Preview */}
        <div>
          <label className="block text-xs font-black text-neutral-800 mb-1.5 uppercase tracking-wider">
            বাচ্চার পরিহিত পোশাকের ছবি আপলোড করুন (ঐচ্ছিক)
          </label>

          {imagePreview ? (
            <div className="relative inline-block mt-1">
              <img
                src={imagePreview}
                alt="Review preview"
                className="w-28 h-36 object-cover rounded-2xl border-2 border-amber-400 shadow-md"
              />
              <button
                type="button"
                onClick={handleClearImage}
                className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 shadow-md hover:bg-rose-700 cursor-pointer"
                title="ছবি বাতিল করুন"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-300 hover:border-amber-500 rounded-2xl p-4 sm:p-5 text-center cursor-pointer bg-neutral-50/70 hover:bg-amber-50/30 transition flex flex-col items-center justify-center gap-1.5"
            >
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-800">
                <Camera className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-neutral-800">
                এখানে ক্লিক করে বাচ্চার ছবি নির্বাচন করুন
              </span>
              <span className="text-[11px] text-neutral-500">
                মোবাইলের ক্যামেরা বা গ্যালারি থেকে সরাসরি ছবি যোগ করতে পারবেন (Max 10MB)
              </span>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-7 py-3 rounded-xl bg-[#1b3b2b] hover:bg-[#142e22] text-amber-400 font-black text-xs sm:text-sm shadow-md transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <span>সাবমিট হচ্ছে...</span>
            ) : (
              <>
                <Upload className="w-4 h-4 text-amber-400" />
                <span>রিভিউ পাবলিশ করুন</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
