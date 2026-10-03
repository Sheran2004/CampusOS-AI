/**
 * CampusOS AI - Unified AI Layer
 *
 * Supports three modes:
 *  - "openai"    : Uses OpenAI GPT-4o-mini (cheapest, fast)
 *  - "anthropic" : Uses Claude Sonnet (best for nuanced feedback)
 *  - "demo"      : Deterministic smart heuristics (no API key needed)
 *
 * Set AI_PROVIDER in .env.local. If a key is missing, falls back to "demo".
 */

import type { ResumeAnalysis, SkillGapAnalysis, InterviewFeedback } from './types';

type AIProvider = 'openai' | 'anthropic' | 'demo';

function getProvider(): AIProvider {
  const explicit = (process.env.AI_PROVIDER || '').toLowerCase();
  if (explicit === 'openai' && process.env.OPENAI_API_KEY) return 'openai';
  if (explicit === 'anthropic' && process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) return 'anthropic';
  if (process.env.OPENAI_API_KEY) return 'openai';
  return 'demo';
}

const RESUME_SYSTEM_PROMPT = `You are an expert ATS (Applicant Tracking System) resume reviewer specialized in evaluating resumes of Indian college students applying for tech and business roles.

Analyze the resume and return ONLY valid JSON in this exact format:
{
  "score": number 0-100 (overall resume quality, BE STRICT — most resumes score 50-70, only perfect ones reach 80+),
  "atsScore": number 0-100 (ATS parseability),
  "strengths": [string] (2-4 specific strengths),
  "weaknesses": [string] (4-6 specific weaknesses pointing out what's MISSING),
  "missingSections": [string] (e.g. "Projects", "Achievements"),
  "suggestions": [string] (5-7 actionable improvements),
  "extractedSkills": [string] (technical + soft skills mentioned),
  "experienceYears": number (estimated from resume),
  "educationLevel": "BTech" | "MTech" | "MCA" | "BCA" | "Diploma" | "Other",
  "recommendedRoles": [string] (3-5 suitable job titles)
}

Be ruthlessly honest. Reference what you actually see. If the resume is generic or has weak content, score it accordingly.`;

async function callOpenAI(system: string, user: string): Promise<string> {
  const OpenAI = (await import('openai')).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.4,
  });
  return completion.choices[0].message.content || '{}';
}

async function callAnthropic(system: string, user: string): Promise<string> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    system,
    messages: [{ role: 'user', content: user }],
  });
  const block = message.content[0];
  if (block.type === 'text') return block.text;
  return '{}';
}

async function callAI(system: string, user: string): Promise<string> {
  const provider = getProvider();
  if (provider === 'openai') return callOpenAI(system, user);
  if (provider === 'anthropic') return callAnthropic(system, user);
  throw new Error('Demo mode requires heuristic processing');
}

/* ============================================================
 * RESUME ANALYZER
 * ============================================================ */

export async function analyzeResume(resumeText: string): Promise<ResumeAnalysis> {
  const provider = getProvider();

  if (provider !== 'demo') {
    try {
      const raw = await callAI(
        RESUME_SYSTEM_PROMPT,
        `Analyze this resume:\n\n---\n${resumeText}\n---`
      );
      const parsed = JSON.parse(raw);
      // Clamp score and atsScore so AI also can't return crazy values
      if (typeof parsed.score === 'number') {
        parsed.score = Math.max(0, Math.min(100, Math.round(parsed.score)));
      }
      if (typeof parsed.atsScore === 'number') {
        parsed.atsScore = Math.max(0, Math.min(100, Math.round(parsed.atsScore)));
      }
      return { ...parsed, provider, analyzedAt: new Date().toISOString() };
    } catch (err) {
      console.error('AI resume analysis failed, falling back to demo:', err);
    }
  }

  return analyzeResumeHeuristic(resumeText);
}

/**
 * STRICT resume heuristic. Most generic / weak resumes should land 40-65.
 * Only well-tailored, quantified, complete resumes reach 80+.
 */
