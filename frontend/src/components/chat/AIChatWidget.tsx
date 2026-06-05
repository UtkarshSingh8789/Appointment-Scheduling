import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle,
  Move,
  Maximize2,
  Minimize2,
  History,
  Plus,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import api from '@/services/api';
import { loyaltyService } from '@/services/loyaltyService';
import type { UserRole } from '@/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: ChatAction[];
}

interface StoredChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actions?: ChatAction[];
}

interface ChatAction {
  label: string;
  value: string;
  type: 'provider' | 'date' | 'slot' | 'confirm' | 'cancel' | 'suggestion' | 'link';
  data?: Record<string, unknown>;
}

// Booking flow states
type BookingStep =
  | 'idle'
  | 'ask_service'
  | 'show_providers'
  | 'ask_date'
  | 'show_slots'
  | 'confirm'
  | 'booked';

interface BookingState {
  step: BookingStep;
  service?: string;
  providerId?: string;
  providerName?: string;
  date?: string;
  slot?: string;
  endTime?: string;
}

interface ChatThread {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: StoredChatMessage[];
  booking: BookingState;
  suggestions: string[];
}

const ROLE_SUGGESTIONS: Record<UserRole, string[]> = {
  customer: [
    'Book an appointment',
    'Show my upcoming appointments',
    'What are my loyalty points?',
    'How do I reschedule?',
    'Find a doctor near me',
  ],
  provider: [
    'How many pending requests?',
    'How to manage my availability?',
    'What is my average rating?',
    'Show my schedule today',
  ],
  admin: [
    'Show platform overview',
    'How many new users this week?',
    'What is the cancellation rate?',
    'Show revenue stats',
  ],
};

