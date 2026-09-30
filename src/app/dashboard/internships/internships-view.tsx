'use client';

/**
 * Internships Hub — curated + user-added internships.
 *
 * - 21 hand-picked internships (Razorpay, Google, Microsoft, etc.)
 * - User can add their own from Internshala/Unstop/LinkedIn/etc. (saved in localStorage)
 * - External portal shortcuts (no scraping — opens real search pages)
 * - Match scoring based on user's skills
 * - Stipend/location/category filters + sort by match
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Briefcase,
  Search,
  MapPin,
  IndianRupee,
  Clock,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Building2,
  Sparkles,
  Calendar,
  GraduationCap,
  TrendingUp,
  Plus,
  X,
  Globe,
  Trash2,
  AlertCircle,
  Link as LinkIcon,
} from 'lucide-react';
import type { JobListing, JobMatchResult } from '@/lib/types';
import { toast } from 'sonner';

interface Props {
  internships: JobListing[];
  matches: JobMatchResult[];
  userSkills: string[];
  savedJobIds: string[];
  appliedJobIds: string[];
  hasSkills: boolean;
}

interface CustomInternship {
  id: string;
  title: string;
  company: string;
  url: string;
  location: string;
  stipend: string;
  description: string;
  deadline?: string;
  addedAt: string;
}

const STIPEND_RANGES = [
  { label: 'Any', min: 0, max: Infinity },
  { label: '₹10k - 25k', min: 10000, max: 25000 },
  { label: '₹25k - 50k', min: 25000, max: 50000 },
  { label: '₹50k+', min: 50000, max: Infinity },
];

const EXTERNAL_PORTALS = [
  {
    name: 'Internshala',
    description: "India's #1 internship platform",
    url: 'https://internshala.com/internships/',
    color: 'text-blue-600 bg-blue-500/10',
  },
  {
    name: 'Unstop',
    description: 'Internships + hackathons + competitions',
    url: 'https://unstop.com/internships',
    color: 'text-purple-600 bg-purple-500/10',
  },
  {
    name: 'LinkedIn',
    description: 'Search & apply with your profile',
    url: 'https://www.linkedin.com/jobs/internship-jobs/',
    color: 'text-sky-600 bg-sky-500/10',
  },
  {
    name: 'Naukri',
    description: "India's largest job portal",
    url: 'https://www.naukri.com/internship-jobs',
    color: 'text-emerald-600 bg-emerald-500/10',
  },
  {
    name: 'Wellfound (AngelList)',
    description: 'Startup internships',
    url: 'https://wellfound.com/jobs',
    color: 'text-pink-600 bg-pink-500/10',
  },
  {
    name: 'Indeed',
    description: 'Global job aggregator',
    url: 'https://www.indeed.com/jobs?q=internship+india',
    color: 'text-violet-600 bg-violet-500/10',
  },
];

const CUSTOM_KEY = 'campusos_custom_internships';

export function InternshipsView({
  internships,
  matches,
  userSkills,
  savedJobIds,
  appliedJobIds,
  hasSkills,
}: Props) {
  const [search, setSearch] = useState('');
  const [stipendRange, setStipendRange] = useState(0);
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showOnlyMatched, setShowOnlyMatched] = useState(hasSkills);
  const [savedSet, setSavedSet] = useState(new Set(savedJobIds));
  const [appliedSet, setAppliedSet] = useState(new Set(appliedJobIds));
  const [tab, setTab] = useState<'curated' | 'mine'>('curated');
  const [customInternships, setCustomInternships] = useState<CustomInternship[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Load custom internships from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_KEY);
      if (raw) setCustomInternships(JSON.parse(raw));
    } catch {}
  }, []);

  // Persist custom internships
  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(customInternships));
    } catch {}
  }, [customInternships]);

  const locations = Array.from(new Set(internships.map((i) => i.location.split('(')[0].trim())));
  const categories = Array.from(new Set(internships.map((i) => i.category)));

  const matchScoreMap = new Map(matches.map((m) => [m.job.id, m]));

  const filtered = internships
    .filter((j) => {
      if (showOnlyMatched) {
        const m = matchScoreMap.get(j.id);
        if (!m || m.matchScore < 40) return false;
      }
      return true;
    })
    .filter(
      (j) =>
        !search ||
        j.title.toLowerCase().includes(search.toLowerCase()) ||
        j.company.toLowerCase().includes(search.toLowerCase()) ||
        j.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()))
    )
    .filter((j) => locationFilter === 'all' || j.location.startsWith(locationFilter))
    .filter((j) => categoryFilter === 'all' || j.category === categoryFilter)
    .filter((j) => {
      const range = STIPEND_RANGES[stipendRange];
      const stipendNum = parseStipend(j.stipend);
      if (stipendNum === null) return true;
      return stipendNum >= range.min && stipendNum <= range.max;
    })
    .sort((a, b) => {
      const ma = matchScoreMap.get(a.id)?.matchScore || 0;
      const mb = matchScoreMap.get(b.id)?.matchScore || 0;
      return mb - ma;
    });

  const filteredCustom = customInternships.filter(
    (c) =>
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSave = async (jobId: string) => {
    const isSaved = savedSet.has(jobId);
    try {
      const res = await fetch('/api/jobs/save', {
        method: isSaved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const newSet = new Set(savedSet);
      if (isSaved) newSet.delete(jobId);
      else newSet.add(jobId);
      setSavedSet(newSet);
      toast.success(isSaved ? 'Removed from saved' : 'Saved!');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const apply = async (jobId: string) => {
    if (appliedSet.has(jobId)) {
      toast.info('Already applied');
      return;
    }
    try {
      const res = await fetch('/api/jobs/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const newSet = new Set(appliedSet);
      newSet.add(jobId);
      setAppliedSet(newSet);
      toast.success('Application tracked!', {
        description: 'Open the link below to submit your actual application.',
      });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deleteCustom = (id: string) => {
    setCustomInternships((prev) => prev.filter((c) => c.id !== id));
    toast.success('Removed from your list');
  };

  const addCustom = (data: Omit<CustomInternship, 'id' | 'addedAt'>) => {
    if (!data.title.trim() || !data.company.trim()) {
      toast.error('Title and company are required');
      return;
    }
    const entry: CustomInternship = {
      ...data,
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      addedAt: new Date().toISOString(),
    };
    setCustomInternships((prev) => [entry, ...prev]);
    setShowAddModal(false);
    toast.success('Added to your internships');
  };

  // Stats
  const totalInternships = internships.length;
  const matchedCount = matches.filter((m) => m.matchScore >= 40).length;
  const avgStipend = internships
    .map((i) => parseStipend(i.stipend))
    .filter((n): n is number => n !== null);
  const avgStipendValue = avgStipend.length
    ? Math.round(avgStipend.reduce((s, n) => s + n, 0) / avgStipend.length)
    : 0;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Briefcase className="h-7 w-7 text-violet-600" /> Internship Hub
        </h1>
        <p className="text-muted-foreground mt-1">
          {totalInternships} curated internships + your own. Add more, filter, track, apply.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Briefcase className="h-5 w-5 text-violet-600" />} value={totalInternships} label="Curated" />
        <StatCard
          icon={<Sparkles className="h-5 w-5 text-emerald-600" />}
          value={matchedCount}
          label="Matched to you"
        />
        <StatCard
          icon={<IndianRupee className="h-5 w-5 text-blue-600" />}
          value={avgStipendValue ? `₹${(avgStipendValue / 1000).toFixed(0)}k` : '—'}
          label="Avg stipend/mo"
        />
        <StatCard
          icon={<Building2 className="h-5 w-5 text-amber-600" />}
          value={customInternships.length}
          label="Your additions"
        />
      </div>

      {/* Skill prompt */}
      {!hasSkills && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <GraduationCap className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-sm">Add your skills to see matched internships</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Update your skills in <a href="/dashboard/settings" className="underline text-violet-600">Settings</a> to get personalized match scores (0-100%).
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
            Find more internships on these platforms — opens their search page
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

      {/* Tabs: Curated vs Mine */}
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
          Curated ({internships.length})
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
          My Internships ({customInternships.length})
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

          {tab === 'curated' && (
            <div className="grid md:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Stipend</label>
                <select
                  value={stipendRange}
                  onChange={(e) => setStipendRange(Number(e.target.value))}
                  className="w-full h-9 px-2 rounded-lg border border-input bg-background text-sm"
                >
                  {STIPEND_RANGES.map((r, i) => (
                    <option key={r.label} value={i}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Location</label>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg border border-input bg-background text-sm"
                >
                  <option value="all">All cities</option>
                  {locations.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Role</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg border border-input bg-background text-sm"
                >
                  <option value="all">All roles</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {hasSkills && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Match</label>
                  <button
                    type="button"
                    onClick={() => setShowOnlyMatched(!showOnlyMatched)}
                    className={`w-full h-9 px-3 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2 ${
                      showOnlyMatched
                        ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    <Sparkles className="h-3 w-3" />
                    {showOnlyMatched ? 'Only matched (40+)' : 'Show all'}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Showing <strong>{tab === 'curated' ? filtered.length : filteredCustom.length}</strong>{' '}
            of {tab === 'curated' ? internships.length : customInternships.length} internships
          </div>
        </CardContent>
      </Card>

      {/* Internship list */}
      {tab === 'curated' ? (
        <div className="grid lg:grid-cols-2 gap-4">
          {filtered.length === 0 ? (
            <Card className="lg:col-span-2">
              <CardContent className="pt-12 pb-12 text-center">
                <Briefcase className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                <div className="font-semibold">No internships match your filters</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Try clearing some filters, broadening your search, or adding your own.
                </div>
              </CardContent>
            </Card>
          ) : (
            filtered.map((job) => {
              const match = matchScoreMap.get(job.id);
              const isSaved = savedSet.has(job.id);
              const isApplied = appliedSet.has(job.id);
              return (
                <Card key={job.id} className="hover:shadow-lg transition-all">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg leading-tight">{job.title}</h3>
                        <div className="text-sm text-muted-foreground mt-0.5">
                          <Building2 className="inline h-3 w-3 mr-1" />
                          {job.company}
                        </div>
                      </div>
                      {match && hasSkills && (
                        <div className="text-center flex-shrink-0">
                          <div
                            className={`text-2xl font-bold ${
                              match.matchScore >= 75
                                ? 'text-emerald-600'
                                : match.matchScore >= 50
                                  ? 'text-yellow-600'
                                  : 'text-muted-foreground'
                            }`}
                          >
                            {match.matchScore}
                          </div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">match</div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 text-sm mb-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{job.location}</span>
                      </div>
                      {job.stipend && (
                        <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
                          <IndianRupee className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{job.stipend}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>Posted {job.postedDays === 0 ? 'today' : `${job.postedDays}d ago`}</span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{job.description}</p>

                    <div className="flex flex-wrap gap-1 mb-3">
                      <Badge variant="default" className="text-xs">{job.category}</Badge>
                      <Badge variant="default" className="text-xs bg-blue-500/10 text-blue-700 dark:text-blue-400">
                        Internship
                      </Badge>
                      {job.skills.slice(0, 4).map((s) => (
                        <Badge key={s} variant="default" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                      {job.skills.length > 4 && (
                        <Badge variant="default" className="text-xs">
                          +{job.skills.length - 4}
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => apply(job.id)}
                        disabled={isApplied}
                        className="flex-1"
                      >
                        {isApplied ? (
                          <>
                            <BookmarkCheck className="h-3 w-3" /> Applied
                          </>
                        ) : (
                          <>
                            <TrendingUp className="h-3 w-3" /> Track & Apply
                          </>
                        )}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => toggleSave(job.id)} aria-label={isSaved ? 'Unsave' : 'Save'}>
                        {isSaved ? <BookmarkCheck className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(job.applyUrl, '_blank', 'noopener,noreferrer')}
                        aria-label="Open"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {filteredCustom.length === 0 ? (
            <Card className="lg:col-span-2">
              <CardContent className="pt-12 pb-12 text-center">
                <Bookmark className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                <div className="font-semibold mb-2">No personal internships yet</div>
                <div className="text-sm text-muted-foreground mb-4">
                  Found an internship on Internshala, LinkedIn, or a company's careers page? Add it here to keep track.
                </div>
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="h-4 w-4" /> Add Your First Internship
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
                    {c.stipend && (
                      <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
                        <IndianRupee className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{c.stipend}</span>
                      </div>
                    )}
                    {c.deadline && (
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>Apply by {c.deadline}</span>
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

      {/* CTA card */}
      <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-violet-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold">Application strategy for Indian college internships</div>
              <div className="text-sm text-muted-foreground mt-1">
                Most Indian companies open intern applications <strong>Aug-Dec for Summer</strong>,{' '}
                <strong>Jan-Mar for Winter</strong>. Apply 30-50 across startups (Faster offers), mid-size (Better
                mentorship), and FAANG-tier (Best brand). Quality over quantity — tailor each resume.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Custom Modal */}
      {showAddModal && (
        <AddInternshipModal
          onClose={() => setShowAddModal(false)}
          onAdd={addCustom}
        />
      )}
    </div>
  );
}

function AddInternshipModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (data: Omit<CustomInternship, 'id' | 'addedAt'>) => void;
}) {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [url, setUrl] = useState('');
  const [location, setLocation] = useState('');
  const [stipend, setStipend] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');

  const submit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onAdd({
      title: title.trim(),
      company: company.trim(),
      url: url.trim(),
      location: location.trim(),
      stipend: stipend.trim(),
      description: description.trim(),
      deadline: deadline.trim() || undefined,
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
            <CardTitle>Add an Internship</CardTitle>
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
                  Found an internship on Internshala, LinkedIn, or a company's site? Paste the details here so you don't lose track. Stored in your browser only.
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium block">Title *</label>
              <input
                type="text"
                placeholder="e.g. Frontend Developer Intern"
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
                  placeholder="e.g. Razorpay"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium block">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore (Hybrid)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
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
                <label className="text-sm font-medium block">Stipend</label>
                <input
                  type="text"
                  placeholder="e.g. ₹40,000 / month"
                  value={stipend}
                  onChange={(e) => setStipend(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium block">Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium block">Notes (optional)</label>
              <textarea
                placeholder="What stood out? Skills needed? Referral contact?"
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

function parseStipend(stipend?: string): number | null {
  if (!stipend) return null;
  const match = stipend.match(/₹([\d,]+)/);
  if (!match) return null;
  const n = parseInt(match[1].replace(/,/g, ''), 10);
  return n > 100 ? n : n;
}