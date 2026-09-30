'use client';

/**
 * Jobs Hub — full-time + internship jobs, with self-service additions.
 *
 * - Curated: 14 real full-time + 21 internship roles (Razorpay, Google, Microsoft, etc.)
 * - Self-service: add custom jobs from Naukri, LinkedIn, company sites — saved in localStorage
 * - External portals: 1-click open to major Indian job sites
 * - Match scoring, filters, save/apply tracking
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Briefcase,
  MapPin,
  ExternalLink,
  Sparkles,
  Building2,
  Clock,
  Bookmark,
  BookmarkCheck,
  Search,
  Plus,
  X,
  Globe,
  Trash2,
  AlertCircle,
  Link as LinkIcon,
  IndianRupee,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'internship' | 'fulltime';
  stipend?: string;
  ctc?: string;
  skills: string[];
  description: string;
  applyUrl: string;
  source: string;
  postedDays: number;
  category: string;
}

interface JobMatchResult {
  job: JobListing;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  reasoning: string;
}

interface CustomJob {
  id: string;
  title: string;
  company: string;
  url: string;
  location: string;
  ctc: string;
  description: string;
  type: 'fulltime' | 'internship';
  addedAt: string;
}

interface Props {
  matches: JobMatchResult[];
  hasSkills: boolean;
  savedJobIds: string[];
  appliedJobIds: string[];
}

const EXTERNAL_PORTALS = [
  {
    name: 'Naukri',
    description: "India's #1 job portal",
    url: 'https://www.naukri.com/jobs',
    color: 'text-emerald-600 bg-emerald-500/10',
  },
  {
    name: 'LinkedIn',
    description: 'Search & apply with your profile',
    url: 'https://www.linkedin.com/jobs/',
    color: 'text-sky-600 bg-sky-500/10',
  },
  {
    name: 'Indeed',
    description: 'Global job aggregator',
    url: 'https://www.indeed.co.in/jobs',
    color: 'text-violet-600 bg-violet-500/10',
  },
  {
    name: 'Wellfound',
    description: 'Startup jobs',
    url: 'https://wellfound.com/jobs',
    color: 'text-pink-600 bg-pink-500/10',
  },
  {
    name: 'Glassdoor',
    description: 'Jobs + salaries + reviews',
    url: 'https://www.glassdoor.co.in/Jobs/index.htm',
    color: 'text-amber-600 bg-amber-500/10',
  },
  {
    name: 'Instahyre',
    description: 'Senior tech roles',
    url: 'https://www.instahyre.com/',
    color: 'text-blue-600 bg-blue-500/10',
  },
];

const CUSTOM_KEY = 'campusos_custom_jobs';

export function JobsList({
  matches,
  hasSkills,
  savedJobIds: initialSaved,
  appliedJobIds: initialApplied,
}: Props) {
  const [tab, setTab] = useState<'curated' | 'mine'>('curated');
  const [filter, setFilter] = useState<'all' | 'internship' | 'fulltime'>('all');
  const [minScore, setMinScore] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [savedJobs, setSavedJobs] = useState<string[]>(initialSaved);
  const [appliedJobs, setAppliedJobs] = useState<string[]>(initialApplied);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [customJobs, setCustomJobs] = useState<CustomJob[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_KEY);
      if (raw) setCustomJobs(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(customJobs));
    } catch {}
  }, [customJobs]);

  const categories = Array.from(new Set(matches.map((m) => m.job.category)));

  const filtered = matches
    .filter((m) => filter === 'all' || m.job.type === filter)
    .filter((m) => m.matchScore >= minScore)
    .filter(
      (m) =>
        !search ||
        m.job.title.toLowerCase().includes(search.toLowerCase()) ||
        m.job.company.toLowerCase().includes(search.toLowerCase()) ||
        m.job.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()))
    )
    .filter((m) => category === 'all' || m.job.category === category)
    .filter((m) => !showSavedOnly || savedJobs.includes(m.job.id))
    .sort((a, b) => b.matchScore - a.matchScore);

  const filteredCustom = customJobs.filter(
    (j) =>
      !search ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.company.toLowerCase().includes(search.toLowerCase())
  ).filter((j) => filter === 'all' || j.type === filter);

  const toggleSave = async (jobId: string, currentlySaved: boolean) => {
    try {
      const res = await fetch('/api/jobs/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, action: currentlySaved ? 'unsave' : 'save' }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSavedJobs((prev) =>
        currentlySaved ? prev.filter((id) => id !== jobId) : [...prev, jobId]
      );
      toast.success(currentlySaved ? 'Removed from saved' : 'Saved!');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const apply = async (jobId: string) => {
    if (appliedJobs.includes(jobId)) {
      toast.info('Already tracked');
      return;
    }
    try {
      const res = await fetch('/api/jobs/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setAppliedJobs((prev) => [...prev, jobId]);
      toast.success('Application tracked!');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deleteCustom = (id: string) => {
    setCustomJobs((prev) => prev.filter((c) => c.id !== id));
    toast.success('Removed from your list');
  };

  const addCustom = (data: Omit<CustomJob, 'id' | 'addedAt'>) => {
    if (!data.title.trim() || !data.company.trim()) {
      toast.error('Title and company are required');
      return;
    }
    const entry: CustomJob = {
      ...data,
      id: `custom_job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      addedAt: new Date().toISOString(),
    };
    setCustomJobs((prev) => [entry, ...prev]);
    setShowAddModal(false);
    toast.success('Added to your jobs');
  };

  const totalFullTime = matches.filter((m) => m.job.type === 'fulltime').length;
  const totalIntern = matches.filter((m) => m.job.type === 'internship').length;
  const matched = matches.filter((m) => m.matchScore >= 60).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Briefcase className="h-5 w-5 text-violet-600" />} value={totalFullTime} label="Full-time" />
        <StatCard icon={<Clock className="h-5 w-5 text-blue-600" />} value={totalIntern} label="Internships" />
        <StatCard icon={<Sparkles className="h-5 w-5 text-emerald-600" />} value={matched} label="Strong matches" />
        <StatCard icon={<Bookmark className="h-5 w-5 text-amber-600" />} value={customJobs.length} label="Your additions" />
      </div>

      {/* Skill prompt */}
      {!hasSkills && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-sm">Add your skills to see personalized match scores</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Update in <a href="/dashboard/settings" className="underline text-violet-600">Settings</a> to get 0-100% match scores against your target roles.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* External portals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-5 w-5 text-blue-600" /> Browse External Portals
          </CardTitle>
          <div className="text-xs text-muted-foreground">
            Find more jobs on these platforms — opens their search page
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
              ? 'border-violet-500 text-violet-700 dark:text-violet-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles className="inline h-4 w-4 mr-1.5" />
          Curated ({matches.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('mine')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
            tab === 'mine'
              ? 'border-violet-500 text-violet-700 dark:text-violet-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Bookmark className="inline h-4 w-4 mr-1.5" />
          My Jobs ({customJobs.length})
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
              placeholder="Search by title, company, or skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'all', label: 'All' },
              { value: 'internship', label: 'Internships' },
              { value: 'fulltime', label: 'Full-time' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFilter(opt.value as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filter === opt.value
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowSavedOnly(!showSavedOnly)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                showSavedOnly
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {showSavedOnly ? '✓ Saved only' : 'Saved only'}
            </button>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-8 px-2 rounded-lg border border-input bg-background text-xs"
            >
              <option value="all">All roles</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {hasSkills && (
              <select
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="h-8 px-2 rounded-lg border border-input bg-background text-xs"
              >
                <option value={0}>Any match</option>
                <option value={40}>40%+ match</option>
                <option value={60}>60%+ match</option>
                <option value={75}>75%+ match</option>
              </select>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            Showing <strong>{tab === 'curated' ? filtered.length : filteredCustom.length}</strong>{' '}
            of {tab === 'curated' ? matches.length : customJobs.length} jobs
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {tab === 'curated' ? (
        <div className="grid lg:grid-cols-2 gap-4">
          {filtered.length === 0 ? (
            <Card className="lg:col-span-2">
              <CardContent className="pt-12 pb-12 text-center">
                <Briefcase className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                <div className="font-semibold">No jobs match your filters</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Try clearing filters or add your own jobs from external portals.
                </div>
              </CardContent>
            </Card>
          ) : (
            filtered.map((m) => (
              <Card key={m.job.id} className="hover:shadow-lg transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg leading-tight">{m.job.title}</h3>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        <Building2 className="inline h-3 w-3 mr-1" />
                        {m.job.company}
                      </div>
                    </div>
                    {hasSkills && (
                      <div className="text-center flex-shrink-0">
                        <div
                          className={`text-2xl font-bold ${
                            m.matchScore >= 75
                              ? 'text-emerald-600'
                              : m.matchScore >= 50
                                ? 'text-yellow-600'
                                : 'text-muted-foreground'
                          }`}
                        >
                          {m.matchScore}
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">match</div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 text-sm mb-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{m.job.location}</span>
                    </div>
                    {(m.job.ctc || m.job.stipend) && (
                      <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
                        <IndianRupee className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{m.job.ctc || m.job.stipend}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>Posted {m.job.postedDays === 0 ? 'today' : `${m.job.postedDays}d ago`}</span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{m.job.description}</p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    <Badge variant="default" className="text-xs">{m.job.category}</Badge>
                    <Badge
                      variant="default"
                      className={`text-xs ${
                        m.job.type === 'internship'
                          ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                          : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {m.job.type === 'internship' ? 'Internship' : 'Full-time'}
                    </Badge>
                    {m.job.skills.slice(0, 4).map((s) => (
                      <Badge key={s} variant="default" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => apply(m.job.id)}
                      disabled={appliedJobs.includes(m.job.id)}
                      className="flex-1"
                    >
                      {appliedJobs.includes(m.job.id) ? (
                        <>
                          <BookmarkCheck className="h-3 w-3" /> Applied
                        </>
                      ) : (
                        <>
                          <TrendingUp className="h-3 w-3" /> Track & Apply
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleSave(m.job.id, savedJobs.includes(m.job.id))}
                      aria-label="Save"
                    >
                      {savedJobs.includes(m.job.id) ? <BookmarkCheck className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(m.job.applyUrl, '_blank', 'noopener,noreferrer')}
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
                <Bookmark className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                <div className="font-semibold mb-2">No personal jobs yet</div>
                <div className="text-sm text-muted-foreground mb-4">
                  Found a job on Naukri, LinkedIn, or a company's careers page? Add it here to track.
                </div>
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="h-4 w-4" /> Add Your First Job
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredCustom.map((c) => (
              <Card key={c.id} className="hover:shadow-lg transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg leading-tight">{c.title}</h3>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        <Building2 className="inline h-3 w-3 mr-1" />
                        {c.company}
                      </div>
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
                    {c.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{c.location}</span>
                      </div>
                    )}
                    {c.ctc && (
                      <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
                        <IndianRupee className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{c.ctc}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>Added {new Date(c.addedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>

                  {c.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{c.description}</p>
                  )}

                  <div className="flex flex-wrap gap-1 mb-3">
                    <Badge
                      variant="default"
                      className={`text-xs ${
                        c.type === 'internship'
                          ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                          : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {c.type === 'internship' ? 'Internship' : 'Full-time'}
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(c.url, '_blank', 'noopener,noreferrer')}
                    >
                      <ExternalLink className="h-3 w-3" /> Apply Now
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

      {showAddModal && (
        <AddJobModal onClose={() => setShowAddModal(false)} onAdd={addCustom} />
      )}
    </div>
  );
}

function AddJobModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (data: Omit<CustomJob, 'id' | 'addedAt'>) => void;
}) {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [url, setUrl] = useState('');
  const [location, setLocation] = useState('');
  const [ctc, setCtc] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'fulltime' | 'internship'>('fulltime');

  const submit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onAdd({
      title: title.trim(),
      company: company.trim(),
      url: url.trim(),
      location: location.trim(),
      ctc: ctc.trim(),
      description: description.trim(),
      type,
    });
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
            <CardTitle>Add a Job</CardTitle>
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
                  Found a job on Naukri, LinkedIn, or a company's site? Paste the details here to track. Stored in your browser only.
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium block">Title *</label>
              <input
                type="text"
                placeholder="e.g. Senior Backend Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                required
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium block">Company *</label>
                <input
                  type="text"
                  placeholder="e.g. PhonePe"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium block">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full h-10 px-2 rounded-md border border-input bg-background text-sm"
                >
                  <option value="fulltime">Full-time</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium block">Apply URL *</label>
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
                <label className="text-sm font-medium block">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium block">CTC / Stipend</label>
                <input
                  type="text"
                  placeholder="e.g. ₹18-25 LPA"
                  value={ctc}
                  onChange={(e) => setCtc(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium block">Notes (optional)</label>
              <textarea
                placeholder="Why this role? Referral? Tech stack?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1">
                <Plus className="h-4 w-4" /> Add to My List
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