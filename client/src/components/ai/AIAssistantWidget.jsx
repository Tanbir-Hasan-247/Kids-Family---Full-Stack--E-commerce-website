import React, { useState, useEffect, useRef } from 'react';
import { Bot, User as UserIcon, ShoppingBag } from 'lucide-react';
import api, { getSessionKey } from '../../api/axios';
import { useCart } from '../../context/CartContext';
import ChatLauncherButton from './ChatLauncherButton';
import ChatHeader from './ChatHeader';
import ChatProductCard from './ChatProductCard';
import ChatOrderCard from './ChatOrderCard';
import ChatOrderCreatedCard from './ChatOrderCreatedCard';
import ChatLiveCartBar from './ChatLiveCartBar';
import ChatQuickSuggestions from './ChatQuickSuggestions';
import ChatInputBar from './ChatInputBar';

const QUICK_SUGGESTIONS = [
  { label: '🛍️ চ্যাটেই সরাসরি অর্ডার', query: 'আমি সরাসরি চ্যাটে অর্ডার করতে চাই' },
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
  const { addToCart, totalItems, totalPrice, openDrawer, fetchCart } = useCart();

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
        session_key: getSessionKey(),
        history: messages.slice(-12).map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          text: m.text,
          products: m.products || [],
          product_ids: (m.products || []).map((p) => p.id),
        })),
      });

      const responseData = res.data;

      const aiMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: responseData.reply || 'দুঃখিত, কোনো উত্তর পাওয়া যায়নি।',
        products: responseData.products || [],
        order: responseData.order || null,
        orderCreated: !!responseData.order_created,
        intent: responseData.intent || 'general',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // If order was created or cart was updated, refresh cart
      if ((responseData.order_created || responseData.cart_updated) && fetchCart) {
        fetchCart();
      }

      if (responseData.cart_updated && responseData.added_product_id) {
        setAddedProductIds((prev) => ({ ...prev, [responseData.added_product_id]: true }));
      }
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
      const variantId =
        product.primary_variant_id || (product.variants && product.variants[0]?.id);
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
      {/* Floating Launcher Button */}
      {!isOpen && (
        <ChatLauncherButton
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
        />
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
            <ChatHeader
              isMinimized={isMinimized}
              onReset={handleResetChat}
              onToggleMinimize={() => setIsMinimized(!isMinimized)}
              onClose={() => setIsOpen(false)}
            />

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
                        <div
                          className={`space-y-2 ${
                            isAi && m.products?.length > 0 ? 'w-full max-w-full' : 'max-w-[84%]'
                          } ${isAi ? '' : 'text-right'}`}
                        >
                          <div
                            className={`p-3 rounded-2xl shadow-xs leading-relaxed whitespace-pre-wrap break-words ${
                              isAi
                                ? 'bg-white text-neutral-800 border border-neutral-200/80 rounded-tl-xs'
                                : 'bg-[#1b3b2b] text-white rounded-tr-xs'
                            }`}
                          >
                            {m.text}
                          </div>

                          {/* Order Created Celebration Card */}
                          {m.order && m.orderCreated && (
                            <ChatOrderCreatedCard
                              order={m.order}
                              onNavigate={() => setIsOpen(false)}
                            />
                          )}

                          {/* Order Tracking Progress Card */}
                          {m.order && !m.orderCreated && (
                            <ChatOrderCard
                              order={m.order}
                              onNavigate={() => setIsOpen(false)}
                            />
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
                                {m.products.map((p) => (
                                  <ChatProductCard
                                    key={p.id}
                                    product={p}
                                    isAdded={!!addedProductIds[p.id]}
                                    isAdding={addingId === p.id}
                                    onAddToCart={handleAddToCartFromCard}
                                    onNavigate={() => setIsOpen(false)}
                                  />
                                ))}
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

                {/* Live In-Chat Cart Bar */}
                <ChatLiveCartBar
                  totalItems={totalItems}
                  totalPrice={totalPrice}
                  onViewBag={() => {
                    setIsMinimized(true);
                    openDrawer();
                  }}
                  onCheckout={() => setIsOpen(false)}
                />

                {/* Quick Suggestion Pills */}
                <ChatQuickSuggestions
                  suggestions={QUICK_SUGGESTIONS}
                  isLoading={isLoading}
                  onSelect={(query) => handleSendMessage(query)}
                />

                {/* Input Bar */}
                <ChatInputBar
                  inputValue={inputValue}
                  setInputValue={setInputValue}
                  isLoading={isLoading}
                  onSubmit={() => handleSendMessage()}
                  inputRef={inputRef}
                />
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
