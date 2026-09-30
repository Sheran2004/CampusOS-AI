'use client';

/**
 * Hackathons Hub — curated + self-service + AI idea generator + team formation.
 *
 * - 8 hand-picked hackathons (Amazon, Flipkart, Google, Microsoft, etc.)
 * - Self-service: add custom hackathons from Unstop, Devfolio, HackerEarth — localStorage
 * - External portals shortcuts
 * - AI project idea generator (per hackathon theme)
 * - Team formation
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  Users,
  Calendar,
  MapPin,
  Sparkles,
  Loader2,
  ExternalLink,
  X,
  Clock,
  Plus,
  Search,
  Globe,
  Trash2,
  AlertCircle,
  Link as LinkIcon,
  Lightbulb,
  Code2,
} from 'lucide-react';
import { toast } from 'sonner';

interface Hackathon {
  id: string;
  name: string;
  organizer: string;
  startDate: string;
  endDate: string;
  mode: 'online' | 'offline' | 'hybrid';
  city?: string;
  prizePool: string;
  participants: number;
  themes: string[];
  description: string;
  applyUrl: string;
  source: string;
  status: 'upcoming' | 'live' | 'past';
}

interface CustomHackathon {
  id: string;
  name: string;
  organizer: string;
  url: string;
  startDate: string;
  endDate: string;
  mode: 'online' | 'offline' | 'hybrid';
  city?: string;
  prizePool: string;
  themes: string[];
  description: string;
  addedAt: string;
}

const EXTERNAL_PORTALS = [
  {
    name: 'Unstop',
    description: "India's largest hackathon + competitions platform",
    url: 'https://unstop.com/hackathons',
    color: 'text-purple-600 bg-purple-500/10',
  },
  {
    name: 'Devfolio',
    description: 'Hackathons + tech events',
    url: 'https://devfolio.co/hackathons',
    color: 'text-emerald-600 bg-emerald-500/10',
  },
  {
    name: 'HackerEarth',
    description: 'Online hackathons',
    url: 'https://www.hackerearth.com/challenges/hackathon/',
    color: 'text-blue-600 bg-blue-500/10',
  },
  {
    name: 'Devpost',
    description: 'Global hackathons',
    url: 'https://devpost.com/hackathons',
    color: 'text-violet-600 bg-violet-500/10',
  },
  {
    name: 'MLH (Major League Hacking)',
    description: 'Student hackathons worldwide',
    url: 'https://mlh.io/events',
    color: 'text-red-600 bg-red-500/10',
  },
  {
    name: 'HackClub',
    description: 'High school + community hackathons',
    url: 'https://hackclub.com/',
    color: 'text-amber-600 bg-amber-500/10',
  },
];

const CUSTOM_KEY = 'campusos_custom_hackathons';

interface Props {
  hackathons: Hackathon[];
  initialTeams: Record<string, any[]>;
  userSkills: string[];
}

export function HackathonsView({ hackathons, initialTeams, userSkills }: Props) {
  const [tab, setTab] = useState<'curated' | 'mine'>('curated');
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'all' | 'online' | 'offline' | 'hybrid'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'live'>('all');
  const [selectedHackathon, setSelectedHackathon] = useState<Hackathon | null>(null);
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [ideas, setIdeas] = useState<Array<{ title: string; description: string; techStack: string[]; difficulty: string }>>([]);
  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [theme, setTheme] = useState('');
  const [teams, setTeams] = useState(initialTeams);
  const [customHackathons, setCustomHackathons] = useState<CustomHackathon[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_KEY);
      if (raw) setCustomHackathons(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(customHackathons));
    } catch {}
  }, [customHackathons]);

  const filtered = hackathons
    .filter((h) => mode === 'all' || h.mode === mode)
    .filter((h) => statusFilter === 'all' || h.status === statusFilter)
    .filter(
      (h) =>
        !search ||
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        h.organizer.toLowerCase().includes(search.toLowerCase()) ||
        h.themes.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    );

  const filteredCustom = customHackathons.filter(
    (h) =>
      (!search ||
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        h.organizer.toLowerCase().includes(search.toLowerCase())) &&
      (mode === 'all' || h.mode === mode)
  );

  const generateIdeas = async (hackathonName: string) => {
    setLoadingIdeas(true);
    try {
      const res = await fetch('/api/hackathons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ideas', name: hackathonName, theme }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setIdeas(data.ideas);
      toast.success(`Generated ${data.ideas.length} project ideas!`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingIdeas(false);
    }
  };

  const deleteCustom = (id: string) => {
    setCustomHackathons((prev) => prev.filter((c) => c.id !== id));
    toast.success('Removed from your list');
  };

  const addCustom = (data: Omit<CustomHackathon, 'id' | 'addedAt'>) => {
    if (!data.name.trim() || !data.organizer.trim()) {
      toast.error('Name and organizer are required');
      return;
    }
    const entry: CustomHackathon = {
      ...data,
      id: `custom_h_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      addedAt: new Date().toISOString(),
    };
    setCustomHackathons((prev) => [entry, ...prev]);
    setShowAddModal(false);
    toast.success('Added to your hackathons');
  };

  const totalPrize = hackathons.reduce((sum, h) => {
    const num = parseInt(h.prizePool.replace(/[^\d]/g, ''), 10);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="h-7 w-7 text-yellow-500" /> Hackathon Hub
        </h1>
        <p className="text-muted-foreground mt-1">
          {hackathons.length} curated hackathons + yours. Form teams, get AI ideas, win prizes.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Trophy className="h-5 w-5 text-yellow-500" />} value={hackathons.length} label="Curated" />
        <StatCard
          icon={<Sparkles className="h-5 w-5 text-emerald-600" />}
          value={hackathons.filter((h) => h.status === 'live').length}
          label="Live now"
        />
        <StatCard
          icon={<Sparkles className="h-5 w-5 text-violet-600" />}
          value={`₹${(totalPrize / 100000).toFixed(1)}L`}
          label="Total prizes"
        />
        <StatCard
          icon={<Code2 className="h-5 w-5 text-blue-600" />}
          value={customHackathons.length}
          label="Your additions"
        />
      </div>

      {/* External portals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-5 w-5 text-blue-600" /> Browse External Portals
          </CardTitle>
          <div className="text-xs text-muted-foreground">
            Find more hackathons on these platforms — opens their listing page
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {EXTERNAL_PORTALS.map((portal) => (
              <a
                key={portal.name}
                href={portal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <Card className="hover:shadow-md hover:border-violet-500/30 transition-all h-full">
                  <CardContent className="pt-4 pb-4">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-2 ${portal.color}`}>
                      <ExternalLink className="h-4 w-4" />
                    </div>
                    <div className="font-semibold text-sm group-hover:text-violet-600 transition">{portal.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{portal.description}</div>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b">
        <button
          type="button"
          onClick={() => setTab('curated')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
            tab === 'curated'
              ? 'border-yellow-500 text-yellow-700 dark:text-yellow-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles className="inline h-4 w-4 mr-1.5" />
          Curated ({hackathons.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('mine')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
            tab === 'mine'
              ? 'border-yellow-500 text-yellow-700 dark:text-yellow-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="inline h-4 w-4 mr-1.5" />
          My Hackathons ({customHackathons.length})
        </button>
        {tab === 'mine' && (
          <Button size="sm" className="ml-auto" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, organizer, or theme..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {tab === 'curated' && (
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'all', label: 'All modes' },
                { value: 'online', label: 'Online' },
                { value: 'offline', label: 'Offline' },
                { value: 'hybrid', label: 'Hybrid' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMode(opt.value as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    mode === opt.value
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setStatusFilter('live')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  statusFilter === 'live'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live now
              </button>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Showing <strong>{tab === 'curated' ? filtered.length : filteredCustom.length}</strong>{' '}
            of {tab === 'curated' ? hackathons.length : customHackathons.length} hackathons
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {tab === 'curated' ? (
        <div className="grid lg:grid-cols-2 gap-4">
          {filtered.length === 0 ? (
            <Card className="lg:col-span-2">
              <CardContent className="pt-12 pb-12 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                <div className="font-semibold">No hackathons match your filters</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Try clearing filters or add your own from external portals.
                </div>
              </CardContent>
            </Card>
          ) : (
            filtered.map((h) => (
              <Card key={h.id} className="hover:shadow-lg transition-all relative">
                <CardContent className="pt-6">
                  {h.status === 'live' && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-emerald-500 text-white">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse mr-1" />
                        Live
                      </Badge>
                    </div>
                  )}

                  <h3 className="font-bold text-lg leading-tight pr-16">{h.name}</h3>
                  <div className="text-sm text-muted-foreground mt-0.5">by {h.organizer}</div>

                  <div className="space-y-1.5 text-sm mt-3 mb-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>
                        {new Date(h.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} →{' '}
                        {new Date(h.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {h.city && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>
                          {h.city} ({h.mode})
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
                      <Trophy className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{h.prizePool}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{h.participants.toLocaleString('en-IN')} participants</span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{h.description}</p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {h.themes.slice(0, 4).map((t) => (
                      <Badge key={t} variant="default" className="text-xs">
                        {t}
                      </Badge>
                    ))}
                    {h.themes.length > 4 && (
                      <Badge variant="default" className="text-xs">
                        +{h.themes.length - 4}
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedHackathon(h);
                        setShowIdeaModal(true);
                        setIdeas([]);
                        setTheme('');
                      }}
                      className="flex-1"
                    >
                      <Lightbulb className="h-3 w-3" /> AI Ideas
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedHackathon(h);
                        setShowTeamModal(true);
                      }}
                    >
                      <Users className="h-3 w-3" /> Teams
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(h.applyUrl, '_blank', 'noopener,noreferrer')}
                      aria-label="Open"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {filteredCustom.length === 0 ? (
            <Card className="lg:col-span-2">
              <CardContent className="pt-12 pb-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                <div className="font-semibold mb-2">No personal hackathons yet</div>
                <div className="text-sm text-muted-foreground mb-4">
                  Found a hackathon on Unstop, Devfolio, or college site? Add it to track.
                </div>
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="h-4 w-4" /> Add Your First Hackathon
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredCustom.map((c) => (
              <Card key={c.id} className="hover:shadow-lg transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg leading-tight">{c.name}</h3>
                      <div className="text-sm text-muted-foreground mt-0.5">by {c.organizer}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteCustom(c.id)}
                      className="text-muted-foreground hover:text-red-500 transition"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5 text-sm mb-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>
                        {new Date(c.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} →{' '}
                        {new Date(c.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    {c.city && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{c.city} ({c.mode})</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
                      <Trophy className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{c.prizePool}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>Added {new Date(c.addedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>

                  {c.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{c.description}</p>}

                  <div className="flex flex-wrap gap-1 mb-3">
                    {c.themes.slice(0, 4).map((t) => (
                      <Badge key={t} variant="default" className="text-xs">
                        {t}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(c.url, '_blank', 'noopener,noreferrer')}
                    >
                      <ExternalLink className="h-3 w-3" /> Visit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigator.clipboard.writeText(c.url).then(() => toast.success('Link copied!'))}
                      aria-label="Copy link"
                    >
                      <LinkIcon className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* AI Ideas Modal */}
      {showIdeaModal && selectedHackathon && (
        <IdeaModal
          hackathon={selectedHackathon}
          theme={theme}
          setTheme={setTheme}
          ideas={ideas}
          loading={loadingIdeas}
          onGenerate={() => generateIdeas(selectedHackathon.name)}
          onClose={() => setShowIdeaModal(false)}
        />
      )}

      {/* Teams Modal */}
      {showTeamModal && selectedHackathon && (
        <TeamModal
          hackathon={selectedHackathon}
          teams={teams[selectedHackathon.id] || []}
          onClose={() => setShowTeamModal(false)}
        />
      )}

      {/* Add Custom Modal */}
      {showAddModal && (
        <AddHackathonModal onClose={() => setShowAddModal(false)} onAdd={addCustom} />
      )}
    </div>
  );
}

