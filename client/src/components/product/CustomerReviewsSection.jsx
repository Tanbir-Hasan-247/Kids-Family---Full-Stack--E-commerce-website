import React, { useState, useRef } from 'react';
import { Camera, MessageSquare } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import ReviewSummaryHeader from './ReviewSummaryHeader';
import ReviewPhotoGallery from './ReviewPhotoGallery';
import ReviewSubmitForm from './ReviewSubmitForm';
import ReviewFilterPills from './ReviewFilterPills';
import ReviewCard from './ReviewCard';
import ReviewPhotoLightbox from './ReviewPhotoLightbox';

const CustomerReviewsSection = ({
  productId,
  initialReviews = [],
  averageRating = 5,
  reviewsCount = 0,
}) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState(initialReviews);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [userName, setUserName] = useState(
    user?.first_name
      ? `${user.first_name} ${user.last_name || ''}`.trim()
      : user?.name || ''
  );
  const [comment, setComment] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
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
      ? (
          reviews.reduce((acc, r) => acc + Number(r.rating || 5), 0) / currentCount
        ).toFixed(1)
      : (averageRating || 5.0).toFixed(1);

  return (
    <div id="reviews-section" className="mt-14 pt-10 border-t border-neutral-200 space-y-8">
      {/* SECTION HEADER & SUMMARY */}
      <ReviewSummaryHeader
        currentAvg={currentAvg}
        currentCount={currentCount}
        showForm={showForm}
        onToggleForm={() => {
          setShowForm(!showForm);
          if (!showForm) {
            setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
          }
        }}
      />

      {/* PHOTO REVIEWS GALLERY CAROUSEL */}
      <ReviewPhotoGallery
        photoReviews={photoReviews}
        onZoomImage={(item) => setZoomedImage(item)}
      />

      {/* WRITE A REVIEW FORM */}
      {showForm && (
        <ReviewSubmitForm
          formRef={formRef}
          onClose={() => setShowForm(false)}
          submitSuccess={submitSuccess}
          errorMessage={errorMessage}
          handleSubmit={handleSubmit}
          rating={rating}
          setRating={setRating}
          hoverRating={hoverRating}
          setHoverRating={setHoverRating}
          userName={userName}
          setUserName={setUserName}
          comment={comment}
          setComment={setComment}
          imagePreview={imagePreview}
          handleClearImage={handleClearImage}
          fileInputRef={fileInputRef}
          handleImageSelect={handleImageSelect}
          submitting={submitting}
        />
      )}

      {/* FILTER BUTTONS */}
      <ReviewFilterPills
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        totalReviewsCount={reviews.length}
        photoReviewsCount={photoReviews.length}
      />

      {/* REVIEWS FEED */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="py-14 text-center bg-white rounded-3xl border border-neutral-200/80 p-8 space-y-3">
            <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center mx-auto">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-neutral-800">
              এখনো কোনো রিভিউ যোগ করা হয়নি
            </h4>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              এই প্রোডাক্টটি আপনি প্রথম রিভিউ দিন এবং আপনার সুন্দর বাচ্চার পরা ছবির মাধ্যমে
              অন্যদের সহায়তা করুন।
            </p>
            <button
              type="button"
              onClick={() => {
                setShowForm(true);
                setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#1b3b2b] text-amber-400 rounded-full text-xs font-bold hover:bg-[#142e22] transition cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>প্রথম রিভিউ দিন</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReviews.map((rev) => (
              <ReviewCard
                key={rev.id}
                review={rev}
                onZoomImage={(r) => setZoomedImage(r)}
              />
            ))}
          </div>
        )}
      </div>

      {/* IMAGE ZOOM LIGHTBOX MODAL */}
      <ReviewPhotoLightbox
        zoomedImage={zoomedImage}
        onClose={() => setZoomedImage(null)}
      />
    </div>
  );
};

export default CustomerReviewsSection;
