/**
 * Real persistent storage using Prisma.
 * For production: switch DATABASE_URL to PostgreSQL — same interface.
 */

import { PrismaClient } from '@prisma/client';
import type { User, ResumeAnalysis, InterviewFeedback } from './types';

const globalAny = globalThis as any;

export const prisma =
  globalAny.__campusos_prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalAny.__campusos_prisma = prisma;
}

function userFromRecord(u: any): User {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    college: u.college ?? undefined,
    branch: u.branch ?? undefined,
    year: u.year ?? undefined,
    skills: u.skills ? safeParseJSON(u.skills, []) : [],
    targetRole: u.targetRole ?? undefined,
    bio: u.bio ?? undefined,
    avatar: u.avatar ?? undefined,
    isPro: u.isPro ?? false,
    proExpiresAt: u.proExpiresAt ? u.proExpiresAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
  };
}

function safeParseJSON<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function feedbackFromJson(json: string): ResumeAnalysis | InterviewFeedback {
  return safeParseJSON(json, {} as any);
}

export const storage = {
  // ---- USERS ----
  createUser: async (data: {
    email: string;
    name: string;
    password: string;
    college?: string;
    branch?: string;
    year?: string;
    skills?: string[];
    targetRole?: string;
  }): Promise<User> => {
    const created = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash: data.password,
        college: data.college,
        branch: data.branch,
        year: data.year,
        skills: JSON.stringify(data.skills || []),
        targetRole: data.targetRole,
      },
    });
    return userFromRecord(created);
  },

  getUser: async (userId: string): Promise<User | null> => {
    const u = await prisma.user.findUnique({ where: { id: userId } });
    return u ? userFromRecord(u) : null;
  },

  getUserByEmail: async (email: string): Promise<User | null> => {
    const u = await prisma.user.findUnique({ where: { email } });
    return u ? userFromRecord(u) : null;
  },

  getPassword: async (userId: string): Promise<string | null> => {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
    return u?.passwordHash ?? null;
  },

  updateUser: async (
    userId: string,
    updates: {
      name?: string;
      college?: string;
      branch?: string;
      year?: string;
      skills?: string[];
      targetRole?: string;
      bio?: string;
      avatar?: string;
      isPro?: boolean;
      proExpiresAt?: Date;
    }
  ): Promise<User | null> => {
    const data: any = {};
    if (updates.name !== undefined) data.name = updates.name;
    if (updates.college !== undefined) data.college = updates.college;
    if (updates.branch !== undefined) data.branch = updates.branch;
    if (updates.year !== undefined) data.year = updates.year;
    if (updates.targetRole !== undefined) data.targetRole = updates.targetRole;
    if (updates.bio !== undefined) data.bio = updates.bio;
    if (updates.avatar !== undefined) data.avatar = updates.avatar;
    if (updates.skills !== undefined) data.skills = JSON.stringify(updates.skills);
    if (updates.isPro !== undefined) data.isPro = updates.isPro;
    if (updates.proExpiresAt !== undefined) data.proExpiresAt = updates.proExpiresAt;

    const u = await prisma.user.update({ where: { id: userId }, data });
    return u ? userFromRecord(u) : null;
  },

  getAllUsers: async (): Promise<User[]> => {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    return users.map(userFromRecord);
  },

  // ---- RESUMES ----
  saveResumeScore: async (params: {
    userId: string;
    score: number;
    atsScore: number;
    feedback: ResumeAnalysis;
  }) => {
    const created = await prisma.resume.create({
      data: {
        userId: params.userId,
        score: params.score,
        atsScore: params.atsScore,
        feedbackJson: JSON.stringify(params.feedback),
      },
    });
    await prisma.user.update({
      where: { id: params.userId },
      data: { resumesAnalyzed: { increment: 1 } },
    });
    return {
      userId: created.userId,
      score: created.score,
      atsScore: created.atsScore,
      analyzedAt: created.createdAt.toISOString(),
      feedback: feedbackFromJson(created.feedbackJson) as ResumeAnalysis,
    };
  },

  getLatestResume: async (userId: string) => {
    const r = await prisma.resume.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
    if (!r) return null;
    return {
      userId: r.userId,
      score: r.score,
      atsScore: r.atsScore,
      analyzedAt: r.createdAt.toISOString(),
      feedback: feedbackFromJson(r.feedbackJson) as ResumeAnalysis,
    };
  },

  getResumeHistory: async (userId: string) => {
    const rows = await prisma.resume.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
    return rows.map((r: any) => ({
      userId: r.userId,
      score: r.score,
      atsScore: r.atsScore,
      analyzedAt: r.createdAt.toISOString(),
      feedback: feedbackFromJson(r.feedbackJson) as ResumeAnalysis,
    }));
  },

  // ---- INTERVIEWS ----
  saveInterview: async (params: {
    userId: string;
    role: string;
    question: string;
    answer: string;
    score: number;
    feedback: InterviewFeedback;
    isVoice?: boolean;
  }) => {
    const created = await prisma.interview.create({
      data: {
        userId: params.userId,
        role: params.role,
        question: params.question,
        answer: params.answer,
        score: params.score,
        feedbackJson: JSON.stringify(params.feedback),
        isVoice: params.isVoice ?? false,
      },
    });
    await prisma.user.update({
      where: { id: params.userId },
      data: { interviewsTaken: { increment: 1 } },
    });
    return {
      id: created.id,
      userId: created.userId,
      role: created.role,
      question: created.question,
      answer: created.answer,
      feedback: feedbackFromJson(created.feedbackJson) as InterviewFeedback,
      isVoice: created.isVoice,
      createdAt: created.createdAt.toISOString(),
    };
  },

  getInterviews: async (userId: string) => {
    const rows = await prisma.interview.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
    return rows.map((r: any) => ({
      id: r.id,
      userId: r.userId,
      role: r.role,
      question: r.question,
      answer: r.answer,
      feedback: feedbackFromJson(r.feedbackJson) as InterviewFeedback,
      isVoice: r.isVoice,
      createdAt: r.createdAt.toISOString(),
    }));
  },

  // ---- METRICS ----
  getMetrics: async (userId: string) => {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { resumesAnalyzed: true, interviewsTaken: true, jobsApplied: true },
    });
    return {
      resumesAnalyzed: u?.resumesAnalyzed ?? 0,
      interviewsTaken: u?.interviewsTaken ?? 0,
      jobsApplied: u?.jobsApplied ?? 0,
      eventsViewed: 0,
    };
  },

  incrementMetric: async (userId: string, metric: 'jobsApplied'): Promise<void> => {
    if (metric === 'jobsApplied') {
      await prisma.user.update({
        where: { id: userId },
        data: { jobsApplied: { increment: 1 } },
      });
    }
  },

  // ---- SAVED JOBS ----
  saveJob: async (userId: string, jobId: string) => {
    await prisma.savedJob.upsert({
      where: { userId_jobId: { userId, jobId } },
      update: {},
      create: { userId, jobId },
    });
    const all = await prisma.savedJob.findMany({
      where: { userId },
      select: { jobId: true },
      orderBy: { createdAt: 'desc' },
    });
    return { saved: all.map((r: any) => r.jobId) };
  },

  unsaveJob: async (userId: string, jobId: string) => {
    await prisma.savedJob.deleteMany({ where: { userId, jobId } });
    const all = await prisma.savedJob.findMany({
      where: { userId },
      select: { jobId: true },
      orderBy: { createdAt: 'desc' },
    });
    return { saved: all.map((r: any) => r.jobId) };
  },

  getSavedJobs: async (userId: string): Promise<string[]> => {
    const rows = await prisma.savedJob.findMany({ where: { userId }, select: { jobId: true } });
    return rows.map((r: any) => r.jobId);
  },

  applyToJob: async (userId: string, jobId: string) => {
    const existing = await prisma.jobApplication.findUnique({
      where: { userId_jobId: { userId, jobId } },
    });
    if (existing) return { applied: false };
    await prisma.jobApplication.create({ data: { userId, jobId } });
    await prisma.user.update({
      where: { id: userId },
      data: { jobsApplied: { increment: 1 } },
    });
    return { applied: true };
  },

  getApplications: async (userId: string) => {
    const rows = await prisma.jobApplication.findMany({
      where: { userId },
      orderBy: { appliedAt: 'desc' },
    });
    return rows.map((r: any) => ({ jobId: r.jobId, appliedAt: r.appliedAt.toISOString() }));
  },

  // ---- ADMIN ----
  getAllMetrics: async () => {
    const [users, resumes, interviews] = await Promise.all([
      prisma.user.count(),
      prisma.resume.count(),
      prisma.interview.count(),
    ]);
    return { totalUsers: users, resumesAnalyzed: resumes, interviewsTaken: interviews };
  },

  // ---- MENTOR BOOKINGS ----
  createMentorBooking: async (params: {
    userId: string;
    mentorId: string;
    scheduledAt: Date;
    topic: string;
    notes?: string;
  }) => {
    return prisma.mentorBooking.create({ data: params });
  },

  getUserMentorBookings: async (userId: string) => {
    return prisma.mentorBooking.findMany({
      where: { userId },
      orderBy: { scheduledAt: 'asc' },
    });
  },

  // ---- HACKATHON TEAMS ----
  createHackathonTeam: async (params: {
    hackathonId: string;
    hackathonName: string;
    leaderId: string;
    leaderName: string;
    leaderSkills: string[];
    description: string;
    lookingFor: string[];
    maxSize?: number;
  }) => {
    return prisma.hackathonTeam.create({
      data: {
        hackathonId: params.hackathonId,
        hackathonName: params.hackathonName,
        leaderId: params.leaderId,
        leaderName: params.leaderName,
        leaderSkills: JSON.stringify(params.leaderSkills),
        description: params.description,
        lookingFor: JSON.stringify(params.lookingFor),
        maxSize: params.maxSize ?? 4,
      },
    });
  },

  getTeamsForHackathon: async (hackathonId: string) => {
    const rows = await prisma.hackathonTeam.findMany({
      where: { hackathonId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r: any) => ({
      id: r.id,
      hackathonId: r.hackathonId,
      hackathonName: r.hackathonName,
      leaderName: r.leaderName,
      leaderSkills: safeParseJSON(r.leaderSkills, []),
      description: r.description,
      lookingFor: safeParseJSON(r.lookingFor, []),
      memberCount: r.memberCount,
      maxSize: r.maxSize,
      createdAt: r.createdAt.toISOString(),
    }));
  },

  // ---- PORTFOLIO ----
  upsertPortfolio: async (userId: string, dataJson: string) => {
    return prisma.portfolio.upsert({
      where: { userId },
      update: { dataJson },
      create: { userId, dataJson },
    });
  },

  getPortfolio: async (userId: string) => {
    const p = await prisma.portfolio.findUnique({ where: { userId } });
    if (!p) return null;
    return {
      id: p.id,
      userId: p.userId,
      data: safeParseJSON(p.dataJson, {}),
      published: p.published,
      slug: p.slug,
      views: p.views,
      updatedAt: p.updatedAt.toISOString(),
    };
  },

  // ---- CHAT (NEW v1.1) ----
  sendChatMessage: async (studentId: string, mentorId: string, sender: 'student' | 'mentor', message: string) => {
    const msg = await prisma.chatMessage.create({
      data: { studentId, mentorId, sender, message },
    });
    // Notify the other side
    if (sender === 'student') {
      await prisma.notification.create({
        data: {
          userId: studentId,
          type: 'mentor_message',
          title: 'Message sent',
          body: 'Your message was delivered to the mentor.',
          link: `/dashboard/mentors?chat=${mentorId}`,
        },
      });
    }
    return msg;
  },

  getChatMessages: async (studentId: string, mentorId: string, since?: Date) => {
    const where: any = { studentId, mentorId };
    if (since) where.createdAt = { gt: since };
    const rows = await prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r: any) => ({
      id: r.id,
      studentId: r.studentId,
      mentorId: r.mentorId,
      sender: r.sender,
      message: r.message,
      createdAt: r.createdAt.toISOString(),
    }));
  },

  // Auto-reply from mentor (since we don't have real mentor accounts, mentor sends simulated replies)
  addMentorReply: async (studentId: string, mentorId: string, message: string) => {
    return prisma.chatMessage.create({
      data: { studentId, mentorId, sender: 'mentor', message },
    });
  },

  // ---- NOTIFICATIONS (NEW v1.1) ----
  createNotification: async (params: {
    userId: string;
    type: 'mentor_message' | 'job_match' | 'payment' | 'system';
    title: string;
    body: string;
    link?: string;
  }) => {
    return prisma.notification.create({ data: params });
  },

  getUserNotifications: async (userId: string, limit = 20) => {
    const rows = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((r: any) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      body: r.body,
      link: r.link,
      read: r.read,
      createdAt: r.createdAt.toISOString(),
    }));
  },

  markNotificationsRead: async (userId: string) => {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  },

  getUnreadCount: async (userId: string) => {
    return prisma.notification.count({
      where: { userId, read: false },
    });
  },

  // ---- PAYMENTS (NEW v1.1) ----
  createPayment: async (params: {
    userId: string;
    razorpayOrderId: string;
    amount: number;
    plan: string;
  }) => {
    return prisma.payment.create({
      data: {
        userId: params.userId,
        razorpayOrderId: params.razorpayOrderId,
        amount: params.amount,
        plan: params.plan,
        status: 'created',
      },
    });
  },

  updatePaymentStatus: async (
    razorpayOrderId: string,
    status: 'paid' | 'failed' | 'refunded',
    razorpayPaymentId?: string
  ) => {
    return prisma.payment.update({
      where: { razorpayOrderId },
      data: {
        status,
        razorpayPaymentId,
        paidAt: status === 'paid' ? new Date() : null,
      },
    });
  },

  getPayment: async (orderId: string) => {
    return prisma.payment.findUnique({ where: { razorpayOrderId: orderId } });
  },

  grantProAccess: async (userId: string, months = 1) => {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { proExpiresAt: true },
    });
    const baseDate = currentUser?.proExpiresAt && currentUser.proExpiresAt > new Date()
      ? currentUser.proExpiresAt
      : new Date();
    const newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + months);
    return prisma.user.update({
      where: { id: userId },
      data: { isPro: true, proExpiresAt: newExpiry },
    });
  },
};
