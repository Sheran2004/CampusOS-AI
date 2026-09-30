/**
 * Shared types for CampusOS AI
 */

export interface ResumeAnalysis {
  score: number;
  atsScore: number;
  strengths: string[];
  weaknesses: string[];
  missingSections: string[];
  suggestions: string[];
  extractedSkills: string[];
  experienceYears: number;
  educationLevel: 'BTech' | 'MTech' | 'MCA' | 'BCA' | 'Diploma' | 'Other';
  recommendedRoles: string[];
  provider: string;
  analyzedAt: string;
}

export interface SkillGapAnalysis {
  matchPercentage: number;
  missingRequired: string[];
  missingPreferred: string[];
  strengths: string[];
  roadmap: Array<{
    skill: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    weeks: number;
    resources: string[];
  }>;
  summary: string;
  provider: string;
  analyzedAt: string;
}

export interface InterviewFeedback {
  score: number;
  contentScore: number;
  clarityScore: number;
  confidenceScore: number;
  feedback: string;
  improvements: string[];
  sampleAnswer: string;
  keyPointsCovered: string[];
  keyPointsMissed: string[];
  provider: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  college?: string;
  branch?: string;
  year?: string;
  skills: string[];
  targetRole?: string;
  bio?: string;
  avatar?: string;
  isPro?: boolean;
  proExpiresAt?: string | null;
  createdAt: string;
}

export interface ResumeScore {
  userId: string;
  score: number;
  atsScore: number;
  analyzedAt: string;
  feedback: ResumeAnalysis;
}

export interface InterviewSession {
  id: string;
  userId: string;
  role: string;
  question: string;
  answer: string;
  feedback: InterviewFeedback;
  createdAt: string;
}

export interface JobListing {
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

export interface JobMatchResult {
  job: JobListing;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  reasoning: string;
}