function analyzeResumeHeuristic(text: string): ResumeAnalysis {
  const lower = text.toLowerCase();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const lineCount = text.split('\n').filter((l) => l.trim().length > 0).length;

  // ============================================================
  // SECTION DETECTION (comprehensive)
  // ============================================================
  const hasContact =
    /(@|gmail\.com|linkedin\.com|github\.com|phone|\+91|mobile|email\s*[:\-])/i.test(text);
  const hasLinks = /(linkedin\.com|github\.com|gitlab\.com|bitbucket\.org|behance\.net|dribbble\.com|leetcode\.com|hackerrank\.com|codeforces\.com)/i.test(text);
  const hasSummary = /(summary|objective|profile|about\s*me|professional\s*summary|career\s*objective)/i.test(text);
  const hasEducation =
    /(education|b\.?\s?tech|m\.?\s?tech|bachelor|master|degree|university|college|cgpa|gpa|10th|12th|intermediate|diploma)/i.test(text);
  const hasExperience =
    /(experience|internship|worked|employment|work\s*experience|professional\s*experience)/i.test(text);
  const hasProjects =
    /(project|projects|built|developed|created|designed|implemented|github\.com\/)/i.test(text);
  const hasSkills =
    /(^|\n)\s*(skills?|technical\s*skills?|tech\s*stack|technologies|expertise|proficient)/i.test(text);
  const hasAchievements =
    /(award|achievement|certificate|certified|won|winner|accomplishment|scholarship|honor|honour|ranked|top\s*\d)/i.test(text);
  const hasExtracurriculars =
    /(volunteer|leadership|president|coordinator|club|hackathon|event|organize|treasurer|secretary|captain|head\s*of)/i.test(text);
  const hasCertifications = /(certified|certification|certificate|aws\s*certified|google\s*certified|azure\s*certified)/i.test(text);
  const hasPortfolio = /(portfolio|github\.com\/|demo\s*link|live\s*link|deployed|vercel\.app|netlify\.app)/i.test(text);
  const hasLanguages = /(\benglish\b|\bhindi\b|\btamil\b|\bbengali\b|\bmarathi\b|\bspanish\b|\bfrench\b|\bgerman\b)/i.test(text);

  // ============================================================
  // SKILL EXTRACTION (categorized for better role matching)
  // ============================================================
  const SKILL_CATEGORIES = {
    languages: [
      'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'kotlin', 'swift',
      'ruby', 'php', 'scala', 'dart', 'r', 'matlab', 'sql',
    ],
    frontend: [
      'react', 'next.js', 'nextjs', 'vue', 'angular', 'svelte', 'redux', 'tailwind',
      'css', 'html', 'sass', 'scss', 'webpack', 'vite', 'figma', 'storybook', 'material ui',
      'chakra ui', 'bootstrap', 'jquery',
    ],
    backend: [
      'node.js', 'nodejs', 'express', 'django', 'fastapi', 'flask', 'spring boot', 'rails',
      'laravel', 'nestjs', 'graphql', 'rest api', 'grpc', 'kafka', 'rabbitmq', 'redis',
    ],
    database: [
      'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'dynamodb', 'firebase',
      'sqlite', 'cassandra', 'neo4j', 'snowflake', 'bigquery', 'prisma', 'sequelize',
    ],
    devops: [
      'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins',
      'ci/cd', 'github actions', 'circleci', 'linux', 'nginx', 'bash',
    ],
    ml: [
      'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy',
      'scikit-learn', 'keras', 'opencv', 'nlp', 'computer vision', 'transformers',
      'huggingface', 'langchain', 'llm', 'data analysis', 'matplotlib', 'seaborn',
    ],
    mobile: ['android', 'ios', 'flutter', 'react native', 'swift', 'kotlin', 'xamarin'],
    tools: ['git', 'github', 'jira', 'confluence', 'figma', 'postman', 'docker', 'vscode'],
  };

  const allSkillKeywords = Object.values(SKILL_CATEGORIES).flat();
  const extractedSkills = allSkillKeywords.filter((s) => lower.includes(s));

  // Categorize skills
  const skillsByCategory: Record<string, string[]> = {};
  for (const [cat, list] of Object.entries(SKILL_CATEGORIES)) {
    const found = list.filter((s) => extractedSkills.includes(s));
    if (found.length > 0) skillsByCategory[cat] = found;
  }
  const categoryCount = Object.keys(skillsByCategory).length;

  // ============================================================
  // QUALITY SIGNALS (granular detection)
  // ============================================================
  const metricCount =
    (text.match(/\d+%|\d+\s*(x|times)|\$\s*\d+|\d+\s*(ms|seconds|minutes|hours|days|GB|MB|KB)|\d+\s*(users|customers|requests|transactions|MAU|DAU|clients|students|engineers|requests\/sec|QPS|RPS)/gi) || []).length;
  const hasQuantifiedMetrics = metricCount > 0;

  const ACTION_VERBS = [
    'built', 'designed', 'developed', 'architected', 'optimized', 'implemented', 'led',
    'shipped', 'launched', 'created', 'engineered', 'automated', 'reduced', 'increased',
    'improved', 'scaled', 'delivered', 'migrated', 'deployed', 'spearheaded', 'pioneered',
    'orchestrated', 'streamlined', 'accelerated', 'modernized', 'refactored', 'mentored',
    'collaborated', 'coordinated', 'managed', 'led', 'founded', 'initiated', 'authored',
  ];
  const actionVerbMatches = text.match(new RegExp(`\\b(${ACTION_VERBS.join('|')})\\b`, 'gi')) || [];
  const actionVerbCount = actionVerbMatches.length;
  const uniqueActionVerbs = new Set(actionVerbMatches.map((v) => v.toLowerCase())).size;

  // Penalize fluff words
  const FLUFF = [
    'responsible for', 'duties included', 'work included', 'tasked with', 'worked on',
    'helped with', 'involved in', 'assisted with', 'participated in',
  ];
  const fluffCount = FLUFF.reduce((sum, f) => sum + (lower.match(new RegExp(`\\b${f}\\b`, 'g')) || []).length, 0);

  // ============================================================
  // STRICT SCORING (improved — more granular, ATS-aware)
  // ============================================================
  const sectionScores = {
    contact: 0,
    summary: 0,
    education: 0,
    experience: 0,
    projects: 0,
    skills: 0,
    achievements: 0,
    extracurriculars: 0,
    links: 0,
  };

  // Base section scores
  if (hasContact) sectionScores.contact = 5;
  if (hasLinks) sectionScores.links = 4; // separate from contact — LinkedIn/GitHub etc.
  if (hasSummary) sectionScores.summary = 6;
  if (hasEducation) sectionScores.education = 10;
  if (hasExperience) sectionScores.experience = 12;
  if (hasProjects) sectionScores.projects = 16; // heaviest weight
  if (hasSkills) sectionScores.skills = 9;
  if (hasAchievements || hasCertifications) sectionScores.achievements = 6;
  if (hasExtracurriculars) sectionScores.extracurriculars = 3;

  // Skills quality bonus
  if (extractedSkills.length >= 12) sectionScores.skills += 4;
  else if (extractedSkills.length >= 8) sectionScores.skills += 2;
  else if (extractedSkills.length < 4) sectionScores.skills -= 3; // penalty for too few

  // Cross-category breadth bonus (shows full-stack or diverse ability)
  if (categoryCount >= 4) sectionScores.skills += 3;
  else if (categoryCount >= 3) sectionScores.skills += 1;

  let score = Object.values(sectionScores).reduce((s, v) => s + v, 0);

  // Quality bonuses
  if (hasQuantifiedMetrics) score += Math.min(12, metricCount * 2); // 2 pts per metric, max 12
  if (actionVerbCount >= 10) score += 8;
  else if (actionVerbCount >= 6) score += 5;
  else if (actionVerbCount >= 3) score += 2;
  if (uniqueActionVerbs >= 5) score += 3; // vocabulary diversity

  // Length scoring (sweet spot 280-580 words for 1-page)
  if (wordCount < 80) score -= 30;
  else if (wordCount < 150) score -= 18;
  else if (wordCount < 250) score -= 6;
  else if (wordCount > 750) score -= 10;
  else if (wordCount > 1000) score -= 18;

  // Fluff penalty
  if (fluffCount >= 5) score -= 6;
  else if (fluffCount >= 3) score -= 3;

  // Heavy penalties for missing critical sections
  if (!hasProjects) score -= 12; // single biggest content gap
  if (!hasExperience && !hasProjects) score -= 8;
  if (!hasSkills && !hasProjects) score -= 4; // at least skills or project tech

  // Link bonuses (recruiters ACTUALLY click these)
  if (hasPortfolio) score += 3;
  if (hasLanguages) score += 1; // soft skill signal

  score = Math.max(5, Math.min(95, Math.round(score)));

  // ============================================================
  // ATS SCORE (more granular — what parsers actually care about)
  // ============================================================
  let atsScore = 0;
  if (hasContact) atsScore += 10;
  if (hasLinks) atsScore += 5;
  if (hasSummary) atsScore += 8;
  if (hasEducation) atsScore += 15;
  if (hasExperience) atsScore += 15;
  if (hasSkills) atsScore += 12;
  if (extractedSkills.length >= 8) atsScore += 8;
  else if (extractedSkills.length >= 5) atsScore += 5;
  else if (extractedSkills.length < 3) atsScore -= 5;
  // ATS format-friendliness
  if (lineCount <= 60 && wordCount >= 200 && wordCount <= 700) atsScore += 12;
  else if (wordCount >= 150 && wordCount <= 900) atsScore += 6;
  // Penalties
  if (wordCount > 1200) atsScore -= 12;
  if (wordCount < 100) atsScore -= 15;
  if (fluffCount >= 6) atsScore -= 6;
  // ATS hates tables, columns, graphics — can't detect but can warn in suggestions
  atsScore = Math.max(0, Math.min(95, atsScore));

  // ============================================================
  // STRENGTHS (specific, with examples from the resume)
  // ============================================================
  const strengths: string[] = [];
  if (hasProjects && actionVerbCount >= 3) {
    const verbList = [...new Set(actionVerbMatches.map((v) => v.toLowerCase()))].slice(0, 3).join(', ');
    strengths.push(`Project descriptions use strong action verbs (${verbList})`);
  }
  if (hasQuantifiedMetrics) {
    const samples: string[] = [];
    const percentMatch = text.match(/\d+%/g);
    const scaleMatch = text.match(/\d+\s*(users|customers|requests|MAU|DAU|clients|students)/gi);
    if (percentMatch) samples.push(`${percentMatch.length}% metrics`);
    if (scaleMatch) samples.push(`${scaleMatch.length} scale indicators`);
    strengths.push(
      `Quantified impact: ${metricCount} metrics found${samples.length ? ' (' + samples.join(', ') + ')' : ''}`
    );
  }
  if (extractedSkills.length >= 10) {
    strengths.push(`Strong technical breadth: ${extractedSkills.length} skills across ${categoryCount} categories`);
  } else if (extractedSkills.length >= 6) {
    strengths.push(`Solid skill set: ${extractedSkills.length} relevant technical skills listed`);
  }
  if (hasAchievements) {
    const achMatch = text.match(/(award|achievement|won|winner|ranked|top\s*\d)[^.]{0,60}/gi);
    if (achMatch && achMatch.length > 0) {
      strengths.push(`Includes ${achMatch.length} achievements/certifications`);
    }
  }
  if (hasExperience && hasSkills) {
    strengths.push('Clear work experience with relevant tech stack alignment');
  }
  if (hasPortfolio) {
    strengths.push('Portfolio/GitHub/demo links included (recruiters verify these)');
  }
  if (uniqueActionVerbs >= 6) {
    strengths.push(`Diverse action verb vocabulary (${uniqueActionVerbs} unique verbs used)`);
  }
  if (categoryCount >= 4) {
    strengths.push(`Multi-domain expertise across ${categoryCount} areas (full-stack signal)`);
  }

  // ============================================================
  // MISSING SECTIONS
  // ============================================================
  const missingSections: string[] = [];
  if (!hasSummary) missingSections.push('Professional Summary (2-3 lines at top)');
  if (!hasExperience) missingSections.push('Work Experience / Internships');
  if (!hasProjects) missingSections.push('Projects (with descriptions + tech stack)');
  if (!hasSkills) missingSections.push('Dedicated Skills Section (categorized)');
  if (!hasAchievements) missingSections.push('Achievements / Awards / Certifications');
  if (!hasExtracurriculars) missingSections.push('Extracurriculars / Leadership');
  if (!hasQuantifiedMetrics) missingSections.push('Quantified impact metrics (%, scale, time)');
  if (!hasLinks) missingSections.push('Live links (LinkedIn, GitHub, portfolio)');
  if (extractedSkills.length < 6) missingSections.push(`More technical skills (only ${extractedSkills.length} detected)`);

  // ============================================================
  // WEAKNESSES (specific, actionable, with examples)
  // ============================================================
  const weaknesses: string[] = [];
  if (!hasProjects) {
    weaknesses.push('CRITICAL: No projects section. Recruiters expect 3-4 solid projects with tech stack + impact.');
  }
  if (!hasQuantifiedMetrics) {
    weaknesses.push('Zero quantified achievements. Example: "Built API" → "Built REST API serving 50K requests/day, reducing p99 latency by 40%".');
  } else if (metricCount < 3 && hasExperience) {
    weaknesses.push(`Only ${metricCount} metric(s) — aim for 8-12 across projects and experience.`);
  }
  if (wordCount < 200) {
    weaknesses.push(`Resume is too short (${wordCount} words). Target 350-550 words for a 1-page student resume.`);
  } else if (wordCount > 800) {
    weaknesses.push(`Resume is too long (${wordCount} words). Recruiters spend 6-10 seconds. Cut to 1 page (under 600 words).`);
  }
  if (extractedSkills.length < 5) {
    weaknesses.push(`Only ${extractedSkills.length} technical skill detected. Add 8-12 — too few = weak signal.`);
  } else if (extractedSkills.length < 8) {
    weaknesses.push(`${extractedSkills.length} skills is okay but 10-12 is the sweet spot for your target role.`);
  }
  if (actionVerbCount < 3 && (hasExperience || hasProjects)) {
    weaknesses.push(`Only ${actionVerbCount} action verb(s) found. Use "Built", "Designed", "Optimized", "Scaled", "Led" — not "Worked on" / "Responsible for".`);
  }
  if (fluffCount >= 3) {
    const examples = FLUFF.filter((f) => lower.includes(f)).slice(0, 2);
    weaknesses.push(`Contains ${fluffCount} generic phrases${examples.length ? ' like "' + examples.join('", "') + '"' : ''} — replace with concrete impact.`);
  }
  if (!hasAchievements && !hasCertifications) {
    weaknesses.push('No achievements or certifications listed. Add hackathon wins, scholarships, online certs (AWS, Google), CGPA if 8+.');
  }
  if (!hasLinks) {
    weaknesses.push('No LinkedIn/GitHub links. Recruiters Google you — make it easy.');
  }
  if (categoryCount < 2 && extractedSkills.length > 0) {
    weaknesses.push(`Skills are all in one category (${Object.keys(skillsByCategory)[0] || 'unknown'}). Show breadth — add a DB, framework, or DevOps tool.`);
  }
  if (missingSections.length >= 4) {
    weaknesses.push(`${missingSections.length} standard sections missing — that's a major ATS compatibility issue.`);
  }

  // ============================================================
  // SUGGESTIONS (ordered by impact, role-aware)
  // ============================================================
  const suggestions: string[] = [
    'Add 2-3 quantified bullets per project/role. Numbers are the single biggest score booster ("reduced load time by 40%" > "made it faster").',
    'Start every bullet with a strong action verb. Replace "Responsible for" / "Worked on" with "Built", "Designed", "Optimized", "Scaled", "Led".',
    'Tailor your Skills section to ONE target role. Frontend = React/TypeScript/Tailwind at top. Backend = Python/Node/PostgreSQL at top.',
    'Add live links: GitHub repo, deployed demo (Vercel/Netlify), LinkedIn profile. Recruiters actually click these.',
    'Use the "XYZ" formula: "Accomplished [X], as measured by [Y], by doing [Z]". Forces quantification + impact.',
    'Keep resume to 1 page if you have <2 years experience. Cut projects older than 2 years, keep only 3-4 best.',
    'Add a 2-3 line Professional Summary at top: "[Role] with [X years/strength] who [achievement]. Seeking [target]."',
  ];

  // Role-specific suggestions
  if (extractedSkills.includes('react') || extractedSkills.includes('next.js')) {
    suggestions.push('Frontend-specific: add SSR/SSG knowledge, performance optimization, accessibility (a11y), and a portfolio link.');
  }
  if (extractedSkills.includes('python') || extractedSkills.includes('tensorflow')) {
    suggestions.push('ML-specific: include dataset size, model accuracy, business impact. Recruiters want numbers — "99% accuracy on 10K samples" > "built an ML model".');
  }
  if (extractedSkills.includes('aws') || extractedSkills.includes('docker')) {
    suggestions.push('DevOps-specific: list services used (EC2/S3/Lambda for AWS), CI/CD tools, infrastructure-as-code projects.');
  }

  // ============================================================
  // EDUCATION DETECTION
  // ============================================================
  let educationLevel: ResumeAnalysis['educationLevel'] = 'Other';
  if (/b\.?\s?tech|btech|bachelor\s*of\s*technology/i.test(text)) educationLevel = 'BTech';
  else if (/m\.?\s?tech|mtech|master\s*of\s*technology/i.test(text)) educationLevel = 'MTech';
  else if (/\bmca\b|master\s*of\s*computer/i.test(text)) educationLevel = 'MCA';
  else if (/\bbca\b|bachelor\s*of\s*computer/i.test(text)) educationLevel = 'BCA';
  else if (/diploma/i.test(text)) educationLevel = 'Diploma';

  const yearMatches = text.match(/20\d{2}/g) || [];
  const experienceYears = yearMatches.length > 0 ? Math.min(3, yearMatches.length - 1) : 0;

  // ============================================================
  // RECOMMENDED ROLES (skill-based matching)
  // ============================================================
  const recommendedRoles: string[] = [];
  const skillSet = new Set(extractedSkills);
  if ([...skillSet].some((s) => ['react', 'next.js', 'nextjs', 'tailwind', 'typescript', 'vue', 'angular'].includes(s)))
    recommendedRoles.push('Frontend Developer');
  if ([...skillSet].some((s) => ['node.js', 'nodejs', 'express', 'mongodb', 'postgresql', 'fastapi', 'django', 'spring boot', 'flask'].includes(s)))
    recommendedRoles.push('Full Stack Developer');
  if ([...skillSet].some((s) => ['python', 'machine learning', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn', 'nlp', 'llm'].includes(s)))
    recommendedRoles.push('ML Engineer');
  if ([...skillSet].some((s) => ['java', 'spring', 'spring boot', 'kafka'].includes(s)))
    recommendedRoles.push('Backend Developer');
  if ([...skillSet].some((s) => ['figma', 'storybook'].includes(s))) recommendedRoles.push('UI/UX Designer');
  if ([...skillSet].some((s) => ['flutter', 'react native', 'android', 'kotlin', 'swift', 'ios'].includes(s)))
    recommendedRoles.push('Mobile Developer');
  if ([...skillSet].some((s) => ['aws', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd'].includes(s)))
    recommendedRoles.push('DevOps Engineer');
  if ([...skillSet].some((s) => ['aws', 'gcp', 'azure'].includes(s)) && recommendedRoles.length === 0)
    recommendedRoles.push('Cloud Engineer');
  if (recommendedRoles.length === 0) {
    recommendedRoles.push('Software Developer');
    recommendedRoles.push('Technical Intern');
  }

  return {
    score,
    atsScore,
    strengths: strengths.slice(0, 5),
    weaknesses: weaknesses.slice(0, 6),
    missingSections: missingSections.slice(0, 7),
    suggestions: suggestions.slice(0, 8),
    extractedSkills,
    experienceYears,
    educationLevel,
    recommendedRoles: recommendedRoles.slice(0, 5),
    provider: 'demo',
    analyzedAt: new Date().toISOString(),
  };
}

/* ============================================================
 * SKILL GAP ANALYZER
 * ============================================================ */

interface SkillGapInput {
  currentSkills: string[];
  targetRole: string;
  branch?: string;
  year?: string;
}

const ROLE_REQUIRED_SKILLS: Record<string, { required: string[]; preferred: string[]; resources: Record<string, string> }> = {
  'frontend developer': {
    required: ['javascript', 'react', 'html', 'css', 'git', 'github'],
    preferred: ['typescript', 'next.js', 'tailwind', 'redux', 'testing'],
    resources: {
      react: 'https://react.dev',
      typescript: 'https://www.typescriptlang.org/docs/',
      nextjs: 'https://nextjs.org/learn',
    },
  },
  'full stack developer': {
    required: ['javascript', 'react', 'node.js', 'sql', 'git', 'github', 'rest api'],
    preferred: ['typescript', 'next.js', 'mongodb', 'postgresql', 'docker', 'aws'],
    resources: {
      node: 'https://nodejs.org/en/learn',
      mongodb: 'https://learn.mongodb.com',
    },
  },
  'backend developer': {
    required: ['python', 'sql', 'rest api', 'git', 'github', 'data structures'],
    preferred: ['django', 'fastapi', 'postgresql', 'docker', 'aws', 'redis', 'system design'],
    resources: {
      python: 'https://www.learnpython.org',
      system: 'https://github.com/donnemartin/system-design-primer',
    },
  },
  'data scientist': {
    required: ['python', 'sql', 'statistics', 'machine learning', 'data analysis'],
    preferred: ['tensorflow', 'pytorch', 'pandas', 'numpy', 'tableau', 'deep learning'],
    resources: {
      ml: 'https://www.coursera.org/learn/machine-learning',
      python: 'https://www.kaggle.com/learn/python',
    },
  },
  'ml engineer': {
    required: ['python', 'machine learning', 'deep learning', 'sql', 'data structures'],
    preferred: ['tensorflow', 'pytorch', 'mlops', 'docker', 'aws', 'kubernetes'],
    resources: {
      pytorch: 'https://pytorch.org/tutorials/',
      mlops: 'https://ml-ops.org',
    },
  },
  'mobile developer': {
    required: ['kotlin', 'android', 'git', 'github'],
    preferred: ['flutter', 'react native', 'swift', 'ios', 'firebase'],
    resources: {
      android: 'https://developer.android.com/courses',
      flutter: 'https://flutter.dev/learn',
    },
  },
  'ui/ux designer': {
    required: ['figma', 'ui design', 'ux research'],
    preferred: ['prototyping', 'wireframing', 'user testing', 'adobe xd', 'css'],
    resources: { figma: 'https://www.figma.com/resources/learn-design/' },
  },
  'devops engineer': {
    required: ['linux', 'docker', 'git', 'ci/cd', 'aws'],
    preferred: ['kubernetes', 'terraform', 'ansible', 'monitoring', 'python'],
    resources: { devops: 'https://roadmap.sh/devops' },
  },
};

const ROLE_ALIASES: Record<string, string> = {
  'frontend developer intern': 'frontend developer',
  'full stack developer intern': 'full stack developer',
  'backend developer intern': 'backend developer',
  'sde intern': 'full stack developer',
  'sde': 'full stack developer',
  'software developer': 'full stack developer',
  'software engineer': 'full stack developer',
  'data analyst': 'data scientist',
  'data engineer': 'data scientist',
  'android developer': 'mobile developer',
  'ios developer': 'mobile developer',
  'designer': 'ui/ux designer',
  'product designer': 'ui/ux designer',
};

function resolveRole(input: string): { canonical: string; skills: typeof ROLE_REQUIRED_SKILLS[string] } | null {
  const normalized = input.toLowerCase().trim();
  const canonical = ROLE_ALIASES[normalized] || normalized;
  const found = ROLE_REQUIRED_SKILLS[canonical];
  if (found) return { canonical, skills: found };
  for (const key of Object.keys(ROLE_REQUIRED_SKILLS)) {
    if (canonical.includes(key) || key.includes(canonical)) {
      return { canonical: key, skills: ROLE_REQUIRED_SKILLS[key] };
    }
  }
  return null;
}

export async function analyzeSkillGap(input: SkillGapInput): Promise<SkillGapAnalysis> {
  const provider = getProvider();
  if (provider !== 'demo') {
    try {
      const system = `You are an expert career coach. Given a student's current skills and target role, output JSON with: {matchPercentage: number 0-100, missingRequired: [string], missingPreferred: [string], strengths: [string], roadmap: [{skill, level: "beginner|intermediate|advanced", weeks: number, resources: [string]}], summary: string}. Be specific and reference the actual role.`;
      const raw = await callAI(
        system,
        `Target role: ${input.targetRole}\nCurrent skills: ${input.currentSkills.join(', ')}\nBranch: ${input.branch || 'unspecified'}\nYear: ${input.year || 'unspecified'}`
      );
      const parsed = JSON.parse(raw);
      if (typeof parsed.matchPercentage === 'number') {
        parsed.matchPercentage = Math.max(0, Math.min(100, Math.round(parsed.matchPercentage)));
      }
      return { ...parsed, provider, analyzedAt: new Date().toISOString() };
    } catch (err) {
      console.error('AI skill gap analysis failed, falling back:', err);
    }
  }

  return analyzeSkillGapHeuristic(input);
}

function analyzeSkillGapHeuristic(input: SkillGapInput): SkillGapAnalysis {
  const resolved = resolveRole(input.targetRole);
  const currentSkillsLower = input.currentSkills.map((s) => s.toLowerCase());

  if (!resolved) {
    return {
      matchPercentage: 50,
      missingRequired: ['Role not in our standard database -- add skills manually if you know the role'],
      missingPreferred: [],
      strengths: input.currentSkills.slice(0, 3),
      roadmap: [],
      summary: `We don't have a detailed skill map for "${input.targetRole}". Your skills: ${input.currentSkills.join(', ')}.`,
      provider: 'demo',
      analyzedAt: new Date().toISOString(),
    };
  }

  const { canonical, skills } = resolved;
  const matchedRequired = skills.required.filter((req) =>
    currentSkillsLower.some((cur) => cur.includes(req) || req.includes(cur))
  );
  const missingRequired = skills.required.filter((req) => !matchedRequired.some((m) => m === req));

  const matchedPreferred = skills.preferred.filter((req) =>
    currentSkillsLower.some((cur) => cur.includes(req) || req.includes(cur))
  );
  const missingPreferred = skills.preferred.filter((req) => !matchedPreferred.some((m) => m === req));

  const totalRequired = skills.required.length;
  const matchPercentage = Math.max(0, Math.min(100, Math.round((matchedRequired.length / totalRequired) * 100)));

  const strengths = [...matchedRequired, ...matchedPreferred].slice(0, 4);

  const roadmap: Array<{
    skill: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    weeks: number;
    resources: string[];
  }> = missingRequired.map((skill, idx) => {
    const weeks = idx === 0 ? 4 : idx === 1 ? 3 : 2;
    return {
      skill,
      level: 'beginner',
      weeks,
      resources: [
        skills.resources[skill] || `https://www.google.com/search?q=learn+${encodeURIComponent(skill)}`,
        `Free course: search "${skill} for beginners" on YouTube`,
      ],
    };
  });

  missingPreferred.slice(0, 2).forEach((skill) => {
    roadmap.push({
      skill,
      level: 'intermediate',
      weeks: 2,
      resources: [
        skills.resources[skill] || `https://www.google.com/search?q=master+${encodeURIComponent(skill)}`,
      ],
    });
  });

  let summary = '';
  if (matchPercentage >= 80) summary = `Strong fit. ${matchedRequired.length}/${totalRequired} required skills. Focus on sharpening with 1-2 portfolio projects.`;
  else if (matchPercentage >= 50) summary = `Decent fit. ~${matchPercentage}% eligibility for ${canonical} roles. Close the gaps below.`;
  else if (matchPercentage >= 25) summary = `Significant skill gap for ${canonical}. 3-6 months focused effort can make you competitive.`;
  else summary = `${canonical} requires substantial upskilling. Start with DSA, Git, and one core language.`;

  return {
    matchPercentage,
    missingRequired,
    missingPreferred,
    strengths,
    roadmap,
    summary,
    provider: 'demo',
    analyzedAt: new Date().toISOString(),
  };
}

/* ============================================================
 * MOCK INTERVIEW FEEDBACK
 * ============================================================ */

interface InterviewAnswerInput {
  question: string;
  answer: string;
  role: string;
}

export async function generateInterviewFeedback(input: InterviewAnswerInput): Promise<InterviewFeedback> {
  const provider = getProvider();
  if (provider !== 'demo') {
    try {
      const system = `You are a strict but fair technical interviewer. Evaluate the candidate's answer to a ${input.role} interview question. Return JSON: {score: number 0-100, contentScore: number 0-100, clarityScore: number 0-100, confidenceScore: number 0-100, feedback: string, improvements: [string], sampleAnswer: string, keyPointsCovered: [string], keyPointsMissed: [string]}. Be specific. Reference what they actually said.`;
      const raw = await callAI(
        system,
        `Question: ${input.question}\n\nCandidate's answer: "${input.answer}"\n\nRole: ${input.role}`
      );
      const parsed = JSON.parse(raw);
      ['score', 'contentScore', 'clarityScore', 'confidenceScore'].forEach((k) => {
        if (typeof parsed[k] === 'number') parsed[k] = Math.max(0, Math.min(100, Math.round(parsed[k])));
      });
      return { ...parsed, provider };
    } catch (err) {
      console.error('AI interview feedback failed, falling back:', err);
    }
  }

  return generateInterviewFeedbackHeuristic(input);
}

function generateInterviewFeedbackHeuristic(input: InterviewAnswerInput): InterviewFeedback {
  const answer = input.answer.trim();
  const length = answer.length;
  const words = answer.split(/\s+/).filter(Boolean);

  const hasSTAR = /situation|task|action|result|challenge|outcome/i.test(answer);
  const hasNumbers = /\d+/.test(answer);
  const hasTechDetail = /\b(api|database|server|function|component|class|method|system|design|optimi[sz]ed|architecture)\b/i.test(answer);
  const hasExamples = /for example|for instance|such as|like when/i.test(answer);

  let contentScore = 30;
  if (length > 50) contentScore += 15;
  if (length > 150) contentScore += 10;
  if (hasSTAR) contentScore += 15;
  if (hasNumbers) contentScore += 10;
  if (hasTechDetail) contentScore += 10;
  if (hasExamples) contentScore += 10;

  const clarityScore = Math.min(100, 40 + Math.floor(length / 8) + (words.length > 30 && words.length < 200 ? 25 : 10));

  const confidenceScore = Math.min(
    100,
    35 +
      (length > 100 ? 15 : 5) +
      (hasNumbers ? 12 : 0) +
      (hasExamples ? 10 : 0) +
      (/\b(definitely|absolutely|confident|strong|passionate)\b/i.test(answer) ? 8 : 0) +
      (!/(maybe|i think|i guess|not sure|kind of|sort of)/i.test(answer) ? 5 : 0)
  );

  const overallScore = Math.min(100, Math.round(contentScore * 0.5 + clarityScore * 0.25 + confidenceScore * 0.25));

  const feedback =
    overallScore >= 75
      ? 'Strong answer! Clear structure and concrete impact.'
      : overallScore >= 55
        ? 'Good foundation. Sharpen with more specificity and measurable outcomes.'
        : overallScore >= 35
          ? 'On track but lacks depth. Use STAR framework and add measurable results.'
          : 'Significant room for improvement. Add concrete examples and structure.';

  const improvements: string[] = [];
  if (!hasSTAR) improvements.push('Use STAR framework: Situation to Task to Action to Result');
  if (!hasNumbers) improvements.push('Add quantifiable impact (e.g. reduced load time by 40% for 10K users)');
  if (length < 80) improvements.push('Provide more depth -- 60-90 second responses are standard');
  if (length > 500) improvements.push('Tighten your answer -- aim for 90-150 words for clarity');
  if (!hasTechDetail && /developer|engineer|technical/i.test(input.role))
    improvements.push('Include specific technical details (technologies used, architecture decisions)');
  if (!hasExamples) improvements.push('Anchor abstract claims with 1 specific example from your experience');

  return {
    score: overallScore,
    contentScore,
    clarityScore,
    confidenceScore,
    feedback,
    improvements,
    sampleAnswer:
      'Strong answer template:\n- Open with context (situation)\n- Describe your specific role and actions\n- Highlight 2-3 technical or collaboration details\n- Close with measurable outcomes (numbers, scale, impact)',
    keyPointsCovered: [
      hasExamples ? 'Provided example' : 'Attempted structure',
      hasNumbers ? 'Included metrics' : 'Stated the approach',
    ].filter(Boolean) as string[],
    keyPointsMissed: [
      !hasSTAR ? 'STAR structure' : '',
      !hasNumbers ? 'Quantifiable impact' : '',
      !hasTechDetail ? 'Technical depth' : '',
    ].filter(Boolean) as string[],
    provider: 'demo',
  };
}

/* ============================================================
 * INTERVIEW QUESTION GENERATOR
 * ============================================================ */

const INTERVIEW_QUESTIONS: Record<string, string[]> = {
  hr: [
    'Tell me about yourself and what makes you interested in this role.',
    'Describe a time you faced a conflict in a team. How did you handle it?',
    'What is your biggest weakness and how are you working on it?',
    'Where do you see yourself in 5 years?',
    'Why should we hire you over other candidates?',
    'Tell me about a time you failed and what you learned.',
    'Describe a situation where you had to learn something quickly.',
    'How do you handle tight deadlines and pressure?',
  ],
  dsa: [
    'Explain the difference between an array and a linked list. When would you use each?',
    'How would you reverse a linked list? Walk me through your approach.',
    'What is the time complexity of binary search? Can you implement it on a whiteboard?',
    'Explain how a hash map works internally. How does it handle collisions?',
    'Describe the quicksort algorithm and its average vs worst-case complexity.',
    'How would you detect a cycle in a linked list?',
    'Explain dynamic programming with an example.',
    'How would you find the shortest path in a graph?',
  ],
  frontend: [
    'Explain the virtual DOM and how React uses it for performance.',
    'What are closures in JavaScript? Give a practical example.',
    'How does CSS specificity work? When does order matter?',
    'What is the difference between == and === in JavaScript?',
    'Explain event delegation and why it is useful.',
    'How would you optimize a slow React application?',
    'What is the box model in CSS? Describe each component.',
    'Explain the difference between state and props in React.',
  ],
  backend: [
    'How would you design a URL shortener like bit.ly?',
    'Explain REST vs GraphQL. When would you choose each?',
    'What is the CAP theorem? Give a real-world example for each consistency model.',
    'How would you scale a system from 1K to 1M users?',
    'Explain database indexing and when it hurts performance.',
    'How do you handle authentication in a distributed system?',
    'What is the difference between SQL and NoSQL databases?',
    'Explain how JWT works and its security implications.',
  ],
  behavioral: [
    'Tell me about a project you are most proud of.',
    'Describe a time you disagreed with your manager. What did you do?',
    'Give an example of when you went above and beyond for a customer or teammate.',
    'Tell me about a time you had to learn something completely new under a deadline.',
    'Describe a situation where you had to influence others without authority.',
    'Tell me about a complex problem you solved. What made it complex?',
  ],
};

export function getInterviewQuestions(role: string): string[] {
  const normalized = role.toLowerCase();
  if (normalized.includes('hr') || normalized.includes('behavioral')) {
    return [...INTERVIEW_QUESTIONS.hr, ...INTERVIEW_QUESTIONS.behavioral].slice(0, 8);
  }
  if (normalized.includes('frontend')) return INTERVIEW_QUESTIONS.frontend;
  if (normalized.includes('backend')) return INTERVIEW_QUESTIONS.backend;
  if (normalized.includes('dsa') || normalized.includes('algorithm') || normalized.includes('coding'))
    return INTERVIEW_QUESTIONS.dsa;
  return [
    ...INTERVIEW_QUESTIONS.hr.slice(0, 3),
    ...INTERVIEW_QUESTIONS.dsa.slice(0, 3),
    ...INTERVIEW_QUESTIONS.frontend.slice(0, 2),
  ];
}

/* ============================================================
 * JOB MATCHING (Real 30+ Indian companies)
 * ============================================================ */

interface JobMatchInput {
  candidateSkills: string[];
  targetRole?: string;
  branch?: string;
  year?: string;
}

export interface JobMatchResult {
  job: JobListing;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  reasoning: string;
}

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

export const JOB_DATABASE: JobListing[] = [
  { id: 'j1', title: 'Frontend Developer Intern', company: 'Razorpay', location: 'Bangalore (Hybrid)', type: 'internship', stipend: '₹40,000 - 60,000 / month', skills: ['react', 'javascript', 'typescript', 'tailwind', 'css'], description: 'Build payment experiences used by millions of Indian merchants. Work with designers, backend engineers, and product managers to ship impactful features weekly.', applyUrl: 'https://razorpay.com/jobs', source: 'Razorpay Careers', postedDays: 2, category: 'SDE' },
  { id: 'j2', title: 'Full Stack Engineer Intern', company: 'Zerodha', location: 'Bangalore', type: 'internship', stipend: '₹35,000 - 50,000 / month', skills: ['node.js', 'react', 'postgresql', 'redis', 'docker'], description: 'Build trading and investing tools for the largest stock broker in India. Strong focus on performance and scale.', applyUrl: 'https://zerodha.com/careers', source: 'Zerodha Careers', postedDays: 5, category: 'SDE' },
  { id: 'j3', title: 'Machine Learning Intern', company: 'Google India', location: 'Hyderabad', type: 'internship', stipend: '₹80,000 - 1,20,000 / month', skills: ['python', 'machine learning', 'tensorflow', 'data structures', 'statistics'], description: 'Work on ML systems powering Search, Ads, or YouTube. Publish-quality research encouraged.', applyUrl: 'https://careers.google.com', source: 'Google Careers', postedDays: 1, category: 'ML' },
  { id: 'j4', title: 'Backend Developer Intern', company: 'Swiggy', location: 'Bangalore', type: 'internship', stipend: '₹30,000 - 50,000 / month', skills: ['java', 'spring', 'postgresql', 'rest api', 'docker'], description: 'Build reliable, high-throughput backend services handling millions of food orders per day.', applyUrl: 'https://careers.swiggy.com', source: 'Swiggy Careers', postedDays: 7, category: 'SDE' },
  { id: 'j5', title: 'Mobile Developer Intern (Android)', company: 'Cred', location: 'Bangalore', type: 'internship', stipend: '₹50,000 - 70,000 / month', skills: ['kotlin', 'android', 'jetpack compose', 'rest api'], description: 'Build delightful Android experiences for premium credit card users. Strong design focus.', applyUrl: 'https://careers.cred.club', source: 'Cred Careers', postedDays: 3, category: 'Mobile' },
  { id: 'j6', title: 'Data Analyst Intern', company: 'PhonePe', location: 'Bangalore', type: 'internship', stipend: '₹30,000 - 45,000 / month', skills: ['sql', 'python', 'data analysis', 'tableau', 'statistics'], description: 'Analyze UPI transaction data, build dashboards, and surface insights to product teams.', applyUrl: 'https://phonepe.com/careers', source: 'PhonePe Careers', postedDays: 4, category: 'Data' },
  { id: 'j7', title: 'UI/UX Design Intern', company: 'Meesho', location: 'Bangalore (Remote)', type: 'internship', stipend: '₹30,000 - 50,000 / month', skills: ['figma', 'ui design', 'ux research', 'prototyping'], description: 'Design for next 500M internet users. Strong portfolio and user empathy required.', applyUrl: 'https://meesho.com/jobs', source: 'Meesho Careers', postedDays: 6, category: 'Design' },
  { id: 'j8', title: 'DevOps Intern', company: 'Freshworks', location: 'Chennai', type: 'internship', stipend: '₹25,000 - 40,000 / month', skills: ['docker', 'kubernetes', 'aws', 'ci/cd', 'linux'], description: 'Help scale infrastructure for 60,000+ business customers across the globe.', applyUrl: 'https://freshworks.com/careers', source: 'Freshworks Careers', postedDays: 8, category: 'DevOps' },
  { id: 'j9', title: 'Frontend Engineer', company: 'Postman', location: 'Bangalore', type: 'fulltime', ctc: '₹14,00,000 - 22,00,000 / year', skills: ['react', 'javascript', 'typescript', 'rest api', 'node.js'], description: 'Join the team building the most-used API platform in the world (30M+ developers).', applyUrl: 'https://postman.com/careers', source: 'Postman Careers', postedDays: 10, category: 'SDE' },
  { id: 'j10', title: 'SDE Intern', company: 'Microsoft India', location: 'Hyderabad', type: 'internship', stipend: '₹1,00,000 - 1,50,000 / month', skills: ['data structures', 'algorithms', 'system design', 'c++', 'python'], description: 'Work on products used by 1B+ users. Top performers get pre-placement offers.', applyUrl: 'https://careers.microsoft.com', source: 'Microsoft Careers', postedDays: 2, category: 'SDE' },
  { id: 'j11', title: 'Data Science Intern', company: 'Flipkart', location: 'Bangalore', type: 'internship', stipend: '₹50,000 - 75,000 / month', skills: ['python', 'machine learning', 'sql', 'pandas', 'statistics'], description: 'Build recommendation systems, demand forecasting, and pricing models for India largest e-commerce platform.', applyUrl: 'https://flipkartcareers.com', source: 'Flipkart Careers', postedDays: 5, category: 'Data' },
  { id: 'j12', title: 'Full Stack Developer', company: 'Groww', location: 'Bangalore', type: 'fulltime', ctc: '₹12,00,000 - 18,00,000 / year', skills: ['react', 'node.js', 'mongodb', 'typescript', 'aws'], description: 'Build investing products used by 5M+ Indian investors. Fast-paced, ownership-driven environment.', applyUrl: 'https://groww.in/careers', source: 'Groww Careers', postedDays: 3, category: 'SDE' },
  { id: 'j13', title: 'Software Engineer', company: 'Atlassian', location: 'Bangalore', type: 'fulltime', ctc: '₹32,00,000 - 48,00,000 / year', skills: ['java', 'react', 'system design', 'aws', 'kubernetes'], description: 'Build collaboration tools (Jira, Confluence) used by 300K+ companies. Strong engineering culture.', applyUrl: 'https://atlassian.com/careers', source: 'Atlassian Careers', postedDays: 1, category: 'SDE' },
  { id: 'j14', title: 'SDE-1', company: 'Amazon India', location: 'Hyderabad', type: 'fulltime', ctc: '₹28,00,000 - 44,00,000 / year', skills: ['java', 'data structures', 'system design', 'aws', 'rest api'], description: 'Work on AWS, Alexa, or Pay. Ownership-driven teams. Internal transfers after 12 months.', applyUrl: 'https://amazon.jobs', source: 'Amazon Jobs', postedDays: 4, category: 'SDE' },
  { id: 'j15', title: 'Frontend Developer', company: 'Paytm', location: 'Noida (Hybrid)', type: 'fulltime', ctc: '₹10,00,000 - 18,00,000 / year', skills: ['react', 'next.js', 'typescript', 'tailwind', 'javascript'], description: 'Build India most-used payments app. Reach 500M+ users with every release.', applyUrl: 'https://paytm.com/careers', source: 'Paytm Careers', postedDays: 6, category: 'SDE' },
  { id: 'j16', title: 'Backend Engineer', company: 'Paytm', location: 'Bangalore', type: 'fulltime', ctc: '₹12,00,000 - 22,00,000 / year', skills: ['java', 'spring', 'postgresql', 'redis', 'kafka'], description: 'Scale payment systems handling 1B+ transactions per month.', applyUrl: 'https://paytm.com/careers', source: 'Paytm Careers', postedDays: 8, category: 'SDE' },
  { id: 'j17', title: 'ML Engineer Intern', company: 'Razorpay', location: 'Bangalore', type: 'internship', stipend: '₹60,000 - 90,000 / month', skills: ['python', 'machine learning', 'tensorflow', 'sql', 'data structures'], description: 'Build fraud-detection and risk-scoring models that process 5M+ transactions daily.', applyUrl: 'https://razorpay.com/jobs', source: 'Razorpay Careers', postedDays: 2, category: 'ML' },
  { id: 'j18', title: 'iOS Developer Intern', company: 'Cred', location: 'Bangalore', type: 'internship', stipend: '₹50,000 - 70,000 / month', skills: ['swift', 'ios', 'xcode', 'rest api'], description: 'Build polished iOS experiences for India premium credit card holders.', applyUrl: 'https://careers.cred.club', source: 'Cred Careers', postedDays: 5, category: 'Mobile' },
  { id: 'j19', title: 'Full Stack Developer Intern', company: 'Swiggy', location: 'Bangalore', type: 'internship', stipend: '₹40,000 - 60,000 / month', skills: ['node.js', 'react', 'postgresql', 'docker', 'aws'], description: 'Build food delivery and quick commerce features used by 50M+ Indians monthly.', applyUrl: 'https://careers.swiggy.com', source: 'Swiggy Careers', postedDays: 1, category: 'SDE' },
  { id: 'j20', title: 'Data Engineer', company: 'Meesho', location: 'Bangalore', type: 'fulltime', ctc: '₹18,00,000 - 28,00,000 / year', skills: ['python', 'sql', 'spark', 'airflow', 'aws'], description: 'Build data pipelines powering recommendations for 5M+ daily active users.', applyUrl: 'https://meesho.com/jobs', source: 'Meesho Careers', postedDays: 9, category: 'Data' },
  { id: 'j21', title: 'Software Engineer Intern', company: 'Meesho', location: 'Bangalore', type: 'internship', stipend: '₹60,000 - 80,000 / month', skills: ['javascript', 'react', 'next.js', 'tailwind', 'node.js'], description: 'Own end-to-end features on India fastest-growing social commerce platform.', applyUrl: 'https://meesho.com/jobs', source: 'Meesho Careers', postedDays: 4, category: 'SDE' },
  { id: 'j22', title: 'Cloud Engineer Intern', company: 'Zoho', location: 'Chennai', type: 'internship', stipend: '₹30,000 - 50,000 / month', skills: ['aws', 'linux', 'docker', 'python', 'networking'], description: 'Work on Zoho Mail, Workplace, or ManageEngine. Strong on system fundamentals.', applyUrl: 'https://zoho.com/careers', source: 'Zoho Careers', postedDays: 11, category: 'DevOps' },
  { id: 'j23', title: 'Software Engineer Intern', company: 'Salesforce', location: 'Hyderabad', type: 'internship', stipend: '₹80,000 - 1,00,000 / month', skills: ['java', 'apex', 'javascript', 'system design'], description: 'Work on the world #1 CRM platform. Mentorship-driven culture with clear PPO paths.', applyUrl: 'https://salesforce.com/careers', source: 'Salesforce Careers', postedDays: 3, category: 'SDE' },
  { id: 'j24', title: 'Security Engineer', company: 'Cred', location: 'Bangalore', type: 'fulltime', ctc: '₹22,00,000 - 35,00,000 / year', skills: ['security', 'python', 'linux', 'networking', 'cryptography'], description: 'Protect payment infrastructure for 10M+ active users. Threat modeling, pentesting.', applyUrl: 'https://careers.cred.club', source: 'Cred Careers', postedDays: 7, category: 'Security' },
  { id: 'j25', title: 'Data Analyst', company: 'Ola', location: 'Bangalore', type: 'fulltime', ctc: '₹10,00,000 - 18,00,000 / year', skills: ['sql', 'python', 'tableau', 'statistics', 'data analysis'], description: 'Analyze ride-sharing data and pricing models for India #1 mobility platform.', applyUrl: 'https://olacabs.com/careers', source: 'Ola Careers', postedDays: 6, category: 'Data' },
  { id: 'j26', title: 'Tech Product Manager Intern', company: 'PhonePe', location: 'Bangalore', type: 'internship', stipend: '₹50,000 - 80,000 / month', skills: ['product', 'sql', 'analytics', 'communication'], description: 'Own product roadmaps for India largest UPI app. Strong analytical + communication skills.', applyUrl: 'https://phonepe.com/careers', source: 'PhonePe Careers', postedDays: 5, category: 'Product' },
  { id: 'j27', title: 'SDE-1 Frontend', company: 'Groww', location: 'Bangalore', type: 'fulltime', ctc: '₹16,00,000 - 24,00,000 / year', skills: ['react', 'typescript', 'next.js', 'redux'], description: 'Build India fastest-growing investment platform reaching 50M+ users.', applyUrl: 'https://groww.in/careers', source: 'Groww Careers', postedDays: 2, category: 'SDE' },
  { id: 'j28', title: 'AI Research Intern', company: 'Sarvam AI', location: 'Bangalore', type: 'internship', stipend: '₹80,000 - 1,20,000 / month', skills: ['python', 'pytorch', 'machine learning', 'deep learning', 'nlp'], description: 'Work on India-first LLMs and Indic language models. Publish-quality research expected.', applyUrl: 'https://sarvam.ai/careers', source: 'Sarvam AI Careers', postedDays: 1, category: 'ML' },
  { id: 'j29', title: 'Software Engineer', company: 'Zerodha', location: 'Bangalore', type: 'fulltime', ctc: '₹15,00,000 - 25,00,000 / year', skills: ['golang', 'python', 'postgresql', 'redis', 'docker'], description: 'Build India largest stock trading platform with extreme performance focus.', applyUrl: 'https://zerodha.com/careers', source: 'Zerodha Careers', postedDays: 8, category: 'SDE' },
  { id: 'j30', title: 'Frontend Intern', company: 'Postman', location: 'Bangalore', type: 'internship', stipend: '₹50,000 - 70,000 / month', skills: ['react', 'typescript', 'node.js', 'graphql'], description: 'Work on the most-used API platform in the world. Real ownership from week 1.', applyUrl: 'https://postman.com/careers', source: 'Postman Careers', postedDays: 6, category: 'SDE' },
  { id: 'j31', title: 'Quantitative Researcher', company: 'Tower Research', location: 'Bangalore', type: 'fulltime', ctc: '₹40,00,000 - 70,00,000 / year', skills: ['python', 'mathematics', 'statistics', 'machine learning'], description: 'Build alpha-generating trading strategies. Strong math, stats, coding background needed.', applyUrl: 'https://tower-research.com/careers', source: 'Tower Research', postedDays: 12, category: 'Quant' },
  { id: 'j32', title: 'UI/UX Designer', company: 'CRED', location: 'Bangalore', type: 'fulltime', ctc: '₹18,00,000 - 30,00,000 / year', skills: ['figma', 'ui design', 'prototyping', 'design system'], description: 'Design premium experiences for India most exclusive credit card holders.', applyUrl: 'https://careers.cred.club', source: 'Cred Careers', postedDays: 5, category: 'Design' },
  { id: 'j33', title: 'SDE Intern', company: 'Goldman Sachs', location: 'Bangalore', type: 'internship', stipend: '₹1,20,000 - 1,80,000 / month', skills: ['java', 'python', 'data structures', 'system design'], description: 'Work on trading systems, risk management, or asset management platforms.', applyUrl: 'https://goldmansachs.com/careers', source: 'Goldman Sachs Careers', postedDays: 3, category: 'SDE' },
  { id: 'j34', title: 'Platform Engineer', company: 'Groww', location: 'Bangalore', type: 'fulltime', ctc: '₹20,00,000 - 32,00,000 / year', skills: ['kubernetes', 'terraform', 'aws', 'golang', 'linux'], description: 'Build the platform powering 50M+ investor accounts. Massive scale, high ownership.', applyUrl: 'https://groww.in/careers', source: 'Groww Careers', postedDays: 4, category: 'DevOps' },
];

export async function matchJobs(input: JobMatchInput): Promise<JobMatchResult[]> {
  const candidateSkillsLower = input.candidateSkills.map((s) => s.toLowerCase());

  const scored = JOB_DATABASE.map((job) => {
    const jobSkillsLower = job.skills.map((s) => s.toLowerCase());
    const matched: string[] = [];
    const missing: string[] = [];

    for (const req of jobSkillsLower) {
      const isMatch = candidateSkillsLower.some(
        (cand) => cand.includes(req) || req.includes(cand) || levenshteinLike(cand, req) > 0.7
      );
      if (isMatch) matched.push(req);
      else missing.push(req);
    }

    const matchScore = Math.max(0, Math.min(100, Math.round((matched.length / jobSkillsLower.length) * 100)));

    let reasoning = '';
    if (matchScore >= 80) reasoning = 'Excellent fit. You have most required skills. Apply now.';
    else if (matchScore >= 60) reasoning = 'Strong fit. Highlight related projects in your application.';
    else if (matchScore >= 40) reasoning = 'Partial fit. Worth applying if interested.';
    else reasoning = 'Stretch role. Would need upskilling first.';

    return {
      job,
      matchScore,
      matchedSkills: matched,
      missingSkills: missing,
      reasoning,
    };
  });

  scored.sort((a, b) => {
    const scoreDiff = b.matchScore - a.matchScore;
    if (Math.abs(scoreDiff) > 5) return scoreDiff;
    return a.job.postedDays - b.job.postedDays;
  });

  return scored;
}

function levenshteinLike(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  const minLen = Math.min(a.length, b.length);
  const maxLen = Math.max(a.length, b.length);
  let matches = 0;
  for (let i = 0; i < minLen; i++) {
    if (a[i] === b[i]) matches++;
  }
  return matches / maxLen;
}

/* ============================================================
 * PLACEMENT READINESS SCORE
 * ============================================================ */

export interface PlacementReadinessFactors {
  resumeScore: number;
  skillMatchAvg: number;
  mockInterviewAvg: number;
  projectsCount: number;
  internshipsCount: number;
  githubActivity: number;
  appliedThisMonth: number;
}

export function calculatePlacementReadiness(factors: PlacementReadinessFactors): {
  overall: number;
  breakdown: Array<{ label: string; score: number; weight: number; status: 'good' | 'warn' | 'critical' }>;
  nextAction: string;
} {
  const weights = {
    resume: 0.18,
    skillMatch: 0.22,
    interviews: 0.15,
    projects: 0.15,
    internships: 0.15,
    github: 0.08,
    applications: 0.07,
  };

  const projectScore = Math.min(100, factors.projectsCount * 20);
  const internshipScore = Math.min(100, factors.internshipsCount * 35);
  const githubScore = Math.min(100, factors.githubActivity * 1.2);
  const appsScore = Math.min(100, factors.appliedThisMonth * 8);

  const overall = Math.max(0, Math.min(100, Math.round(
    factors.resumeScore * weights.resume +
      factors.skillMatchAvg * weights.skillMatch +
      factors.mockInterviewAvg * weights.interviews +
      projectScore * weights.projects +
      internshipScore * weights.internships +
      githubScore * weights.github +
      appsScore * weights.applications
  )));

  const breakdown = [
    { label: 'Resume Quality', score: factors.resumeScore, weight: weights.resume * 100, status: (factors.resumeScore >= 70 ? 'good' : factors.resumeScore >= 50 ? 'warn' : 'critical') as 'good' | 'warn' | 'critical' },
    { label: 'Skill Match', score: factors.skillMatchAvg, weight: weights.skillMatch * 100, status: (factors.skillMatchAvg >= 70 ? 'good' : factors.skillMatchAvg >= 50 ? 'warn' : 'critical') as 'good' | 'warn' | 'critical' },
    { label: 'Mock Interview Performance', score: factors.mockInterviewAvg, weight: weights.interviews * 100, status: (factors.mockInterviewAvg >= 70 ? 'good' : factors.mockInterviewAvg >= 50 ? 'warn' : 'critical') as 'good' | 'warn' | 'critical' },
    { label: 'Project Portfolio', score: projectScore, weight: weights.projects * 100, status: (projectScore >= 70 ? 'good' : projectScore >= 50 ? 'warn' : 'critical') as 'good' | 'warn' | 'critical' },
    { label: 'Internship Experience', score: internshipScore, weight: weights.internships * 100, status: (internshipScore >= 70 ? 'good' : internshipScore >= 50 ? 'warn' : 'critical') as 'good' | 'warn' | 'critical' },
    { label: 'GitHub Activity', score: githubScore, weight: weights.github * 100, status: (githubScore >= 70 ? 'good' : githubScore >= 50 ? 'warn' : 'critical') as 'good' | 'warn' | 'critical' },
    { label: 'Application Volume', score: appsScore, weight: weights.applications * 100, status: (appsScore >= 70 ? 'good' : appsScore >= 50 ? 'warn' : 'critical') as 'good' | 'warn' | 'critical' },
  ];

  let nextAction = '';
  const lowest = [...breakdown].sort((a, b) => a.score - b.score)[0];
  if (lowest.label === 'Resume Quality') nextAction = 'Upload your resume to the Resume Analyzer.';
  else if (lowest.label === 'Skill Match') nextAction = 'Run Skill Gap Analysis for your target role.';
  else if (lowest.label === 'Mock Interview Performance') nextAction = 'Complete one Mock Interview today.';
  else if (lowest.label === 'Project Portfolio') nextAction = 'Add 1 strong project with GitHub repo + live demo link.';
  else if (lowest.label === 'Internship Experience') nextAction = 'Apply to 5 internships this week.';
  else if (lowest.label === 'GitHub Activity') nextAction = 'Make 5+ commits this week.';
  else nextAction = 'Apply to at least 3 jobs this week.';

  return { overall, breakdown, nextAction };
}

/* ============================================================
 * HACKATHONS DATABASE
 * ============================================================ */

export interface Hackathon {
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

export const HACKATHON_DATABASE: Hackathon[] = [
  { id: 'h1', name: 'HackOn with Amazon 2026', organizer: 'Amazon', startDate: '2026-10-12', endDate: '2026-10-13', mode: 'online', prizePool: '₹5,00,000 + PPO interviews', participants: 12500, themes: ['AI/ML', 'E-commerce', 'Voice AI'], description: 'Build AI-powered shopping experiences. Top teams get fast-track Amazon SDE interviews.', applyUrl: 'https://hackonwithamazon.com', source: 'Amazon', status: 'upcoming' },
  { id: 'h2', name: 'Flipkart Runway', organizer: 'Flipkart', startDate: '2026-10-18', endDate: '2026-10-19', mode: 'hybrid', city: 'Bangalore', prizePool: '₹3,00,000 + Pre-Placement Offers', participants: 8200, themes: ['Supply Chain', 'Logistics Tech', 'AI'], description: 'Solve real India commerce logistics problems with tech. Top 5 teams get Flipkart PPOs.', applyUrl: 'https://flipkart.com/runway', source: 'Flipkart', status: 'upcoming' },
  { id: 'h3', name: 'Google Solution Challenge', organizer: 'Google Developer Student Clubs', startDate: '2026-11-05', endDate: '2026-11-06', mode: 'online', prizePool: '$3,000 + Google Cloud Credits', participants: 35000, themes: ['SDG Goals', 'AI for Good', 'Mobile/Web'], description: 'Build tech for UN Sustainable Development Goals. Globally recognized competition.', applyUrl: 'https://developers.google.com/solution-challenge', source: 'Google DSC', status: 'upcoming' },
  { id: 'h4', name: 'Devfolio MLH Hack', organizer: 'Devfolio', startDate: '2026-10-25', endDate: '2026-10-26', mode: 'online', prizePool: '₹2,00,000', participants: 6500, themes: ['Web3', 'AI', 'Open Source'], description: '48-hour online hackathon with mentors from top Indian startups.', applyUrl: 'https://devfolio.co', source: 'Devfolio', status: 'upcoming' },
  { id: 'h5', name: 'Microsoft Imagine Cup India', organizer: 'Microsoft', startDate: '2026-12-10', endDate: '2026-12-12', mode: 'hybrid', city: 'Hyderabad', prizePool: '$100,000 + Azure Credits', participants: 28000, themes: ['AI', 'Healthcare', 'Sustainability'], description: 'India leg of global student startup competition. Travel + accommodation covered.', applyUrl: 'https://imaginecup.microsoft.com', source: 'Microsoft', status: 'upcoming' },
  { id: 'h6', name: 'Razorpay FTX', organizer: 'Razorpay', startDate: '2026-10-30', endDate: '2026-10-31', mode: 'hybrid', city: 'Bangalore', prizePool: '₹4,00,000 + SDE Internships', participants: 4500, themes: ['FinTech', 'Payments', 'AI'], description: 'Build next-gen fintech. Winners get direct SDE internship offers at Razorpay.', applyUrl: 'https://razorpay.com/ftx', source: 'Razorpay', status: 'upcoming' },
  { id: 'h7', name: 'Smart India Hackathon 2026', organizer: 'AICTE + Government of India', startDate: '2026-11-20', endDate: '2026-11-22', mode: 'offline', city: 'Multiple Cities', prizePool: '₹10,00,000', participants: 50000, themes: ['Government Tech', 'AI', 'IoT', 'Health'], description: 'India largest student hackathon. Solve real problems from government departments.', applyUrl: 'https://sih.gov.in', source: 'SIH', status: 'upcoming' },
  { id: 'h8', name: 'Paytm Build for Billions', organizer: 'Paytm', startDate: '2026-10-15', endDate: '2026-10-16', mode: 'online', prizePool: '₹2,50,000', participants: 3800, themes: ['Mobile', 'AI', 'Voice'], description: 'Build for the next billion Indian smartphone users. Voice-first, low-bandwidth focus.', applyUrl: 'https://paytm.com/hackathon', source: 'Paytm', status: 'upcoming' },
];

/* ============================================================
 * MENTORS DATABASE
 * ============================================================ */

export interface Mentor {
  id: string;
  name: string;
  role: string;
  company: string;
  college: string;
  yearsExperience: number;
  expertise: string[];
  bio: string;
  hourlyRate: number;
  rating: number;
  reviewsCount: number;
  availability: string[];
  linkedin?: string;
}

export const MENTOR_DATABASE: Mentor[] = [
  { id: 'm1', name: 'Priya Sharma', role: 'Senior Software Engineer', company: 'Google', college: 'IIT Delhi, 2020', yearsExperience: 5, expertise: ['System Design', 'DSA', 'Career Coaching', 'Google Interview Prep'], bio: 'Helped 200+ students land SDE roles at top product companies. Specialized in system design interviews.', hourlyRate: 499, rating: 4.9, reviewsCount: 187, availability: ['Mon 7-9 PM', 'Wed 7-9 PM', 'Sat 10-12 AM'] },
  { id: 'm2', name: 'Rohan Verma', role: 'Engineering Manager', company: 'Razorpay', college: 'BITS Pilani, 2017', yearsExperience: 8, expertise: ['Engineering Management', 'Resume Review', 'Behavioral Interviews'], bio: 'Led 15+ hiring loops. Reviews 50+ resumes monthly for SDE-1 and SDE-2 roles.', hourlyRate: 799, rating: 5.0, reviewsCount: 124, availability: ['Tue 8-10 PM', 'Thu 8-10 PM', 'Sun 4-6 PM'] },
  { id: 'm3', name: 'Ananya Iyer', role: 'ML Lead', company: 'Microsoft Research', college: 'IIT Madras, 2018', yearsExperience: 6, expertise: ['Machine Learning', 'NLP', 'Research Papers', 'PhD Applications'], bio: 'Published 10+ papers at NeurIPS/ACL. Helps students break into ML research roles.', hourlyRate: 999, rating: 4.8, reviewsCount: 92, availability: ['Sat 2-4 PM', 'Sun 11-1 PM'] },
  { id: 'm4', name: 'Karthik Reddy', role: 'Staff Frontend Engineer', company: 'Cred', college: 'IIIT Hyderabad, 2019', yearsExperience: 6, expertise: ['React', 'TypeScript', 'Frontend System Design', 'UI/UX'], bio: 'Built Cred payment UI from scratch. Reviews portfolios and UI projects.', hourlyRate: 599, rating: 4.9, reviewsCount: 156, availability: ['Mon 9-11 PM', 'Fri 6-8 PM', 'Sat 4-6 PM'] },
  { id: 'm5', name: 'Sneha Kapoor', role: 'Product Manager', company: 'PhonePe', college: 'NIT Trichy, 2018', yearsExperience: 6, expertise: ['Product Management', 'Tech PM Interviews', 'Case Studies'], bio: 'PM at PhonePe UPI. Cracked 7 PM interviews in India and US. Helps with PM prep.', hourlyRate: 699, rating: 4.7, reviewsCount: 78, availability: ['Wed 6-8 PM', 'Sat 11-1 PM', 'Sun 3-5 PM'] },
  { id: 'm6', name: 'Arjun Mehta', role: 'Quant Researcher', company: 'Tower Research', college: 'IIT Bombay, 2020', yearsExperience: 4, expertise: ['Quantitative Finance', 'Math Olympiad', 'Probability', 'Stats'], bio: 'Quant at top HFT firm. Helps students break into quant trading roles at SIG/Citadel/Jane Street.', hourlyRate: 1299, rating: 5.0, reviewsCount: 64, availability: ['Sat 6-8 PM', 'Sun 6-8 PM'] },
  { id: 'm7', name: 'Divya Nayar', role: 'Design Director', company: 'Meesho', college: 'NID Ahmedabad, 2016', yearsExperience: 9, expertise: ['Portfolio Review', 'UI/UX Coaching', 'Design System', 'Case Studies'], bio: 'Led design at 3 unicorns. Reviews portfolios and conducts mock design interviews.', hourlyRate: 899, rating: 4.9, reviewsCount: 113, availability: ['Tue 7-9 PM', 'Sat 3-5 PM'] },
  { id: 'm8', name: 'Vikram Singh', role: 'DevOps Lead', company: 'Zerodha', college: 'IIT Kanpur, 2018', yearsExperience: 6, expertise: ['DevOps', 'AWS', 'System Design', 'Kubernetes'], bio: 'Manages infrastructure for India largest stock broker. Helps with DevOps career paths.', hourlyRate: 549, rating: 4.8, reviewsCount: 88, availability: ['Mon 8-10 PM', 'Thu 8-10 PM'] },
  { id: 'm9', name: 'Rhea Malhotra', role: 'Data Science Manager', company: 'Flipkart', college: 'IIT Kharagpur, 2019', yearsExperience: 5, expertise: ['Data Science', 'SQL', 'Statistics', 'Case Interviews'], bio: 'Manages DS team at Flipkart. Helps with data science interview prep + case studies.', hourlyRate: 649, rating: 4.8, reviewsCount: 102, availability: ['Wed 8-10 PM', 'Sat 11-1 AM', 'Sun 4-6 PM'] },
  { id: 'm10', name: 'Aditya Joshi', role: 'Founder & CTO', company: 'Zerodha-funded startup', college: 'IIT Delhi, 2017', yearsExperience: 7, expertise: ['Startup Mentoring', 'Tech Leadership', 'Startup Interviews', 'Career Pivots'], bio: 'Founded 2 startups (1 acquired). Mentor for students considering startup vs job track.', hourlyRate: 1199, rating: 5.0, reviewsCount: 73, availability: ['Fri 7-9 PM', 'Sun 2-4 PM'] },
  { id: 'm11', name: 'Neha Bhatt', role: 'Mobile Architect', company: 'Groww', college: 'DTU Delhi, 2019', yearsExperience: 5, expertise: ['iOS', 'Android', 'Flutter', 'React Native', 'Mobile System Design'], bio: 'Built mobile apps for 10M+ users. Helps students break into mobile development.', hourlyRate: 499, rating: 4.7, reviewsCount: 67, availability: ['Tue 9-11 PM', 'Sat 2-4 PM'] },
  { id: 'm12', name: 'Siddharth Rao', role: 'Senior Data Engineer', company: 'Amazon', college: 'IIIT Bangalore, 2018', yearsExperience: 6, expertise: ['Data Engineering', 'Spark', 'Python', 'Big Data'], bio: 'Data engineer on AWS team. Helps students transition into data engineering roles.', hourlyRate: 599, rating: 4.8, reviewsCount: 91, availability: ['Mon 7-9 PM', 'Sat 11-1 AM'] },
];

/* ============================================================
 * HACKATHON IDEA GENERATOR
 * ============================================================ */

export async function generateHackathonIdeas(params: {
  theme?: string;
  skills?: string[];
  count?: number;
}): Promise<Array<{ title: string; description: string; techStack: string[]; difficulty: 'easy' | 'medium' | 'hard' }>> {
  const provider = getProvider();
  const count = params.count || 5;

  if (provider !== 'demo') {
    try {
      const system = `You are a hackathon mentor. Generate ${count} innovative startup/hackathon project ideas. For each, provide title, 2-line description, tech stack, and difficulty (easy/medium/hard). Output valid JSON array.`;
      const raw = await callAI(
        system,
        `Theme: ${params.theme || 'AI for social good'}\nSkills known: ${(params.skills || []).join(', ')}`
      );
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch (err) {
      console.error('Hackathon ideas failed, falling back:', err);
    }
  }

  const all = [
    { title: 'Smart Attendance + Doubt Solver', description: 'AI attendance via face-recognition + on-demand doubt-solver for rural colleges via WhatsApp.', techStack: ['React Native', 'Python', 'OpenCV', 'WhatsApp API'], difficulty: 'medium' as const },
    { title: 'Vernacular Code Tutor', description: 'AI tutor that explains coding concepts in Hindi/Tamil/Telugu using voice + visual code execution.', techStack: ['Next.js', 'GPT-4o', 'ElevenLabs', 'Sandpack'], difficulty: 'hard' as const },
    { title: 'Campus Carbon Tracker', description: 'Track and gamify carbon footprint of college. Electricity, food, transport. Compete with other colleges.', techStack: ['React', 'Node.js', 'IoT Sensors', 'Chart.js'], difficulty: 'medium' as const },
    { title: 'Mental Health Chatbot with Crisis Detection', description: 'Anonymous chat support for students. Detects crisis language and connects to campus counselor instantly.', techStack: ['Next.js', 'Python', 'Whisper STT', 'Fine-tuned LLM'], difficulty: 'hard' as const },
    { title: 'Gig Worker Salary Predictor', description: 'Predict weekly earnings for Swiggy/Zomato riders using weather, events, and historical data.', techStack: ['Python', 'Pandas', 'Scikit-learn', 'Streamlit'], difficulty: 'medium' as const },
    { title: 'College Lost & Found with Visual Search', description: 'AI visual search for lost items on campus. Snap a photo, get matched with found items.', techStack: ['React Native', 'Pinecone', 'CLIP', 'Firebase'], difficulty: 'medium' as const },
    { title: 'Interview Answer Analyzer', description: 'Record yourself answering interview Qs. Get instant feedback on confidence, filler words, structure.', techStack: ['Next.js', 'Whisper', 'GPT-4o', 'WebRTC'], difficulty: 'medium' as const },
    { title: 'WhatsApp-based College Notice Board', description: 'Push college notices via WhatsApp with smart categorization + reply-based attendance.', techStack: ['Node.js', 'WhatsApp Business API', 'MongoDB'], difficulty: 'easy' as const },
    { title: 'Crowdsourced Campus Navigation with AR', description: 'AR navigation inside huge college campuses using crowdsourced indoor maps.', techStack: ['React Native', 'ARKit', 'ARCore', 'Mapbox'], difficulty: 'hard' as const },
    { title: 'AI Resume Roaster for Fun', description: 'Users submit resumes, AI roasts them brutally but with constructive tips. Built for viral sharing.', techStack: ['Next.js', 'GPT-4o', 'Tailwind', 'Framer Motion'], difficulty: 'easy' as const },
    { title: 'Group Study Matcher with Smart Timetable', description: 'Find study partners in your college, auto-build shared timetables from everyone free slots.', techStack: ['Next.js', 'PostgreSQL', 'Calendar API', 'Algolia'], difficulty: 'medium' as const },
    { title: 'Reverse Auction for College Vendors', description: 'Cafeteria/canteen vendors bid to serve events. Saves student council money.', techStack: ['Next.js', 'Stripe Connect', 'Postgres', 'WebSockets'], difficulty: 'medium' as const },
  ];

  let pool = all;
  if (params.theme) {
    const themeLc = params.theme.toLowerCase();
    pool = all.filter((i) =>
      i.title.toLowerCase().includes(themeLc) ||
      i.description.toLowerCase().includes(themeLc) ||
      i.techStack.some((t) => t.toLowerCase().includes(themeLc))
    );
    if (pool.length === 0) pool = all;
  }

  return pool.slice(0, count);
}
