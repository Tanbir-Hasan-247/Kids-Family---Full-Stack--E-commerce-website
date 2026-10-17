import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  X,
  Send,
  ShoppingBag,
  Truck,
  RotateCcw,
  CheckCircle2,
  Clock,
  Package,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Bot,
  User as UserIcon,
} from 'lucide-react';
import api, { formatImageUrl } from '../../api/axios';
import { useCart } from '../../context/CartContext';

const QUICK_SUGGESTIONS = [
  { label: '🚚 ডেলিভারি চার্জ কত?', query: 'ডেলিভারি চার্জ এবং সময় কত লাগবে?' },
  { label: '🛍️ বাবা-ছেলে ম্যাচিং পাঞ্জাবি', query: 'বাবা ও ছেলের জন্য ম্যাচিং পাঞ্জাবি দেখান' },
  { label: '👗 মেয়েদের ফ্রক কালেকশন', query: 'বাচ্চা মেয়েদের সুতি ফ্রক দেখান' },
  { label: '📦 অর্ডার ট্র্যাক করুন', query: 'আমার অর্ডার ট্র্যাক করতে চাই' },
  { label: '🔄 রিটার্ন পলিসি কি?', query: 'সাইজ না হলে কি রিটার্ন বা এক্সচেঞ্জ করা যাবে?' },
];

