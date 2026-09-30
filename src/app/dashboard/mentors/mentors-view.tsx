'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Label, Textarea } from '@/components/ui/input';
import {
  Users,
  Star,
  Calendar,
  Briefcase,
  GraduationCap,
  MessageSquare,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { Mentor } from '@/lib/ai';
import { toast } from 'sonner';
import { MentorChatPanel } from './chat-panel';

interface Props {
  mentors: Mentor[];
  initialBookings: any[];
  userId: string;
  initialChatMentorId?: string;
}

export function MentorsView({ mentors, initialBookings, userId, initialChatMentorId }: Props) {
  const [search, setSearch] = useState('');
  const [expertiseFilter, setExpertiseFilter] = useState<string>('all');
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [bookings, setBookings] = useState(initialBookings);
  const [loading, setLoading] = useState(false);
  const [chatMentor, setChatMentor] = useState<Mentor | null>(null);

  // Open chat if ?chat=ID is in URL (deep-link from notification bell)
  useEffect(() => {
    if (initialChatMentorId) {
      const m = mentors.find((mm) => mm.id === initialChatMentorId);
      if (m) setChatMentor(m);
    }
  }, [initialChatMentorId, mentors]);

  const allExpertise = Array.from(new Set(mentors.flatMap((m) => m.expertise))).sort();

  const filtered = mentors
    .filter(
      (m) =>
        !search ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.company.toLowerCase().includes(search.toLowerCase()) ||
        m.expertise.some((e) => e.toLowerCase().includes(search.toLowerCase()))
    )
    .filter((m) => expertiseFilter === 'all' || m.expertise.includes(expertiseFilter));

  const bookSession = async (topic: string, scheduledAt: string, notes: string) => {
    if (!selectedMentor || !topic || !scheduledAt) {
      toast.error('Please fill in topic and date');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/mentors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorId: selectedMentor.id,
          topic,
          scheduledAt,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed (${res.status})`);
      setBookings([...bookings, data.booking]);
      toast.success('Free demo session booked!', {
        description: `15-min intro with ${selectedMentor.name} — no payment required. Chat is now open.`,
      });
      // Open chat immediately so the student can start messaging the mentor
      setChatMentor(selectedMentor);
      setSelectedMentor(null);
    } catch (err: any) {
      toast.error(err.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-7 w-7 text-violet-600" /> Mentor Connect
        </h1>
        <p className="text-muted-foreground mt-1">
          Book 1-on-1 sessions and chat in real-time with seniors and industry mentors from top companies
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, company, or skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setExpertiseFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                expertiseFilter === 'all'
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              All ({mentors.length})
            </button>
            {allExpertise.slice(0, 12).map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setExpertiseFilter(e)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  expertiseFilter === e
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mentor Cards */}
      <div className="grid lg:grid-cols-2 gap-4">
        {filtered.map((mentor) => (
          <MentorCard
            key={mentor.id}
            mentor={mentor}
            onBook={() => setSelectedMentor(mentor)}
            onChat={() => setChatMentor(mentor)}
          />
        ))}
      </div>

      {/* My Bookings */}
      {bookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" /> My Sessions ({bookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {bookings.map((b) => {
              const mentor = mentors.find((m) => m.id === b.mentorId);
              const scheduledDate = typeof b.scheduledAt === 'string'
                ? new Date(b.scheduledAt)
                : b.scheduledAt;
              return (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">
                      {mentor?.name || 'Mentor'} · {b.topic}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {scheduledDate.toLocaleString('en-IN', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <Badge variant={b.status === 'confirmed' ? 'success' : 'warning'}>
                    {b.status}
                  </Badge>
                  {mentor && (
                    <Button variant="outline" size="sm" onClick={() => setChatMentor(mentor)}>
                      <MessageSquare className="h-3 w-3" /> Chat
                    </Button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Booking Modal */}
      {selectedMentor && (
        <BookingModal
          mentor={selectedMentor}
          loading={loading}
          onClose={() => setSelectedMentor(null)}
          onConfirm={bookSession}
        />
      )}

      {/* Chat Panel */}
      {chatMentor && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <MentorChatPanel
              mentor={chatMentor}
              userId={userId}
              onClose={() => setChatMentor(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MentorCard({
  mentor,
  onBook,
  onChat,
}: {
  mentor: Mentor;
  onBook: () => void;
  onChat: () => void;
}) {
  return (
    <Card className="hover:shadow-lg transition-all">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {mentor.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="min-w-0">
                <h3 className="font-bold">{mentor.name}</h3>
                <div className="text-sm text-muted-foreground">{mentor.role}</div>
                <div className="text-sm text-muted-foreground">at {mentor.company}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold">{mentor.rating}</span>
                  <span className="text-xs text-muted-foreground">({mentor.reviewsCount})</span>
                </div>
                <div className="text-sm font-bold mt-1">
                  ₹{mentor.hourlyRate}
                  <span className="text-xs text-muted-foreground">/hr</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1">
                <GraduationCap className="h-3 w-3" /> {mentor.college}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" /> {mentor.yearsExperience}y exp
              </span>
            </div>

            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{mentor.bio}</p>

            <div className="flex flex-wrap gap-1 mt-3">
              {mentor.expertise.slice(0, 5).map((e) => (
                <Badge key={e} variant="default" className="text-xs">
                  {e}
                </Badge>
              ))}
            </div>

            <div className="mt-3 text-xs text-muted-foreground">
              <strong className="text-foreground">Available:</strong> {mentor.availability.join(' · ')}
            </div>

            <div className="mt-4 flex gap-2">
              <Button onClick={onBook} className="flex-1" size="sm">
                <Calendar className="h-3 w-3" /> Book Session
              </Button>
              <Button variant="outline" onClick={onChat} size="sm">
                <MessageSquare className="h-3 w-3" /> Chat
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BookingModal({
  mentor,
  loading,
  onClose,
  onConfirm,
}: {
  mentor: Mentor;
  loading: boolean;
  onConfirm: (topic: string, scheduledAt: string, notes: string) => void;
  onClose: () => void;
}) {
  const defaultDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [topic, setTopic] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState('19:00');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    if (!topic.trim()) {
      setError('Please enter a topic for the session');
      return;
    }
    if (!date || !time) {
      setError('Please select date and time');
      return;
    }
    const scheduledAt = new Date(`${date}T${time}`).toISOString();
    onConfirm(topic.trim(), scheduledAt, notes);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Book {mentor.name}</CardTitle>
              <CardDescription>
                {mentor.role} at {mentor.company}
              </CardDescription>
            </div>
            <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/20">
              <div className="text-xs text-muted-foreground">Listed rate</div>
              <div className="text-2xl font-bold">
                ₹{mentor.hourlyRate}
                <span className="text-sm text-muted-foreground">/session</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <div className="font-semibold text-emerald-700 dark:text-emerald-400">Demo mode — First session free</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    You're booking a <strong>15-min intro session at no charge</strong>. After the mentor confirms, you can upgrade to a full paid session (₹{mentor.hourlyRate}/hr) from the chat panel. No payment is collected right now.
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Topic *</Label>
              <Input
                id="topic"
                placeholder="e.g. System design for payment systems"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={120}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  min={defaultDate}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Specific questions (optional)</Label>
              <Textarea
                id="notes"
                placeholder="e.g. How to prepare for Google L4 interviews specifically in ML?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="text-xs text-muted-foreground">
              <strong className="text-foreground">Note:</strong> After booking, the chat panel opens so you can message the mentor directly. Sessions start in pending state until the mentor confirms (within 24h).
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                loading={loading}
                disabled={loading}
                className="flex-1"
              >
                <Calendar className="h-4 w-4" /> Confirm Booking
              </Button>
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}