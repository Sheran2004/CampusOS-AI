import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

/**
 * POST /api/resume-builder/tailor
 *
 * Analyzes how well the user's current resume skills align with a target job description.
 * Returns match score, missing skills, matched skills, and tailored suggestions.
 *
 * Body: { jd: string, currentSkills: string[] }
 *
 * Heuristic (no AI required) — keyword extraction + skill dictionary.
 */

type SkillCategory = 'language' | 'frontend' | 'backend' | 'database' | 'devops' | 'ml' | 'mobile' | 'soft';

const SKILL_DICTIONARY: Record<string, SkillCategory> = {
  // Programming languages
  'javascript': 'language', 'typescript': 'language', 'python': 'language', 'java': 'language',
  'c++': 'language', 'c#': 'language', 'go': 'language', 'rust': 'language', 'kotlin': 'language',
  'swift': 'language', 'ruby': 'language', 'php': 'language', 'scala': 'language',
  'dart': 'language', 'r': 'language', 'sql': 'language',

  // Frontend
  'react': 'frontend', 'next.js': 'frontend', 'nextjs': 'frontend', 'vue': 'frontend',
  'angular': 'frontend', 'svelte': 'frontend', 'redux': 'frontend', 'tailwind': 'frontend',
  'css': 'frontend', 'html': 'frontend', 'sass': 'frontend', 'webpack': 'frontend',
  'vite': 'frontend', 'figma': 'frontend', 'storybook': 'frontend', 'material ui': 'frontend',

  // Backend
  'node.js': 'backend', 'nodejs': 'backend', 'express': 'backend', 'django': 'backend',
  'fastapi': 'backend', 'flask': 'backend', 'spring boot': 'backend', 'rails': 'backend',
  'laravel': 'backend', 'nestjs': 'backend', 'graphql': 'backend', 'rest api': 'backend',
  'kafka': 'backend', 'rabbitmq': 'backend',

  // Database
  'mongodb': 'database', 'postgresql': 'database', 'mysql': 'database', 'redis': 'database',
  'elasticsearch': 'database', 'dynamodb': 'database', 'firebase': 'database',
  'sqlite': 'database', 'cassandra': 'database', 'snowflake': 'database',

  // DevOps
  'aws': 'devops', 'gcp': 'devops', 'azure': 'devops', 'docker': 'devops',
  'kubernetes': 'devops', 'terraform': 'devops', 'ansible': 'devops', 'jenkins': 'devops',
  'ci/cd': 'devops', 'github actions': 'devops', 'circleci': 'devops', 'linux': 'devops',
  'nginx': 'devops', 'bash': 'devops',

  // ML
  'machine learning': 'ml', 'deep learning': 'ml', 'tensorflow': 'ml', 'pytorch': 'ml',
  'pandas': 'ml', 'numpy': 'ml', 'scikit-learn': 'ml', 'keras': 'ml', 'opencv': 'ml',
  'nlp': 'ml', 'computer vision': 'ml', 'transformers': 'ml', 'huggingface': 'ml',
  'langchain': 'ml', 'llm': 'ml', 'data analysis': 'ml', 'data science': 'ml',

  // Mobile
  'android': 'mobile', 'ios': 'mobile', 'flutter': 'mobile', 'react native': 'mobile',
  'xamarin': 'mobile',

  // Soft skills often in JDs
  'leadership': 'soft', 'communication': 'soft', 'teamwork': 'soft',
  'problem solving': 'soft', 'analytical': 'soft', 'collaboration': 'soft',
};

