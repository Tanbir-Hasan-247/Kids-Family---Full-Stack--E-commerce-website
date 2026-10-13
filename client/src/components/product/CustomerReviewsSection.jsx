import React, { useState, useRef } from 'react';
import {
  Star,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  MessageSquare,
  ThumbsUp,
  Image as ImageIcon,
  User,
  Sparkles,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const CustomerReviewsSection = ({ productId, initialReviews = [], averageRating = 5, reviewsCount = 0 }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState(initialReviews);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [userName, setUserName] = useState(
    user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : (user?.name || '')
  );
  const [comment, setComment] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'with_photos', '5_star'
  const [zoomedImage, setZoomedImage] = useState(null);

  const fileInputRef = useRef(null);
  const formRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('অনুগ্রহ করে শুধুমাত্র ছবি ফাইল নির্বাচন করুন (JPG, PNG)');
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setErrorMessage('');
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMessage('অনুগ্রহ করে আপনার অভিজ্ঞতা বা মন্তব্য লিখুন');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('rating', rating);
      formData.append('comment', comment.trim());
      formData.append('user_name', userName.trim() || 'সম্মানিত কাস্টমার');
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const res = await api.post(`/products/${productId}/reviews/`, formData);

      // Append new review at the top
      setReviews((prev) => [res.data, ...prev]);
      setSubmitSuccess(true);
      setComment('');
      handleClearImage();

      setTimeout(() => {
        setSubmitSuccess(false);
        setShowForm(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to submit review:', err);
      const resData = err.response?.data;
      let errorText = 'রিভিউ জমা দিতে সমস্যা হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন।';
      if (resData) {
        if (typeof resData === 'string') {
          errorText = resData;
        } else if (resData.detail) {
          errorText = resData.detail;
        } else if (resData.message) {
          errorText = resData.message;
        } else if (typeof resData === 'object') {
          const firstKey = Object.keys(resData)[0];
          if (firstKey) {
            const firstVal = resData[firstKey];
            errorText = Array.isArray(firstVal) ? firstVal[0] : String(firstVal);
          }
        }
      }
      setErrorMessage(errorText);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter reviews
  const filteredReviews = reviews.filter((r) => {
    if (activeFilter === 'with_photos') {
      return Boolean(r.image_url || r.image);
    }
    if (activeFilter === '5_star') {
      return Number(r.rating) === 5;
    }
    return true;
  });

  const photoReviews = reviews.filter((r) => Boolean(r.image_url || r.image));
  const currentCount = reviews.length;
  const currentAvg =
    currentCount > 0
      ? (reviews.reduce((acc, r) => acc + Number(r.rating || 5), 0) / currentCount).toFixed(1)
      : (averageRating || 5.0).toFixed(1);

  return (
    <div id="reviews-section" className="mt-14 pt-10 border-t border-neutral-200 space-y-8">
      {/* SECTION HEADER & SUMMARY */}
      <div className="bg-gradient-to-br from-amber-50/70 via-white to-emerald-50/40 rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black">
              <Camera className="w-3.5 h-3.5 text-amber-800" />
              <span>রিয়েল কাস্টমার ফটো রিভিউ</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              বাচ্চাদের পরিহিত পোশাক ও কাস্টমার রিভিউ
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-xl">
              যারা এই ড্রেসটি কিনেছেন তাদের আসল ছবি এবং সন্তুষ্টির রিভিউ দেখে নিশ্চিন্তে অর্ডার করুন।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
            <div className="text-center sm:text-left">
              <div className="text-3xl sm:text-4xl font-black text-[#1b3b2b] tracking-tight flex items-baseline gap-1">
                <span>{currentAvg}</span>
                <span className="text-xs text-neutral-400 font-semibold">/ 5.0</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(Number(currentAvg))
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-neutral-200 fill-neutral-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] text-neutral-500 font-bold block mt-1">
                ({currentCount} টি ভেরিফাইড রিভিউ)
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowForm(!showForm);
                if (!showForm) {
                  setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                }
              }}
              className="px-5 py-3 rounded-xl bg-[#1b3b2b] hover:bg-[#142e22] text-amber-400 font-black text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4 text-amber-400" />
              <span>{showForm ? 'ফর্ম বন্ধ করুন' : 'বাচ্চার ছবি ও রিভিউ দিন'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* PHOTO REVIEWS GALLERY CAROUSEL */}
      {photoReviews.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-neutral-800 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-600" />
              <span>কাস্টমারদের আপলোড করা ছবি ({photoReviews.length})</span>
            </h3>
            <span className="text-xs text-neutral-400">ছবিতে ট্যাপ করে বড় করে দেখুন</span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth">
            {photoReviews.map((item) => {
              const img = item.image_url || item.image;
              return (
                <div
                  key={item.id}
                  onClick={() => setZoomedImage(item)}
                  className="group relative w-28 h-36 sm:w-36 sm:h-44 rounded-2xl overflow-hidden shrink-0 border border-neutral-200 shadow-2xs hover:shadow-lg transition cursor-pointer"
                >
                  <img
                    src={img}
                    alt={item.user_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-2 text-white">
                    <span className="text-[11px] font-bold truncate">{item.user_name}</span>
                    <div className="flex items-center gap-0.5">
                      {[...Array(Number(item.rating || 5))].map((_, i) => (
                        <Star key={i} className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WRITE A REVIEW FORM */}
      {showForm && (
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
              onClick={() => setShowForm(false)}
              className="text-neutral-400 hover:text-neutral-600 p-1"
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
                placeholder="যেমন: তানভীর হাসান বা বাচ্চার আম্মু"
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
      )}

      {/* FILTER BUTTONS */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-[#1b3b2b] text-white shadow-xs'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          সব রিভিউ ({reviews.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('with_photos')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeFilter === 'with_photos'
              ? 'bg-[#1b3b2b] text-white shadow-xs'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>ছক ও ছবিসহ ({photoReviews.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('5_star')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
            activeFilter === '5_star'
              ? 'bg-[#1b3b2b] text-white shadow-xs'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span>৫ স্টার রিভিউ</span>
        </button>
      </div>

      {/* REVIEWS FEED */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="py-14 text-center bg-white rounded-3xl border border-neutral-200/80 p-8 space-y-3">
            <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center mx-auto">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-neutral-800">এখনো কোনো রিভিউ যোগ করা হয়নি</h4>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              এই প্রোডাক্টটি আপনি প্রথম রিভিউ দিন এবং আপনার সুন্দর বাচ্চার পরা ছবির মাধ্যমে অন্যদের সহায়তা করুন।
            </p>
            <button
              type="button"
              onClick={() => {
                setShowForm(true);
                setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#1b3b2b] text-amber-400 rounded-full text-xs font-bold hover:bg-[#142e22] transition"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>প্রথম রিভিউ দিন</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReviews.map((rev) => {
              const img = rev.image_url || rev.image;
              return (
                <div
                  key={rev.id}
                  className="bg-white rounded-2xl p-5 border border-neutral-200/90 shadow-2xs hover:shadow-md transition space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    {/* Review Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#1b3b2b] to-emerald-700 text-amber-400 font-black text-xs flex items-center justify-center shrink-0 uppercase shadow-xs">
                          {rev.user_name ? rev.user_name.charAt(0) : 'K'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-neutral-900">
                              {rev.user_name || 'সম্মানিত কাস্টমার'}
                            </span>
                            <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded-full font-bold">
                              Verified
                            </span>
                          </div>
                          <span className="text-[10px] text-neutral-400 block">
                            {rev.created_at ? new Date(rev.created_at).toLocaleDateString('bn-BD') : 'সম্প্রতি'}
                          </span>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((st) => (
                          <Star
                            key={st}
                            className={`w-3.5 h-3.5 ${
                              st <= Number(rev.rating || 5)
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-neutral-200 fill-neutral-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Comment text */}
                    <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed font-normal">
                      {rev.comment}
                    </p>
                  </div>

                  {/* Customer Photo (if attached) */}
                  {img && (
                    <div className="pt-2 border-t border-neutral-100 flex items-center gap-3">
                      <div
                        onClick={() => setZoomedImage(rev)}
                        className="group relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden border border-neutral-200 shrink-0 cursor-pointer shadow-xs hover:border-amber-500 transition"
                      >
                        <img
                          src={img}
                          alt="Customer photo"
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition" />
                      </div>
                      <div className="text-xs text-neutral-500">
                        <span className="font-bold text-neutral-700 block">কাস্টমার আপলোড</span>
                        <span className="text-[11px] text-neutral-400">ট্যাপ করে ছবি বড় করুন 🔍</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* IMAGE ZOOM LIGHTBOX MODAL */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="max-h-[70vh] bg-neutral-950 flex items-center justify-center overflow-hidden">
              <img
                src={zoomedImage.image_url || zoomedImage.image}
                alt="Enlarged review photo"
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>

            <div className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-neutral-900">{zoomedImage.user_name}</h4>
                  <span className="text-[11px] text-neutral-400">
                    {zoomedImage.created_at ? new Date(zoomedImage.created_at).toLocaleDateString() : ''}
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  {[...Array(Number(zoomedImage.rating || 5))].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-neutral-700 leading-relaxed">{zoomedImage.comment}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerReviewsSection;