function IdeaModal({
  hackathon,
  theme,
  setTheme,
  ideas,
  loading,
  onGenerate,
  onClose,
}: {
  hackathon: Hackathon;
  theme: string;
  setTheme: (t: string) => void;
  ideas: any[];
  loading: boolean;
  onGenerate: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-600" /> AI Project Ideas
              </CardTitle>
              <CardDescription>For {hackathon.name}</CardDescription>
            </div>
            <button type="button" onClick={onClose}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium block">Theme / Domain (optional)</label>
            <input
              type="text"
              placeholder="e.g. FinTech, HealthTech, Sustainability"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {hackathon.themes.slice(0, 6).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className="px-2 py-1 rounded-md border text-xs hover:bg-accent transition"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={onGenerate} loading={loading} className="w-full" size="lg">
            <Sparkles className="h-4 w-4" /> Generate Ideas
          </Button>

          {ideas.length > 0 && (
            <div className="space-y-3 pt-3 border-t">
              {ideas.map((idea, i) => (
                <Card key={i} className="bg-secondary/30">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-bold">{idea.title}</h4>
                      <Badge variant="default">{idea.difficulty}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{idea.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {idea.techStack?.map((t: string) => (
                        <Badge key={t} variant="default" className="text-xs">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TeamModal({
  hackathon,
  teams,
  onClose,
}: {
  hackathon: Hackathon;
  teams: any[];
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const createTeam = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim() || !name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/hackathons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createTeam',
          hackathonId: hackathon.id,
          hackathonName: hackathon.name,
          leaderName: name,
          leaderSkills: '[]',
          description: desc,
          lookingFor: topic,
          maxSize: 4,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Team created!');
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-violet-600" /> Teams for {hackathon.name}
            </CardTitle>
            <button type="button" onClick={onClose}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {teams.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No teams yet. Be the first to form one!
              </div>
            ) : (
              teams.map((t: any) => (
                <Card key={t.id} className="bg-secondary/30">
                  <CardContent className="pt-4">
                    <div className="font-semibold text-sm">{t.leaderName}</div>
                    <div className="text-xs text-muted-foreground mb-1">Looking for: {t.lookingFor}</div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                    <Badge variant="default" className="text-xs mt-2">
                      {t.memberCount || 1}/{t.maxSize} members
                    </Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="border-t pt-4">
            <div className="font-semibold mb-2 text-sm">Form a new team</div>
            <form onSubmit={createTeam} className="space-y-2">
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <input
                type="text"
                placeholder="Looking for (e.g. frontend, ML, design)"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <textarea
                placeholder="Project idea description"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <Button type="submit" loading={loading} className="w-full">
                Create Team
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AddHackathonModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (data: Omit<CustomHackathon, 'id' | 'addedAt'>) => void;
}) {
  const tomorrow = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [name, setName] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [url, setUrl] = useState('');
  const [startDate, setStartDate] = useState(tomorrow);
  const [endDateV, setEndDateV] = useState(endDate);
  const [mode, setMode] = useState<'online' | 'offline' | 'hybrid'>('online');
  const [city, setCity] = useState('');
  const [prizePool, setPrizePool] = useState('');
  const [themes, setThemes] = useState('');
  const [description, setDescription] = useState('');

  const submit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onAdd({
      name: name.trim(),
      organizer: organizer.trim(),
      url: url.trim(),
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDateV).toISOString(),
      mode,
      city: city.trim() || undefined,
      prizePool: prizePool.trim(),
      themes: themes.split(',').map((t) => t.trim()).filter(Boolean),
      description: description.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Add a Hackathon</CardTitle>
            <button type="button" onClick={onClose}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>
        <form onSubmit={submit}>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>
                  Found a hackathon on Unstop, Devfolio, or college site? Paste the details to track. Stored in your browser only.
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium block">Name *</label>
              <input
                type="text"
                placeholder="e.g. HackOn With Amazon"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium block">Organizer *</label>
                <input
                  type="text"
                  placeholder="e.g. Amazon"
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium block">Mode</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as any)}
                  className="w-full h-10 px-2 rounded-md border border-input bg-background text-sm"
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium block">URL *</label>
              <input
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium block">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium block">End Date</label>
                <input
                  type="date"
                  value={endDateV}
                  onChange={(e) => setEndDateV(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium block">City (if offline/hybrid)</label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium block">Prize Pool</label>
                <input
                  type="text"
                  placeholder="e.g. ₹5,00,000"
                  value={prizePool}
                  onChange={(e) => setPrizePool(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium block">Themes (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. AI, Web3, Sustainability"
                value={themes}
                onChange={(e) => setThemes(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium block">Notes (optional)</label>
              <textarea
                placeholder="Anything to remember"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1">
                <Plus className="h-4 w-4" /> Add
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-secondary/50 flex items-center justify-center">{icon}</div>
          <div>
            <div className="text-2xl font-bold leading-none">{value}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}