const ROLE_KEYWORDS: Record<string, string[]> = {
  'frontend': ['react', 'next.js', 'typescript', 'javascript', 'css', 'tailwind', 'redux', 'html', 'frontend', 'web'],
  'backend': ['node.js', 'python', 'java', 'go', 'postgresql', 'mongodb', 'api', 'backend', 'server', 'microservices'],
  'fullstack': ['react', 'next.js', 'node.js', 'postgresql', 'mongodb', 'full-stack', 'fullstack', 'typescript'],
  'data': ['python', 'sql', 'pandas', 'data analysis', 'data science', 'machine learning', 'tableau', 'power bi'],
  'ml': ['machine learning', 'deep learning', 'tensorflow', 'pytorch', 'nlp', 'computer vision', 'ml', 'ai'],
  'devops': ['aws', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd', 'devops', 'cloud'],
  'mobile': ['flutter', 'react native', 'android', 'ios', 'swift', 'kotlin', 'mobile'],
};

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { jd, currentSkills = [] } = body;

    if (!jd || typeof jd !== 'string' || jd.length < 30) {
      return NextResponse.json({ error: 'Job description too short (min 30 chars)' }, { status: 400 });
    }

    const jdLower = jd.toLowerCase();

    // ---- Extract required skills from JD ----
    const jdSkillsFound = new Set<string>();
    const jdKeywords = new Set<string>();
    for (const [skill, category] of Object.entries(SKILL_DICTIONARY)) {
      // Match word boundaries to avoid false positives
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`(^|[\\s,;.()/"'])${escaped}([\\s,;.()/"']|$)`, 'i');
      if (pattern.test(jdLower)) {
        jdSkillsFound.add(skill);
        jdKeywords.add(skill);
      }
    }

    // Detect role from JD
    const roleScores: Record<string, number> = {};
    for (const [role, keywords] of Object.entries(ROLE_KEYWORDS)) {
      roleScores[role] = keywords.filter((k) => jdLower.includes(k)).length;
    }
    const detectedRole = Object.entries(roleScores).sort((a, b) => b[1] - a[1])[0]?.[0] || 'general';

    // ---- Match against current skills ----
    const currentSkillsLower = new Set<string>(
        (currentSkills as string[]).map((s: string) => s.toLowerCase().trim())
      );
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    for (const skill of jdSkillsFound) {
      let matched = false;
      for (const curr of currentSkillsLower) {
        if (curr === skill || curr.includes(skill) || skill.includes(curr)) {
          matched = true;
          break;
        }
      }
      if (matched) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    }

    // ---- Calculate match score ----
    let matchScore = 0;
    const jdRequiredSkillsArr = Array.from(jdSkillsFound);
    if (jdRequiredSkillsArr.length > 0) {
      const matchPct = (matchedSkills.length / jdRequiredSkillsArr.length) * 70; // 70% weight
      const bonusSkills = Math.min(5, currentSkills.length) * 2; // 10% weight for breadth
      matchScore = Math.round(matchPct + bonusSkills + 15); // 15% baseline for trying
      matchScore = Math.max(0, Math.min(100, matchScore));
    }

    // ---- Generate tailored suggestions ----
    const suggestions: string[] = [];

    if (missingSkills.length > 0) {
      suggestions.push(
        `Add these ${missingSkills.length} missing skills to your resume: ${missingSkills.slice(0, 5).join(', ')}${missingSkills.length > 5 ? ', ...' : ''}`
      );
    }

    if (detectedRole !== 'general') {
      suggestions.push(
        `JD suggests "${detectedRole}" role. Highlight any ${detectedRole}-specific projects at the top of your resume.`
      );
    }

    // Check if JD mentions specific tools/technologies not in dictionary
    const techPatterns = /\b([A-Z][a-zA-Z]+(?:\.[a-z]+)?)\b/g;
    const techMatches = jd.match(techPatterns) || [];
    const uniqueTech = [...new Set(techMatches)]
      .filter((t) => t.length > 2 && !['The', 'And', 'For', 'You', 'Your', 'Our', 'Are', 'Have'].includes(t))
      .filter((t) => !Array.from(jdSkillsFound).includes(t.toLowerCase()));

    if (uniqueTech.length > 0) {
      suggestions.push(
        `JD mentions specific tools like "${uniqueTech.slice(0, 3).join(', ')}" — consider adding these if you have any experience.`
      );
    }

    if (matchedSkills.length > 5) {
      suggestions.push(
        `Strong alignment! You match ${matchedSkills.length} of ${jdRequiredSkillsArr.length} key skills. Move these to the top of your Skills section for this application.`
      );
    }

    if (matchScore < 50) {
      suggestions.push(
        `Match is below 50%. Consider whether you have related experience that can substitute — e.g., "${missingSkills[0] || 'missing skill'}" might be replaceable with similar technologies you've used.`
      );
    }

    // Tailoring tips
    suggestions.push(
        `Reorder your resume: put the most relevant project + skills for this role at the top. Recruiters scan top-down in 6 seconds.`
      );
    suggestions.push(
      `Use keywords from the JD verbatim in your bullet points. ATS systems parse for exact-match keywords like "${matchedSkills[0] || 'react'}".`
    );

    if (jdLower.includes('b.tech') || jdLower.includes('bachelor') || jdLower.includes('graduate')) {
      suggestions.push(
        `JD targets fresh graduates. Emphasize your education, current year, and CGPA prominently.`
      );
    }

    return NextResponse.json({
      matchScore,
      matchedSkills,
      missingSkills,
      jdSkills: jdRequiredSkillsArr,
      detectedRole,
      suggestions,
    });
  } catch (err: any) {
    console.error('Tailor API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}