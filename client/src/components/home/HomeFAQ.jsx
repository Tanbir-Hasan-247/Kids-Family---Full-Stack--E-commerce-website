import React, { useState } from 'react';
import { ChevronDown, HelpCircle, MessageCircle, PhoneCall } from 'lucide-react';

const FAQ_ITEMS = [
  {
    id: 1,
    question: 'ডেলিভারি পেতে কতদিন সময় লাগবে?',
    answer:
      'ঢাকা সিটির ভেতরে অর্ডার কনফার্ম করার ১ থেকে ২ দিনের মধ্যে হোম ডেলিভারি পৌঁছে দেওয়া হয়। আর ঢাকার বাইরে দেশের যেকোনো জেলা বা উপজেলায় ২ থেকে ৩ কার্যদিবসের মধ্যে কুরিয়ারের মাধ্যমে আপনার ঠিকানায় পার্সেল পৌঁছে যাবে।',
  },
  {
    id: 2,
    question: 'আমি কি ডেলিভারির সময় পার্সেল খুলে চেক করে টাকা দিতে পারব?',
    answer:
      'হ্যাঁ, অবশ্যই! আমাদের ডেলিভারি ম্যানের সামনে আপনি পার্সেলটি খুলে কাপড়ের কোয়ালিটি, কালার ও সাইজ নিখুঁতভাবে চেক করে সন্তুষ্ট হলে তবেই ক্যাশ অন ডেলিভারিতে টাকা পরিশোধ করবেন। কোনো অগ্রিম পেমেন্টের প্রয়োজন নেই।',
  },
  {
    id: 3,
    question: 'কাপড়ের সাইজ ছোট বা বড় হলে কি পরিবর্তন (Exchange) করা যাবে?',
    answer:
      'জি, পার্সেল রিসিভ করার পর ৭ দিনের মধ্যে যেকোনো সাইজ বা কালার সম্পূর্ণ বিনামূল্যে পরিবর্তন করে নিতে পারবেন। এর জন্য আমাদের হোয়াটসঅ্যাপে শুধু আপনার অর্ডার নাম্বার ও বাচ্চার সঠিক সাইজ জানালেই আমাদের টিম দ্রুত রিপ্লেসমেন্ট পার্সেল পাঠিয়ে দেবে।',
  },
  {
    id: 4,
    question: 'পোশাকগুলো কি ১০০% খাঁটি সুতি এবং শিশুদের কোমল ত্বকের জন্য নিরাপদ?',
    answer:
      'আমাদের প্রতিটি পোশাক ১০০% প্রিমিয়াম কম্বড কটন দিয়ে তৈরি, যা বাচ্চাদের সংবেদনশীল ত্বকের জন্য অত্যন্ত নরম, আরামদায়ক ও ঘাম-প্রতিরোধী। কোনো ধরনের বিষাক্ত ক্ষতিকর ডাই বা অস্বস্তিকর কৃত্রিম সুতা ব্যবহার করা হয় না।',
  },
  {
    id: 5,
    question: 'পেমেন্ট কীভাবে করা যাবে? বিকাশ বা কার্ডে কি পেমেন্ট করা যায়?',
    answer:
      'পণ্য হাতে পাওয়ার পর সম্পূর্ণ ক্যাশ অন ডেলিভারিতে (Cash on Delivery) টাকা দেওয়া যায়। এছাড়া আপনি চাইলে ডেলিভারি ম্যানের কাছে বা অনলাইনে বিকাশ, নগদ কিংবা রকেটের মাধ্যমেও সহজেই পেমেন্ট সম্পন্ন করতে পারবেন।',
  },
];

const HomeFAQ = () => {
  const [openId, setOpenId] = useState(1); // First item open by default

  const toggleItem = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* SECTION HEADER */}
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black">
          <HelpCircle className="w-3.5 h-3.5 text-amber-800" />
          <span>সচরাচর জিজ্ঞাসা</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
          সচরাচর জিজ্ঞাসিত প্রশ্নাবলী (FAQ)
        </h2>
        <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto">
          অর্ডার ও ডেলিভারি সংক্রান্ত প্রয়োজনীয় তথ্যের জন্য নিচের উত্তরগুলো জেনে নিন।
        </p>
      </div>

      {/* ACCORDION LIST */}
      <div className="space-y-3">
        {FAQ_ITEMS.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div
              key={item.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? 'bg-white border-amber-300 shadow-md ring-1 ring-amber-300/40'
                  : 'bg-white border-neutral-200/90 hover:border-neutral-300 shadow-2xs'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                className="w-full py-4 px-5 sm:px-6 flex items-center justify-between text-left gap-4 cursor-pointer"
              >
                <span className="text-xs sm:text-sm font-extrabold text-neutral-900">
                  {item.question}
                </span>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 bg-amber-100 text-amber-900' : 'bg-neutral-100 text-neutral-500'
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {isOpen && (
                <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-neutral-600 leading-relaxed border-t border-neutral-100 animate-in fade-in duration-150">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* BOTTOM HELP CTA */}
      <div className="mt-8 p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 rounded-2xl border border-emerald-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="space-y-0.5">
          <h4 className="text-xs sm:text-sm font-bold text-neutral-900">
            আরো কোনো প্রশ্ন বা সাইজ নিয়ে দ্বিধা আছে?
          </h4>
          <p className="text-[11px] sm:text-xs text-neutral-500">
            আমাদের কাস্টমার কেয়ার টিম সরাসরি আপনার সাথে কথা বলতে প্রস্তুত।
          </p>
        </div>

        <a
          href="https://wa.me/8801700000000?text=Hello%20Kids%20%26%20Family%2C%20amar%20kichu%20janar%20cilo"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1b3b2b] hover:bg-[#142e22] text-amber-400 font-extrabold text-xs rounded-full shadow-md transition active:scale-95 shrink-0"
        >
          <MessageCircle className="w-4 h-4 text-amber-400" />
          <span>হোয়াটসঅ্যাপে প্রশ্ন করুন</span>
        </a>
      </div>
    </section>
  );
};

export default HomeFAQ;