export const AIChatWidget: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [booking, setBooking] = useState<BookingState>({ step: 'idle' });
  const [isMaximized, setIsMaximized] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState('');
  const [position, setPosition] = useState(() => ({
    x: typeof window !== 'undefined' ? Math.max(window.innerWidth - 440, 16) : 16,
    y: typeof window !== 'undefined' ? Math.max(window.innerHeight - 620, 16) : 16,
  }));
  const [size, setSize] = useState(() => ({
    width: Math.min(440, typeof window !== 'undefined' ? window.innerWidth - 32 : 440),
    height: 560,
  }));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const resizeStateRef = useRef<{ width: number; height: number; startX: number; startY: number } | null>(null);
  const positionRef = useRef(position);
  const sizeRef = useRef(size);
  const isMaximizedRef = useRef(isMaximized);
  const storageKey = user?.id ? `appointease-chat-threads-${user.id}` : '';

  if (!isAuthenticated) return null;

  const userRole = user?.role || 'customer';
  const initialSuggestions = ROLE_SUGGESTIONS[userRole] || ROLE_SUGGESTIONS.customer;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  useEffect(() => {
    isMaximizedRef.current = isMaximized;
  }, [isMaximized]);

  const serializeMessages = (items: ChatMessage[]): StoredChatMessage[] =>
    items.map((item) => ({
      ...item,
      timestamp: item.timestamp.toISOString(),
    }));

  const hydrateMessages = (items: StoredChatMessage[]): ChatMessage[] =>
    items.map((item) => ({
      ...item,
      timestamp: new Date(item.timestamp),
    }));

  const deriveThreadTitle = (items: ChatMessage[], currentBooking: BookingState): string => {
    if (currentBooking.service) {
      return `${currentBooking.service} booking`;
    }
    const firstUserMessage = items.find((message) => message.role === 'user');
    if (firstUserMessage?.content) {
      return firstUserMessage.content.slice(0, 28);
    }
    return 'New chat';
  };

  const persistThread = (threadId: string, nextMessages: ChatMessage[], nextBooking: BookingState, nextSuggestions: string[]) => {
    if (!storageKey || !threadId) return;
    const snapshot: ChatThread = {
      id: threadId,
      title: deriveThreadTitle(nextMessages, nextBooking),
      createdAt: threads.find((thread) => thread.id === threadId)?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: serializeMessages(nextMessages),
      booking: nextBooking,
      suggestions: nextSuggestions,
    };

    setThreads((prev) => {
      const existingIndex = prev.findIndex((thread) => thread.id === threadId);
      const next = existingIndex >= 0
        ? prev.map((thread) => (thread.id === threadId ? snapshot : thread))
        : [snapshot, ...prev];
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  const resetCurrentChat = () => {
    setMessages([]);
    setBooking({ step: 'idle' });
    setSuggestions(initialSuggestions.slice(0, 3));
    setInput('');
    setIsTyping(false);
    setShowHistory(false);
  };

  const startNewChat = () => {
    const id = crypto.randomUUID();
    const thread: ChatThread = {
      id,
      title: 'New chat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      booking: { step: 'idle' },
      suggestions: initialSuggestions.slice(0, 3),
    };
    setThreads((prev) => [thread, ...prev.filter((item) => item.id !== id)]);
    setActiveThreadId(id);
    resetCurrentChat();
  };

  const loadThread = (thread: ChatThread) => {
    setActiveThreadId(thread.id);
    setMessages(hydrateMessages(thread.messages));
    setBooking(thread.booking || { step: 'idle' });
    setSuggestions(thread.suggestions || initialSuggestions.slice(0, 3));
    setInput('');
    setIsTyping(false);
    setShowHistory(false);
  };

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatThread[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setThreads(parsed);
          setActiveThreadId(parsed[0].id);
          setMessages(hydrateMessages(parsed[0].messages || []));
          setBooking(parsed[0].booking || { step: 'idle' });
          setSuggestions(parsed[0].suggestions || initialSuggestions.slice(0, 3));
          return;
        }
      }
    } catch {
      // Ignore malformed local cache and fall back to a fresh chat.
    }

    const freshThread: ChatThread = {
      id: crypto.randomUUID(),
      title: 'New chat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      booking: { step: 'idle' },
      suggestions: initialSuggestions.slice(0, 3),
    };
    setThreads([freshThread]);
    setActiveThreadId(freshThread.id);
    setMessages([]);
    setBooking({ step: 'idle' });
    setSuggestions(initialSuggestions.slice(0, 3));
  }, [storageKey, initialSuggestions]);

  useEffect(() => {
    if (!activeThreadId || !storageKey) return;
    persistThread(activeThreadId, messages, booking, suggestions);
    // Persisting only the active chat keeps older conversations available and unchanged.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, booking, suggestions, activeThreadId, storageKey]);

  useEffect(() => {
    if (!isOpen || isMaximized) return;
    const maxX = Math.max(window.innerWidth - size.width - 16, 16);
    const maxY = Math.max(window.innerHeight - size.height - 16, 16);
    setPosition((prev) => ({
      x: Math.min(prev.x, maxX),
      y: Math.min(prev.y, maxY),
    }));
  }, [isOpen, isMaximized, size.width, size.height]);

  const addMessage = (role: 'user' | 'assistant', content: string, actions?: ChatAction[]) => {
    const msg: ChatMessage = {
      id: `${role}-${Date.now()}`,
      role,
      content,
      timestamp: new Date(),
      actions,
    };
    setMessages((prev) => [...prev, msg]);
    return msg;
  };

  const startDrag = (event: React.PointerEvent<HTMLElement>) => {
    if (isMaximizedRef.current) return;
    dragStateRef.current = {
      x: positionRef.current.x,
      y: positionRef.current.y,
      startX: event.clientX,
      startY: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onDragMove = (event: PointerEvent) => {
    if (!dragStateRef.current || isMaximizedRef.current) return;
    const dx = event.clientX - dragStateRef.current.startX;
    const dy = event.clientY - dragStateRef.current.startY;
    const currentSize = sizeRef.current;
    const nextX = Math.max(16, Math.min(window.innerWidth - currentSize.width - 16, dragStateRef.current.x + dx));
    const nextY = Math.max(16, Math.min(window.innerHeight - currentSize.height - 16, dragStateRef.current.y + dy));
    setPosition({ x: nextX, y: nextY });
  };

  const stopDrag = () => {
    dragStateRef.current = null;
  };

  const startResize = (event: React.PointerEvent<HTMLElement>) => {
    if (isMaximizedRef.current) return;
    resizeStateRef.current = {
      width: sizeRef.current.width,
      height: sizeRef.current.height,
      startX: event.clientX,
      startY: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onResizeMove = (event: PointerEvent) => {
    if (!resizeStateRef.current || isMaximizedRef.current) return;
    const dx = event.clientX - resizeStateRef.current.startX;
    const dy = event.clientY - resizeStateRef.current.startY;
    const nextWidth = Math.max(340, Math.min(window.innerWidth - 32, resizeStateRef.current.width + dx));
    const nextHeight = Math.max(420, Math.min(window.innerHeight - 32, resizeStateRef.current.height + dy));
    setSize({ width: nextWidth, height: nextHeight });
  };

  const stopResize = () => {
    resizeStateRef.current = null;
  };

  useEffect(() => {
    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', stopDrag);
    window.addEventListener('pointermove', onResizeMove);
    window.addEventListener('pointerup', stopResize);
    return () => {
      window.removeEventListener('pointermove', onDragMove);
      window.removeEventListener('pointerup', stopDrag);
      window.removeEventListener('pointermove', onResizeMove);
      window.removeEventListener('pointerup', stopResize);
    };
  }, []);

  // ─── Booking Flow ──────────────────────────────────────────────────────────

  const isBookingIntent = (text: string) => {
    const q = text.toLowerCase();
    return (
      q.includes('book') ||
      q.includes('appointment') ||
      q.includes('schedule') ||
      q.includes('reserve') ||
      q.includes('find a') ||
      q.includes('need a') ||
      q.includes('want to see') ||
      q.includes('consult')
    );
  };

  const extractBookingSearchQuery = (text: string) =>
    text
      .toLowerCase()
      .replace(
        /\b(i|want|would|like|need|to|please|book|booking|appointment|appointments|schedule|reserve|find|me|a|an|with|for|show)\b/g,
        ' '
      )
      .replace(/\s+/g, ' ')
      .trim();

  const startBookingFlow = async (userMessage: string) => {
    setBooking({ step: 'ask_service' });
    setIsTyping(true);

    // Extract service hint from message
    const q = userMessage.toLowerCase();
    let serviceHint = '';
    if (q.includes('doctor') || q.includes('medical') || q.includes('health')) serviceHint = 'Healthcare';
    else if (q.includes('dentist') || q.includes('dental') || q.includes('teeth')) serviceHint = 'Dental Care';
    else if (q.includes('yoga') || q.includes('fitness') || q.includes('gym')) serviceHint = 'Fitness Training';
    else if (q.includes('beauty') || q.includes('salon') || q.includes('hair')) serviceHint = 'Beauty & Wellness';
    else if (q.includes('lawyer') || q.includes('legal')) serviceHint = 'Legal Services';
    else if (q.includes('tutor') || q.includes('teach') || q.includes('learn')) serviceHint = 'Education & Tutoring';

    await new Promise((r) => setTimeout(r, 600));
    setIsTyping(false);

    if (serviceHint) {
      // Skip asking, go straight to providers
      await searchProviders(serviceHint);
    } else {
      const extractedQuery = extractBookingSearchQuery(userMessage);
      if (extractedQuery.length >= 3) {
        const foundProviders = await searchProviders(extractedQuery, { keepFlowOnEmpty: true });
        if (foundProviders) return;
      }

      addMessage('assistant',
        'What type of service are you looking for? I can help you find and book an appointment.',
        [
          { label: 'Healthcare', value: 'Healthcare', type: 'suggestion' },
          { label: 'Dental Care', value: 'Dental Care', type: 'suggestion' },
          { label: 'Fitness Training', value: 'Fitness Training', type: 'suggestion' },
          { label: 'Beauty & Wellness', value: 'Beauty & Wellness', type: 'suggestion' },
          { label: 'Mental Health', value: 'Mental Health', type: 'suggestion' },
          { label: 'Legal Services', value: 'Legal Services', type: 'suggestion' },
        ]
      );
    }
  };

  const searchProviders = async (
    service: string,
    options?: { keepFlowOnEmpty?: boolean }
  ) => {
    setBooking((prev) => ({ ...prev, step: 'show_providers', service }));
    setIsTyping(true);

    try {
      const res = await api.get('/providers', {
        params: { search: service, page: 1, per_page: 5 },
      });
      const providers = res.data.providers || [];

      await new Promise((r) => setTimeout(r, 400));
      setIsTyping(false);

      if (providers.length === 0) {
        const categoriesRes = await api.get('/categories');
        const categories = categoriesRes.data || [];
        const serviceWords = service.toLowerCase();
        const matchedCategory = categories.find((category: { id: string; name: string }) =>
          category.name.toLowerCase().includes(serviceWords) ||
          serviceWords.includes(category.name.toLowerCase().split(' ')[0])
        );

        if (matchedCategory) {
          const retry = await api.get('/providers', {
            params: { category_id: matchedCategory.id, page: 1, per_page: 5 },
          });
          const retryProviders = retry.data.providers || [];
          if (retryProviders.length > 0) {
            const retryActions: ChatAction[] = retryProviders.map((p: { id: string; user?: { full_name?: string }; specialization?: string; location?: string; rating?: number; hourly_rate?: number }) => ({
              label: `${p.user?.full_name || 'Provider'} — ${p.specialization || service} (${p.location || 'N/A'}) ★${(p.rating || 0).toFixed(1)} • ₹${p.hourly_rate || 'N/A'}/hr`,
              value: p.id,
              type: 'provider' as const,
              data: { name: p.user?.full_name, specialization: p.specialization },
            }));

            addMessage('assistant',
              `I found providers under ${matchedCategory.name}. Which one would you like to book with?`,
              retryActions
            );
            return true;
          }
        }

        if (options?.keepFlowOnEmpty) {
          setBooking({ step: 'ask_service' });
          return false;
        }

        addMessage('assistant', `I couldn’t find a matching provider for "${service}". Try another category or search by provider name.`, [
          { label: 'Try Healthcare', value: 'Healthcare', type: 'suggestion' },
          { label: 'Try Fitness', value: 'Fitness Training', type: 'suggestion' },
        ]);
        setBooking({ step: 'idle' });
        return false;
      }

      const actions: ChatAction[] = providers.map((p: { id: string; user?: { full_name?: string }; specialization?: string; location?: string; rating?: number; hourly_rate?: number }) => ({
        label: `${p.user?.full_name || 'Provider'} — ${p.specialization || service} (${p.location || 'N/A'}) ★${(p.rating || 0).toFixed(1)} • ₹${p.hourly_rate || 'N/A'}/hr`,
        value: p.id,
        type: 'provider' as const,
        data: { name: p.user?.full_name, specialization: p.specialization },
      }));

      addMessage('assistant',
        `Here are available ${service} providers. Which one would you like to book with?`,
        actions
      );
      return true;
    } catch {
      setIsTyping(false);
      addMessage('assistant', 'Could not load providers right now. Please try again.');
      setBooking({ step: 'idle' });
      return false;
    }
  };

  const selectProvider = async (providerId: string, providerName: string) => {
    setBooking((prev) => ({ ...prev, step: 'ask_date', providerId, providerName }));
    setIsTyping(true);
    await new Promise((r) => setTimeout(r, 400));
    setIsTyping(false);

    // Generate next 7 available dates
    const today = new Date();
    const dates: ChatAction[] = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const label = i === 1 ? 'Tomorrow' : i === 2 ? 'Day after tomorrow' :
        d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
      dates.push({ label, value: dateStr, type: 'date' });
    }

    addMessage('assistant',
      `Great choice! When would you like to book with ${providerName}?`,
      dates
    );
  };

  const selectDate = async (date: string) => {
    const { providerId, providerName } = booking;
    if (!providerId) return;

    setBooking((prev) => ({ ...prev, step: 'show_slots', date }));
    setIsTyping(true);

    try {
      const res = await api.get(`/availability/${providerId}/slots`, {
        params: { date },
      });
      const slots = res.data.slots || [];

      await new Promise((r) => setTimeout(r, 400));
      setIsTyping(false);

      if (slots.length === 0) {
        addMessage('assistant',
          `No available slots on ${date} for ${providerName}. Please choose another date.`,
          [
            { label: 'Choose different date', value: 'change_date', type: 'suggestion' },
          ]
        );
        setBooking((prev) => ({ ...prev, step: 'ask_date' }));
        return;
      }

      const slotActions: ChatAction[] = slots.slice(0, 8).map((s: { start_time: string; end_time: string }) => ({
        label: `${formatTime(s.start_time)} – ${formatTime(s.end_time)}`,
        value: s.start_time,
        type: 'slot' as const,
        data: { end_time: s.end_time },
      }));

      const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
        weekday: 'long', month: 'long', day: 'numeric'
      });

      addMessage('assistant',
        `Available slots on ${dateLabel} with ${providerName}:`,
        slotActions
      );
    } catch {
      setIsTyping(false);
      addMessage('assistant', 'Could not load time slots. Please try again.');
    }
  };

  const selectSlot = async (slot: string, endTime: string) => {
    const { providerId, providerName, date } = booking;
    if (!providerId || !date) return;

    setBooking((prev) => ({ ...prev, step: 'confirm', slot, endTime }));

    const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday: 'long', month: 'long', day: 'numeric'
    });

    addMessage('assistant',
      `Please confirm your booking:\n\nProvider: ${providerName}\nDate: ${dateLabel}\nTime: ${formatTime(slot)} – ${formatTime(endTime)}\n\nShall I confirm this appointment?`,
      [
        { label: 'Yes, confirm booking', value: 'confirm', type: 'confirm' },
        { label: 'No, cancel', value: 'cancel', type: 'cancel' },
      ]
    );
  };

  const confirmBooking = async () => {
    const { providerId, date, slot } = booking;
    if (!providerId || !date || !slot) return;

    setBooking({ step: 'booked' });
    navigate(`/book/${providerId}?date=${date}&time=${slot}`);
    setIsOpen(false);
  };

  // ─── Main message handler ──────────────────────────────────────────────────

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isTyping) return;

    addMessage('user', messageText);
    setInput('');
    setSuggestions([]);

    // Handle booking flow actions
    if (messageText === 'confirm' && booking.step === 'confirm') {
      await confirmBooking();
      return;
    }
    if (messageText === 'cancel' && booking.step === 'confirm') {
      setBooking({ step: 'idle' });
      addMessage('assistant', 'Booking cancelled. How else can I help you?');
      setSuggestions(initialSuggestions.slice(0, 3));
      return;
    }
    if (messageText === 'change_date' && booking.step === 'ask_date') {
      const { providerId, providerName } = booking;
      if (providerId && providerName) await selectProvider(providerId, providerName);
      return;
    }
    if (messageText === 'book another') {
      setBooking({ step: 'idle' });
      await startBookingFlow('book appointment');
      return;
    }

    // Customer booking flow
    if (userRole === 'customer' && isBookingIntent(messageText) && booking.step === 'idle') {
      await startBookingFlow(messageText);
      return;
    }

    // Service selection
    if (booking.step === 'ask_service') {
      await searchProviders(messageText);
      return;
    }

    if (userRole === 'customer' && /(loyalty|points|wallet)/i.test(messageText) && booking.step === 'idle') {
      try {
        const account = await loyaltyService.getAccount();
        addMessage(
          'assistant',
          `You currently have ${account.points.toLocaleString('en-IN')} loyalty points in your wallet. Your tier is ${account.tier}.`
        );
      } catch {
        addMessage('assistant', 'I could not load your wallet right now. Please open the Wallet page for the latest balance.');
      }
      return;
    }

    // Regular AI response
    setIsTyping(true);
    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await api.post('/ai-chat', {
        message: messageText,
        conversation_history: conversationHistory,
      });

      const { reply, suggestions: newSuggestions, actions } = response.data;
      addMessage('assistant', reply, actions || []);
      setSuggestions(newSuggestions || []);
    } catch {
      addMessage('assistant', getFallbackResponse(messageText));
    } finally {
      setIsTyping(false);
    }
  };

  const handleAction = async (action: ChatAction) => {
    if (action.type === 'provider') {
      addMessage('user', action.label.split(' — ')[0]);
      await selectProvider(action.value, action.data?.name as string || action.label.split(' — ')[0]);
    } else if (action.type === 'date') {
      addMessage('user', action.label);
      await selectDate(action.value);
    } else if (action.type === 'slot') {
      addMessage('user', action.label);
      await selectSlot(action.value, action.data?.end_time as string || '');
    } else if (action.type === 'confirm') {
      addMessage('user', 'Yes, confirm booking');
      await confirmBooking();
    } else if (action.type === 'cancel') {
      addMessage('user', 'No, cancel');
      setBooking({ step: 'idle' });
      addMessage('assistant', 'Booking cancelled. How else can I help you?');
    } else if (action.type === 'link') {
      addMessage('user', action.label);
      navigate(action.value);
      setIsOpen(false);
    } else if (action.type === 'suggestion') {
      await handleSend(action.value);
    }
  };

  const getFallbackResponse = (userMessage: string): string => {
    const q = userMessage.toLowerCase();
    const firstName = user?.full_name?.split(' ')[0] || 'there';

    if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
      const hour = new Date().getHours();
      const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      return `${greeting}, ${firstName}! I can help you book appointments, check your schedule, or answer questions about the platform. What would you like to do?`;
    }
    if (q.includes('loyalty') || q.includes('points')) {
      return 'Check your loyalty points in the Wallet section. You earn points on every completed booking.';
    }
    if (q.includes('reschedule')) {
      return 'To reschedule: Go to My Appointments → Click the appointment → Reschedule → Pick a new date and time.';
    }
    if (q.includes('cancel')) {
      return 'To cancel: Go to My Appointments → Click the appointment → Cancel Appointment.';
    }
    return 'I can help you book appointments, check your schedule, or answer questions. What would you like to do?';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const activeSuggestions = suggestions.length > 0
    ? suggestions
    : messages.length === 0
    ? initialSuggestions.slice(0, 3)
    : [];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed z-50 flex flex-col border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl rounded-xl overflow-hidden"
            style={
              isMaximized
                ? { left: 16, top: 16, width: 'calc(100vw - 32px)', height: 'calc(100vh - 32px)' }
                : { left: position.x, top: position.y, width: size.width, height: size.height }
            }
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-black dark:bg-gray-900"
              onPointerDown={(e) => {
                if ((e.target as HTMLElement).closest('button')) return;
                startDrag(e as React.PointerEvent<HTMLDivElement>);
              }}
            >
              <div className="flex items-center gap-2 text-white">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-black dark:text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">AppointEase AI</p>
                  <p className="text-[10px] text-gray-400">
                    {booking.step !== 'idle' ? '● Booking in progress...' : `${userRole} mode`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowHistory((value) => !value)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white"
                  aria-label={showHistory ? 'Hide chat history' : 'Show chat history'}
                >
                  <History className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={startNewChat}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 inline-block mr-1" />
                  New chat
                </button>
                <button
                  type="button"
                  onClick={() => setIsMaximized((value) => !value)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white"
                  aria-label={isMaximized ? 'Restore chat size' : 'Maximize chat'}
                >
                  {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages / History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950">
              {showHistory ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Chat history</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Open any past conversation or start a fresh one.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowHistory(false)}
                      className="text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
                    >
                      Back to chat
                    </button>
                  </div>

                  {threads.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-4 text-sm text-gray-500 dark:text-gray-400">
                      No saved chats yet. Start a new conversation to keep a history.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {threads.map((thread) => (
                        <button
                          key={thread.id}
                          type="button"
                          onClick={() => loadThread(thread)}
                          className={cn(
                            'w-full text-left rounded-xl border px-3 py-3 transition-colors',
                            thread.id === activeThreadId
                              ? 'border-black dark:border-white bg-white dark:bg-gray-900'
                              : 'border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/70 hover:border-gray-300 dark:hover:border-gray-600'
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {thread.title || 'New chat'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {thread.messages.length} messages
                              </p>
                            </div>
                            <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 flex-shrink-0">
                              {new Date(thread.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {messages.length === 0 && (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                        <Sparkles className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Hi {user?.full_name?.split(' ')[0]}! How can I help?
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {userRole === 'customer'
                          ? 'I can book appointments for you, check your schedule, and more.'
                          : 'Ask me anything about the platform.'}
                      </p>
                    </div>
                  )}

                  {messages.map((msg) => (
                    <div key={msg.id} className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                      {msg.role === 'assistant' && (
                        <div className="w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center bg-black dark:bg-gray-700">
                          <Bot className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                      <div className="max-w-[85%] space-y-2">
                        <div className={cn(
                          'px-3 py-2 text-sm whitespace-pre-line rounded-xl',
                          msg.role === 'user'
                            ? 'bg-black text-white dark:bg-white dark:text-black rounded-br-sm'
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 shadow-sm rounded-bl-sm'
                        )}>
                          {msg.content}
                        </div>

                        {/* Action buttons */}
                        {msg.actions && msg.actions.length > 0 && (
                          <div className="flex flex-col gap-1.5">
                            {msg.actions.map((action, i) => (
                              <button
                                key={i}
                                onClick={() => handleAction(action)}
                                className={cn(
                                  'text-left px-3 py-2 text-xs rounded-lg border transition-all hover:scale-[1.01]',
                                  action.type === 'confirm'
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300 font-medium'
                                    : action.type === 'cancel'
                                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                                    : action.type === 'provider'
                                    ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'
                                    : action.type === 'date' || action.type === 'slot'
                                    ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 flex items-center gap-2'
                                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                                )}
                              >
                                {action.type === 'date' && <Calendar className="w-3 h-3 flex-shrink-0" />}
                                {action.type === 'slot' && <Clock className="w-3 h-3 flex-shrink-0" />}
                                {action.type === 'confirm' && <CheckCircle className="w-3 h-3 flex-shrink-0" />}
                                {action.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-6 h-6 flex-shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
                        </div>
                      )}
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex gap-2 items-center">
                      <div className="w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center bg-black dark:bg-gray-700">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Suggestion chips */}
            {activeSuggestions.length > 0 && !isTyping && (
              <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="flex flex-wrap gap-1.5">
                  {activeSuggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSend(s)}
                      className="px-2.5 py-1 text-[11px] font-medium rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    booking.step === 'ask_service' ? 'Type a service (e.g., Healthcare)...' :
                    booking.step === 'show_providers' ? 'Select a provider above...' :
                    booking.step === 'ask_date' ? 'Select a date above...' :
                    booking.step === 'show_slots' ? 'Select a time slot above...' :
                    booking.step === 'confirm' ? 'Confirm or cancel above...' :
                    'Type a message...'
                  }
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  className="px-3 py-2 rounded-lg bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
            {!isMaximized && (
              <div
                onPointerDown={startResize}
                className="absolute bottom-1 right-1 h-4 w-4 cursor-se-resize rounded-br-lg flex items-end justify-end text-gray-300 hover:text-gray-500"
                aria-label="Resize chat"
              >
                <Move className="w-3 h-3 rotate-45" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating trigger */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </motion.button>
    </>
  );
};

// Helper
function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}
