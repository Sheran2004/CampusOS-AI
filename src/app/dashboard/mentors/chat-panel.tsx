'use client';

/**
 * MentorChatPanel — Real-time (polling) chat with a booked mentor.
 *
 * Polls /api/chat every 3s for new messages. Sends student messages via POST.
 * Includes unread badge, typing indicator, and auto-scroll.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send, X, MessageSquare, Sparkles, IndianRupee, Loader2 } from 'lucide-react';
import type { Mentor } from '@/lib/ai';
import { toast } from 'sonner';

interface Message {
  id: string;
  studentId: string;
  mentorId: string;
  sender: 'student' | 'mentor';
  message: string;
  read: boolean;
  createdAt: string;
}

interface Props {
  mentor: Mentor;
  userId: string;
  onClose: () => void;
}

export function MentorChatPanel({ mentor, userId, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [mentorTyping, setMentorTyping] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [paid, setPaid] = useState(false);
  const [hours, setHours] = useState(1);
  const lastFetchRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Load initial messages
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/chat?mentorId=${mentor.id}`);
        const data = await res.json();
        if (!cancelled) {
          setMessages(data.messages || []);
          if (data.messages?.length) {
            lastFetchRef.current = data.messages[data.messages.length - 1].createdAt;
          }
        }
      } catch (e: any) {
        toast.error('Could not load chat');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mentor.id]);

  // Poll for new messages every 3s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const url = lastFetchRef.current
          ? `/api/chat?mentorId=${mentor.id}&since=${encodeURIComponent(lastFetchRef.current)}`
          : `/api/chat?mentorId=${mentor.id}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.messages?.length) {
          setMessages((prev) => {
            const ids = new Set(prev.map((m) => m.id));
            const fresh = data.messages.filter((m: Message) => !ids.has(m.id));
            return [...prev, ...fresh];
          });
          lastFetchRef.current = data.messages[data.messages.length - 1].createdAt;
          setMentorTyping(false);
        } else {
          // If a student just sent a message, simulate mentor typing
          // (we detect by checking if the last message is from student and < 8s old)
          setMentorTyping((wasTyping) => {
            if (wasTyping) return wasTyping;
            const last = messages[messages.length - 1];
            if (last && last.sender === 'student' && Date.now() - new Date(last.createdAt).getTime() < 8000) {
              return true;
            }
            return wasTyping;
          });
        }
      } catch {
        /* swallow polling errors silently */
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [mentor.id, messages]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, mentorTyping]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setInput('');
    setMentorTyping(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorId: mentor.id, message: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Optimistic add (also picked up by next poll)
      setMessages((prev) =>
        prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]
      );
      lastFetchRef.current = data.message.createdAt;
    } catch (err: any) {
      toast.error(err.message);
      setInput(trimmed); // restore
    } finally {
      setSending(false);
    }
  }, [input, sending, mentor.id]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const upgradeToPaid = async () => {
    setUpgrading(true);
    try {
      const res = await fetch('/api/payments/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorId: mentor.id, hours }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed (${res.status})`);

      // Demo mode — instant success
      if (data.mode === 'demo') {
        setPaid(true);
        toast.success(`🎉 Paid session booked!`, {
          description: `₹${data.amount} for ${hours}h with ${mentor.name}. Mentor will reach out to schedule.`,
        });
        return;
      }

      // Real Razorpay checkout
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('Razorpay failed to load'));
          document.body.appendChild(s);
        });
      }
      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'CampusOS AI',
        description: data.planName,
        order_id: data.orderId,
        handler: () => {
          setPaid(true);
          toast.success('Payment successful — paid session activated!');
        },
        modal: { ondismiss: () => toast.info('Payment cancelled') },
        theme: { color: '#8b5cf6' },
      });
      rzp.on('payment.failed', (r: any) =>
        toast.error('Payment failed', { description: r.error.description })
      );
      rzp.open();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <Card className="flex flex-col h-[600px] overflow-hidden">
      <CardHeader className="border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm">
              {mentor.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Chat with {mentor.name}
                {paid && (
                  <span className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white">
                    <Sparkles className="h-2.5 w-2.5" /> Paid session
                  </span>
                )}
              </CardTitle>
              <div className="text-xs text-muted-foreground">
                {mentor.role} at {mentor.company}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-3" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No messages yet. Say hi to your mentor!</p>
            <p className="text-xs mt-2">Tip: ask about resume review, interview prep, or project feedback.</p>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.sender === 'student' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                m.sender === 'student'
                  ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white'
                  : 'bg-secondary text-foreground'
              }`}
            >
              <div className="whitespace-pre-wrap break-words">{m.message}</div>
              <div
                className={`text-[10px] mt-1 ${
                  m.sender === 'student' ? 'text-white/70' : 'text-muted-foreground'
                }`}
              >
                {new Date(m.createdAt).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))}
        {mentorTyping && (
          <div className="flex justify-start">
            <div className="bg-secondary rounded-2xl px-4 py-2 text-sm flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="ml-2 text-xs text-muted-foreground">{mentor.name.split(' ')[0]} is typing...</span>
            </div>
          </div>
        )}
      </CardContent>

      {/* Upgrade-to-paid banner (shown until paid) */}
      {!paid && (
        <div className="border-t p-3 bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 flex-shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">Upgrade to a paid full session</div>
              <div className="text-xs text-muted-foreground">
                Demo session (15 min) is free. For deep-dive mentorship at ₹{mentor.hourlyRate}/hr.
              </div>
            </div>
            <select
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="h-9 px-2 rounded-md border border-input bg-background text-sm"
            >
              <option value={1}>1 hour — ₹{mentor.hourlyRate}</option>
              <option value={2}>2 hours — ₹{mentor.hourlyRate * 2}</option>
              <option value={3}>3 hours — ₹{mentor.hourlyRate * 3}</option>
              <option value={5}>5 hours — ₹{mentor.hourlyRate * 5}</option>
            </select>
            <Button
              size="sm"
              onClick={upgradeToPaid}
              disabled={upgrading}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600"
            >
              {upgrading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" /> Processing
                </>
              ) : (
                <>
                  <IndianRupee className="h-3 w-3" /> Pay ₹{mentor.hourlyRate * hours}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <div className="border-t p-3 flex-shrink-0">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
            rows={1}
            className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            maxLength={2000}
            style={{ minHeight: '40px', maxHeight: '100px' }}
          />
          <Button onClick={sendMessage} disabled={!input.trim() || sending} size="sm">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-[10px] text-muted-foreground mt-1 text-right">
          {input.length}/2000 · Auto-refresh every 3s
        </div>
      </div>
    </Card>
  );
}