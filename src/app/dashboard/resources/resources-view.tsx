'use client';

/**
 * Resources — Everything a college student needs in one place.
 *
 * - Free DSA practice (LeetCode, GeeksforGeeks, CSES, Striver SDE sheet)
 * - Aptitude practice (IndiaBix, PrepInsta)
 * - Free courses (NPTEL, freeCodeCamp, CS50)
 * - Interview prep (Pramp, InterviewBit)
 * - System design resources
 * - Resume builders (Canva, Overleaf)
 * - Tools (Git student pack, JetBrains free)
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Code2,
  Brain,
  Briefcase,
  Wrench,
  GraduationCap,
  ExternalLink,
  Search,
  Sparkles,
  Trophy,
  Star,
} from 'lucide-react';

interface Resource {
  title: string;
  description: string;
  url: string;
  type: 'free' | 'freemium' | 'paid';
  level: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

interface Category {
  key: string;
  title: string;
  icon: any;
  color: string;
  description: string;
  resources: Resource[];
}

const CATEGORIES: Category[] = [
  {
    key: 'dsa',
    title: 'DSA & Competitive Programming',
    icon: Code2,
    color: 'text-blue-600 bg-blue-500/10',
    description: 'Master data structures, algorithms, and CP. Required for almost every interview.',
    resources: [
      {
        title: 'Striver SDE Sheet',
        description: '191 curated DSA problems covering everything for SDE interviews. Most popular sheet in India.',
        url: 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-s2z-dsa-course-sheet-2/',
        type: 'free',
        level: 'intermediate',
        tags: ['SDE', 'Sheet', 'Most Popular'],
      },
      {
        title: 'Love Babbar 450 Sheet',
        description: '450 DSA questions covering all topics. The original Indian DSA sheet.',
        url: 'https://450dsa.com/',
        type: 'free',
        level: 'intermediate',
        tags: ['SDE', 'Sheet'],
      },
      {
        title: 'NeetCode Roadmap',
        description: 'Curated 375 problems in topic order. Used for FAANG prep.',
        url: 'https://neetcode.io/roadmap',
        type: 'freemium',
        level: 'intermediate',
        tags: ['FAANG', 'Roadmap'],
      },
      {
        title: 'CSES Problem Set',
        description: '300 problems across categories. Best for CP entry.',
        url: 'https://cses.fi/problemset/',
        type: 'free',
        level: 'intermediate',
        tags: ['CP', 'Structured'],
      },
      {
        title: 'Codeforces',
        description: 'Largest CP platform. Weekly contests. Start from Div. 4.',
        url: 'https://codeforces.com/',
        type: 'free',
        level: 'intermediate',
        tags: ['CP', 'Contests'],
      },
      {
        title: 'LeetCode',
        description: 'The standard interview prep platform. 2500+ problems.',
        url: 'https://leetcode.com/',
        type: 'freemium',
        level: 'intermediate',
        tags: ['Interviews'],
      },
    ],
  },
  {
    key: 'aptitude',
    title: 'Aptitude & Reasoning',
    icon: Brain,
    color: 'text-emerald-600 bg-emerald-500/10',
    description: 'Required for TCS, Infosys, Wipro, Cognizant, Accenture, and most mass recruiters.',
    resources: [
      {
        title: 'IndiaBix',
        description: 'Largest collection of aptitude questions (quant, logical, verbal, technical) with solutions.',
        url: 'https://www.indiabix.com/',
        type: 'free',
        level: 'beginner',
        tags: ['Aptitude', 'All Topics'],
      },
      {
        title: 'PrepInsta',
        description: 'Company-specific prep (TCS NQT, Infosys InfyTQ, AMCAT).',
        url: 'https://prepinsta.com/',
        type: 'freemium',
        level: 'beginner',
        tags: ['Company Prep'],
      },
      {
        title: 'GeeksforGeeks Aptitude',
        description: 'Topic-wise aptitude questions for placements.',
        url: 'https://www.geeksforgeeks.org/aptitude/',
        type: 'free',
        level: 'beginner',
        tags: ['Topic-wise'],
      },
    ],
  },
  {
    key: 'courses',
    title: 'Free Courses & MOOCs',
    icon: GraduationCap,
    color: 'text-violet-600 bg-violet-500/10',
    description: 'World-class CS education for free. Best ROI for college students.',
    resources: [
      {
        title: 'CS50 (Harvard)',
        description: "David Malan's legendary intro CS course. Best starting point.",
        url: 'https://cs50.harvard.edu/',
        type: 'free',
        level: 'beginner',
        tags: ['Beginner', 'Most Popular'],
      },
      {
        title: 'NPTEL (IITs)',
        description: 'Indian professors, IIT content. Gold standard for core CS fundamentals.',
        url: 'https://nptel.ac.in/',
        type: 'free',
        level: 'intermediate',
        tags: ['Indian', 'IIT'],
      },
      {
        title: 'freeCodeCamp',
        description: 'Full-stack web dev, data science, and machine learning certifications.',
        url: 'https://www.freecodecamp.org/',
        type: 'free',
        level: 'beginner',
        tags: ['Web Dev', 'Certifications'],
      },
      {
        title: 'MIT OCW (CS)',
        description: 'Full MIT course materials for free. Most rigorous CS content online.',
        url: 'https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/',
        type: 'free',
        level: 'advanced',
        tags: ['Advanced', 'Theory'],
      },
    ],
  },
  {
    key: 'interview',
    title: 'Interview Prep',
    icon: Briefcase,
    color: 'text-amber-600 bg-amber-500/10',
    description: 'Mock interviews, behavioral prep, and company-specific guides.',
    resources: [
      {
        title: 'Pramp',
        description: 'Free peer-to-peer mock interviews (technical + behavioral).',
        url: 'https://www.pramp.com/',
        type: 'free',
        level: 'intermediate',
        tags: ['Mock Interviews'],
      },
      {
        title: 'InterviewBit',
        description: 'Structured interview prep with company-wise tracks.',
        url: 'https://www.interviewbit.com/',
        type: 'freemium',
        level: 'intermediate',
        tags: ['Company-wise'],
      },
      {
        title: 'IGotAnOffer (Engineering Manager Handbook)',
        description: 'Detailed FAANG interview guides (L4-L7) and salary negotiation.',
        url: 'https://igotanoffer.com/',
        type: 'paid',
        level: 'advanced',
        tags: ['FAANG', 'Negotiation'],
      },
      {
        title: 'GitHub Student Developer Pack',
        description: 'Free domain, $200 GitHub credits, JetBrains all-products pack, Canva Pro, and more.',
        url: 'https://education.github.com/pack',
        type: 'free',
        level: 'beginner',
        tags: ['Tools', 'Student Pack'],
      },
    ],
  },
  {
    key: 'system-design',
    title: 'System Design',
    icon: Sparkles,
    color: 'text-fuchsia-600 bg-fuchsia-500/10',
    description: 'Required for SDE-2+ roles and FAANG senior positions.',
    resources: [
      {
        title: 'System Design Primer (GitHub)',
        description: '250k+ stars. The most comprehensive free resource.',
        url: 'https://github.com/donnemartin/system-design-primer',
        type: 'free',
        level: 'advanced',
        tags: ['Most Popular'],
      },
      {
        title: 'Gaurav Sen (YouTube)',
        description: "Best Indian YouTube channel for system design. Clear, visual, beginner-friendly.",
        url: 'https://www.youtube.com/c/GauravSensei',
        type: 'free',
        level: 'intermediate',
        tags: ['Indian', 'Video'],
      },
      {
        title: 'Alex Xu System Design Vol 1 & 2',
        description: "Visual, bite-sized. Best book on system design. Worth every rupee.",
        url: 'https://bytebytego.com/',
        type: 'paid',
        level: 'advanced',
        tags: ['Book'],
      },
      {
        title: 'High Scalability Blog',
        description: 'How real systems scale (Instagram, Pinterest, WhatsApp, etc.).',
        url: 'http://highscalability.com/',
        type: 'free',
        level: 'advanced',
        tags: ['Real Systems'],
      },
    ],
  },
  {
    key: 'projects',
    title: 'Projects & Portfolio',
    icon: Trophy,
    color: 'text-pink-600 bg-pink-500/10',
    description: 'Build standout projects and showcase them like a pro.',
    resources: [
      {
        title: 'Build Your Own X',
        description: 'Recreate popular tools (Redis, Docker, BitTorrent). Best way to learn deeply.',
        url: 'https://github.com/codecrafters-io/build-your-own-x',
        type: 'free',
        level: 'advanced',
        tags: ['Learning by Building'],
      },
      {
        title: 'App Ideas (Florin Pop)',
        description: '100+ project ideas sorted by difficulty. Pick one and build.',
        url: 'https://github.com/florinpop17/app-ideas',
        type: 'free',
        level: 'beginner',
        tags: ['Idea List'],
      },
      {
        title: 'Canva (Free tier)',
        description: 'Quick, beautiful portfolio designs. No design skills needed.',
        url: 'https://www.canva.com/',
        type: 'freemium',
        level: 'beginner',
        tags: ['Design'],
      },
      {
        title: 'Overleaf (LaTeX)',
        description: 'Best for resumes, reports, papers. Used by top researchers.',
        url: 'https://www.overleaf.com/',
        type: 'freemium',
        level: 'intermediate',
        tags: ['LaTeX', 'Resume'],
      },
    ],
  },
];

const TYPE_COLOR: Record<string, string> = {
  free: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  freemium: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  paid: 'bg-red-500/10 text-red-700 dark:text-red-400',
};

const LEVEL_COLOR: Record<string, string> = {
  beginner: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  intermediate: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
  advanced: 'bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400',
};

export function ResourcesView() {
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState<string>('all');

  const filtered = CATEGORIES.map((cat) => ({
    ...cat,
    resources: cat.resources.filter(
      (r) =>
        (!search ||
          r.title.toLowerCase().includes(search.toLowerCase()) ||
          r.description.toLowerCase().includes(search.toLowerCase()) ||
          r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))) &&
        (activeCat === 'all' || cat.key === activeCat)
    ),
  })).filter((cat) => cat.resources.length > 0);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-violet-600" /> Resources Hub
        </h1>
        <p className="text-muted-foreground mt-1">
          Free + paid resources curated for Indian CS students. Everything you need in college.
        </p>
      </div>

      {/* Search + filter */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search resources, topics, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveCat('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeCat === 'all'
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              All Categories
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCat(cat.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeCat === cat.key
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {cat.title}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <div className="space-y-8">
        {filtered.map((cat) => {
          const Icon = cat.icon;
          return (
            <div key={cat.key}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${cat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{cat.title}</h2>
                  <p className="text-sm text-muted-foreground">{cat.description}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {cat.resources.map((r) => (
                  <a
                    key={r.url}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <Card className="hover:shadow-lg hover:border-violet-500/30 transition-all h-full">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold group-hover:text-violet-600 transition">{r.title}</h3>
                          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-violet-600 transition flex-shrink-0" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{r.description}</p>
                        <div className="flex flex-wrap gap-1">
                          <Badge className={`text-xs ${TYPE_COLOR[r.type]}`}>
                            {r.type === 'free' ? '✓ Free' : r.type === 'freemium' ? '⚡ Freemium' : '💎 Paid'}
                          </Badge>
                          <Badge className={`text-xs ${LEVEL_COLOR[r.level]}`}>
                            {r.level}
                          </Badge>
                          {r.tags.slice(0, 2).map((t) => (
                            <Badge key={t} variant="default" className="text-xs">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
            <div className="font-semibold">No resources match your search</div>
          </CardContent>
        </Card>
      )}

      {/* Tips card */}
      <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Star className="h-5 w-5 text-violet-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">How to use this list</div>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                <li><strong>First year:</strong> Start with CS50 + Striver A2Z sheet (basics)</li>
                <li><strong>Second year:</strong> Complete Striver SDE + LeetCode 200 (medium+)</li>
                <li><strong>Third year:</strong> System design (Gaurav Sen) + mock interviews (Pramp)</li>
                <li><strong>Final year:</strong> Company-specific prep + GitHub Student Pack</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}