export default function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'স্বাগতম! আমি Kids & Family-এর AI শপিং সহকারী 🤖\nআপনাকে কীভাবে সাহায্য করতে পারি? পণ্য খোঁজা, সাইজ নির্ধারণ, ডেলিভারি তথ্য বা অর্ডার ট্র্যাক করতে যেকোনো প্রশ্ন করতে পারেন।',
      products: [],
      order: null,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [addedProductIds, setAddedProductIds] = useState({});
  const [addingId, setAddingId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { addToCart, totalItems, totalPrice, openDrawer } = useCart();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isOpen, isMinimized]);

  const handleSendMessage = async (customText = null) => {
    const textToSend = (customText || inputValue).trim();
    if (!textToSend || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await api.post('/ai/chat/', {
        message: textToSend,
        history: messages.slice(-6).map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          text: m.text,
        })),
      });

      const responseData = res.data;

      const aiMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: responseData.reply || 'দুঃখিত, কোনো উত্তর পাওয়া যায়নি।',
        products: responseData.products || [],
        order: responseData.order || null,
        intent: responseData.intent || 'general',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error('AI Chat Error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          text: 'দুঃখিত, এই মুহূর্তে সার্ভারে সংযোগ করতে সমস্যা হচ্ছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
          products: [],
          order: null,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCartFromCard = async (e, product) => {
    e.stopPropagation();
    e.preventDefault();
    if (!product || addingId) return;

    try {
      const variantId = product.primary_variant_id || (product.variants && product.variants[0]?.id);
      if (variantId) {
        setAddingId(product.id);
        const res = await addToCart(variantId, 1, false);
        if (res?.success) {
          setAddedProductIds((prev) => ({ ...prev, [product.id]: true }));
        }
      } else {
        window.location.href = `/products/${product.id}`;
      }
    } catch (err) {
      console.warn('Failed to add to cart from AI card:', err);
    } finally {
      setAddingId(null);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-new',
        role: 'assistant',
        text: 'কথোপকথন রিফ্রেশ করা হয়েছে। আপনাকে কীভাবে সাহায্য করতে পারি? যেকোনো প্রশ্ন বা পছন্দ লিখে জানান!',
        products: [],
        order: null,
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <>
      {/* Floating Launcher Button (Positioned neatly above WhatsApp button) */}
      {!isOpen && (
        <div className="fixed bottom-20 lg:bottom-22 right-4 sm:right-6 z-40 flex items-center pointer-events-auto">
          <button
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
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
      )}

      {/* Chat Drawer / Modal */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ease-in-out ${
            isMinimized
              ? 'bottom-20 right-4 sm:right-6 w-80 h-14'
              : 'bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[420px] h-[92vh] sm:h-[620px] max-h-[95vh]'
          }`}
        >
          <div className="flex flex-col h-full bg-white sm:rounded-3xl shadow-2xl border border-neutral-200/90 overflow-hidden">
            {/* Header */}
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
                  onClick={handleResetChat}
                  title="নতুন কথোপকথন শুরু করুন"
                  className="p-1.5 text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  title={isMinimized ? 'বড় করুন' : 'মিনিমাইজ করুন'}
                  className="p-1.5 text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="বন্ধ করুন"
                  className="p-1.5 text-neutral-300 hover:text-rose-400 hover:bg-white/10 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Body (Hidden when minimized) */}
            {!isMinimized && (
              <>
                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4 bg-neutral-50/60 text-xs">
                  {messages.map((m) => {
                    const isAi = m.role === 'assistant';

                    return (
                      <div
                        key={m.id}
                        className={`flex gap-2.5 ${isAi ? 'items-start' : 'items-end flex-row-reverse'}`}
                      >
                        {/* Avatar */}
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                            isAi
                              ? 'bg-[#1b3b2b] text-amber-300 shadow-xs'
                              : 'bg-amber-600 text-white shadow-xs'
                          }`}
                        >
                          {isAi ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                        </div>

                        {/* Content */}
                        <div className={`space-y-2 ${isAi && m.products?.length > 0 ? 'w-full max-w-full' : 'max-w-[84%]'} ${isAi ? '' : 'text-right'}`}>
                          <div
                            className={`p-3 rounded-2xl shadow-xs leading-relaxed whitespace-pre-wrap break-words ${
                              isAi
                                ? 'bg-white text-neutral-800 border border-neutral-200/80 rounded-tl-xs'
                                : 'bg-[#1b3b2b] text-white rounded-tr-xs'
                            }`}
                          >
                            {m.text}
                          </div>

                          {/* Order Tracking Progress Card (If order matched) */}
                          {m.order && (
                            <div className="bg-white border border-neutral-200 rounded-2xl p-3.5 space-y-3 text-left shadow-xs">
                              <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                                <div>
                                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                                    অর্ডার আইডি
                                  </span>
                                  <p className="font-mono font-black text-xs text-[#1b3b2b]">
                                    {m.order.order_number}
                                  </p>
                                </div>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                  {m.order.status_title}
                                </span>
                              </div>

                              {/* Progress Step Stepper */}
                              <div className="py-1">
                                <div className="grid grid-cols-5 gap-1 items-center text-center">
                                  {['গৃহীত', 'কনফার্মড', 'প্রসেসিং', 'শিপড', 'ডেলিভারি'].map((stepName, i) => {
                                    const stepIdx = i + 1;
                                    const isDone = m.order.step >= stepIdx;
                                    const isCurrent = m.order.step === stepIdx;

                                    return (
                                      <div key={stepName} className="flex flex-col items-center">
                                        <div
                                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                            isDone
                                              ? 'bg-emerald-600 text-white'
                                              : isCurrent
                                                ? 'bg-amber-500 text-white animate-pulse'
                                                : 'bg-neutral-200 text-neutral-500'
                                          }`}
                                        >
                                          {isDone ? '✓' : stepIdx}
                                        </div>
                                        <span className="text-[9px] mt-1 text-neutral-500 font-medium truncate w-full">
                                          {stepName}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="text-[11px] text-neutral-600 bg-neutral-50 p-2.5 rounded-xl space-y-1">
                                <div className="flex justify-between">
                                  <span>গ্রাহক:</span>
                                  <span className="font-bold text-neutral-800">{m.order.full_name}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>মোট বিল:</span>
                                  <span className="font-black text-[#1b3b2b]">
                                    ৳{Number(m.order.total).toLocaleString()} ({m.order.payment_method})
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>ঠিকানা:</span>
                                  <span className="text-neutral-700 truncate max-w-[170px]">{m.order.address}</span>
                                </div>
                              </div>

                              <Link
                                to={`/track-order/${m.order.order_number}`}
                                onClick={() => setIsOpen(false)}
                                className="inline-flex items-center justify-center gap-1.5 w-full py-2 bg-[#1b3b2b] text-white rounded-xl font-bold text-xs hover:bg-[#234d38] transition shadow-xs"
                              >
                                <span>পূর্ণাঙ্গ ট্র্যাকিং পেজ দেখুন</span>
                                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                              </Link>
                            </div>
                          )}

                          {/* Recommended Product Cards List */}
                          {m.products && m.products.length > 0 && (
                            <div className="space-y-2.5 pt-1 text-left w-full">
                              <div className="flex items-center justify-between text-[11px] font-bold text-neutral-600">
                                <span className="flex items-center gap-1.5 text-[#1b3b2b]">
                                  <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                                  <span>বাছাইকৃত পণ্যসমূহ ({m.products.length}):</span>
                                </span>
                                <span className="text-[10px] text-neutral-400 font-normal">
                                  সরাসরি কার্টে যোগ করুন
                                </span>
                              </div>

                              <div className="flex flex-col gap-2.5">
                                {m.products.map((p) => {
                                  const isAdded = !!addedProductIds[p.id];
                                  const isCurrentAdding = addingId === p.id;

                                  return (
                                    <div
                                      key={p.id}
                                      className={`bg-white border rounded-2xl p-2.5 sm:p-3 shadow-xs transition-all duration-200 flex flex-col justify-between ${
                                        isAdded
                                          ? 'border-emerald-500/80 bg-emerald-50/20 shadow-xs'
                                          : 'border-neutral-200/90 hover:border-amber-400 hover:shadow-md'
                                      }`}
                                    >
                                      <div className="flex items-start gap-3">
                                        {/* Thumbnail */}
                                        <Link
                                          to={`/products/${p.id}`}
                                          onClick={() => setIsOpen(false)}
                                          className="w-16 h-16 rounded-xl bg-neutral-100 border border-neutral-200/80 overflow-hidden shrink-0 flex items-center justify-center group"
                                        >
                                          {p.thumbnail ? (
                                            <img
                                              src={formatImageUrl(p.thumbnail)}
                                              alt={p.name}
                                              className="w-full h-full object-cover group-hover:scale-105 transition"
                                              loading="lazy"
                                            />
                                          ) : (
                                            <Package className="w-6 h-6 text-neutral-300" />
                                          )}
                                        </Link>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-sm inline-block mb-0.5">
                                            {p.category_name}
                                          </span>
                                          <Link
                                            to={`/products/${p.id}`}
                                            onClick={() => setIsOpen(false)}
                                            className="font-bold text-neutral-900 text-xs line-clamp-1 hover:text-[#1b3b2b] transition block"
                                            title={p.name}
                                          >
                                            {p.name}
                                          </Link>

                                          {/* Price & Discount */}
                                          <div className="flex items-center gap-2 mt-1">
                                            <span className="font-black text-xs text-[#1b3b2b]">
                                              ৳{Number(p.starting_price).toLocaleString()}
                                            </span>
                                            {p.is_on_sale && p.max_discount > 0 && (
                                              <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded-full border border-rose-200/60">
                                                -{p.max_discount}%
                                              </span>
                                            )}
                                            {p.available_sizes && p.available_sizes.length > 0 && (
                                              <span className="text-[9px] text-neutral-500 truncate">
                                                সাইজ: {p.available_sizes.join(', ')}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Action Row */}
                                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-neutral-100">
                                        <button
                                          onClick={(e) => handleAddToCartFromCard(e, p)}
                                          disabled={isCurrentAdding}
                                          className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
                                            isAdded
                                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                              : 'bg-[#1b3b2b] text-white hover:bg-[#25523c] active:scale-[0.98]'
                                          }`}
                                        >
                                          {isAdded ? (
                                            <>
                                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                              <span>কার্টে যোগ হয়েছে!</span>
                                            </>
                                          ) : isCurrentAdding ? (
                                            <span>যুক্ত হচ্ছে...</span>
                                          ) : (
                                            <>
                                              <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />
                                              <span>কার্টে নিন (Add to Cart)</span>
                                            </>
                                          )}
                                        </button>

                                        <Link
                                          to={`/products/${p.id}`}
                                          onClick={() => setIsOpen(false)}
                                          className="p-1.5 px-2.5 rounded-xl border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 font-semibold text-[10px] flex items-center gap-1 shrink-0"
                                          title="বিস্তারিত দেখুন"
                                        >
                                          <span>বিস্তারিত</span>
                                          <ArrowRight className="w-3 h-3" />
                                        </Link>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing Indicator */}
                  {isLoading && (
                    <div className="flex items-center gap-2 text-neutral-400">
                      <div className="w-7 h-7 rounded-xl bg-[#1b3b2b] text-amber-300 flex items-center justify-center">
                        <Bot className="w-4 h-4 animate-spin" />
                      </div>
                      <div className="bg-white border border-neutral-200 px-3 py-2 rounded-2xl rounded-tl-xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Live In-Chat Cart Bar (Appears when items are in cart) */}
                {totalItems > 0 && (
                  <div className="bg-emerald-50/95 border-t border-b border-emerald-200/80 px-3.5 py-2 flex items-center justify-between text-xs shrink-0 select-none shadow-xs">
                    <div className="flex items-center gap-1.5 text-emerald-950 font-bold">
                      <ShoppingBag className="w-4 h-4 text-emerald-700" />
                      <span>কার্টে {totalItems}টি পণ্য (৳{Number(totalPrice).toLocaleString()})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setIsMinimized(true);
                          openDrawer();
                        }}
                        className="px-2.5 py-1 bg-[#1b3b2b] text-white rounded-lg font-bold text-[11px] hover:bg-[#285740] transition cursor-pointer shadow-xs"
                      >
                        ব্যাগ দেখুন
                      </button>
                      <Link
                        to="/checkout"
                        onClick={() => setIsOpen(false)}
                        className="px-2.5 py-1 bg-amber-500 text-neutral-900 rounded-lg font-black text-[11px] hover:bg-amber-400 transition shadow-xs"
                      >
                        অর্ডার সম্পন্ন করুন ➔
                      </Link>
                    </div>
                  </div>
                )}

                {/* Quick Suggestion Pills */}
                <div className="p-2 bg-white border-t border-neutral-100 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                  {QUICK_SUGGESTIONS.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => handleSendMessage(item.query)}
                      disabled={isLoading}
                      className="px-2.5 py-1 rounded-full bg-neutral-100 hover:bg-amber-100 hover:text-amber-900 text-neutral-700 text-[11px] font-medium whitespace-nowrap border border-neutral-200/70 transition shrink-0 active:scale-95"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Input Bar */}
                <div className="p-3 bg-white border-t border-neutral-200 shrink-0">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
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
                      className="w-10 h-10 rounded-2xl bg-[#1b3b2b] text-amber-400 hover:bg-[#25523c] flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                  <p className="text-[9px] text-center text-neutral-400 mt-1.5 font-medium">
                    Kids & Family AI Assistant • Real-time Order & Product Recommendations
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

