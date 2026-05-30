import { db } from '@/lib/db';

export interface BadgeDefinition {
  name: string;
  description: string;
  icon: string; // lucide icon name
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  category: 'debate' | 'empathy' | 'evidence' | 'streak' | 'social';
}

export const ALL_BADGES: BadgeDefinition[] = [
  // Debate badges
  {
    name: 'First Steps',
    description: 'Complete your first debate',
    icon: 'CheckCircle',
    tier: 'bronze',
    category: 'debate',
  },
  {
    name: 'Debater',
    description: 'Complete 3 debates',
    icon: 'MessageSquare',
    tier: 'bronze',
    category: 'debate',
  },
  {
    name: 'Seasoned Debater',
    description: 'Complete 10 debates',
    icon: 'Scale',
    tier: 'silver',
    category: 'debate',
  },
  {
    name: 'Debate Veteran',
    description: 'Complete 25 debates',
    icon: 'Shield',
    tier: 'gold',
    category: 'debate',
  },
  {
    name: 'Debate Legend',
    description: 'Complete 50 debates',
    icon: 'Trophy',
    tier: 'platinum',
    category: 'debate',
  },

  // Empathy badges
  {
    name: 'Empathy Seed',
    description: 'Receive an understanding score of 4+ in a debate',
    icon: 'Lightbulb',
    tier: 'bronze',
    category: 'empathy',
  },
  {
    name: 'Bridge Builder',
    description: '5 debates with understanding score 4+',
    icon: 'Handshake',
    tier: 'silver',
    category: 'empathy',
  },
  {
    name: 'Empathy Master',
    description: '10 debates with understanding score 4+',
    icon: 'Heart',
    tier: 'gold',
    category: 'empathy',
  },
  {
    name: 'Perspective Shifter',
    description: 'Average understanding score of 4.5+ across 10+ debates',
    icon: 'Sparkles',
    tier: 'platinum',
    category: 'empathy',
  },

  // Civility badges
  {
    name: 'Civil Speaker',
    description: 'Receive a civility score of 4+ in a debate',
    icon: 'Award',
    tier: 'bronze',
    category: 'empathy',
  },
  {
    name: 'Civil Discourse Champion',
    description: '10 debates with civility score 4+',
    icon: 'Shield',
    tier: 'gold',
    category: 'empathy',
  },

  // Evidence badges
  {
    name: 'Cite Maker',
    description: 'Use a cited source in your first argument',
    icon: 'BookOpen',
    tier: 'bronze',
    category: 'evidence',
  },
  {
    name: 'Evidence Expert',
    description: 'Use 3+ cited sources across your arguments',
    icon: 'BookOpen',
    tier: 'silver',
    category: 'evidence',
  },
  {
    name: 'Research Scholar',
    description: 'Use 10+ cited sources across your arguments',
    icon: 'GraduationCap',
    tier: 'gold',
    category: 'evidence',
  },

  // Streak badges
  {
    name: 'Hot Streak',
    description: 'Debate 3 days in a row',
    icon: 'Flame',
    tier: 'bronze',
    category: 'streak',
  },
  {
    name: 'On Fire',
    description: 'Debate 7 days in a row',
    icon: 'Flame',
    tier: 'silver',
    category: 'streak',
  },
  {
    name: 'Unstoppable',
    description: 'Debate 14 days in a row',
    icon: 'Flame',
    tier: 'gold',
    category: 'streak',
  },
  {
    name: 'Dedicated',
    description: 'Debate 30 days in a row',
    icon: 'Flame',
    tier: 'platinum',
    category: 'streak',
  },

  // Social badges
  {
    name: 'Topic Explorer',
    description: 'Debate on 3 different topics',
    icon: 'Compass',
    tier: 'bronze',
    category: 'social',
  },
  {
    name: 'Well Rounded',
    description: 'Debate on 7 different topics',
    icon: 'Globe',
    tier: 'silver',
    category: 'social',
  },
  {
    name: 'Paraphrase Pro',
    description: 'Pass AI paraphrase validation on your first try 3 times',
    icon: 'PenTool',
    tier: 'silver',
    category: 'social',
  },

  // New badges
  {
    name: 'Open Mind',
    description: 'Change your stance on a topic after debating it',
    icon: 'RefreshCw',
    tier: 'silver',
    category: 'empathy',
  },
  {
    name: 'Wordsmith',
    description: 'Write a total of 5,000 words across all debates',
    icon: 'PenTool',
    tier: 'silver',
    category: 'debate',
  },
  {
    name: 'Prolific Writer',
    description: 'Write a total of 25,000 words across all debates',
    icon: 'PenTool',
    tier: 'gold',
    category: 'debate',
  },
  {
    name: 'Challenge Champion',
    description: 'Complete 7 daily challenges',
    icon: 'Target',
    tier: 'silver',
    category: 'social',
  },
  {
    name: 'Consistency King',
    description: 'Maintain a 7-day streak',
    icon: 'Crown',
    tier: 'gold',
    category: 'streak',
  },
  {
    name: 'First Paraphrase',
    description: 'Successfully paraphrase an argument for the first time',
    icon: 'CheckCircle',
    tier: 'bronze',
    category: 'empathy',
  },
  {
    name: 'Active Listener',
    description: 'Pass paraphrase validation 5 times',
    icon: 'Ear',
    tier: 'silver',
    category: 'empathy',
  },
];

// ─── XP / Level System ────────────────────────────────────────────────────

export const XP_PER_LEVEL = 100; // XP needed per level
export const XP_REWARDS = {
  DEBATE_COMPLETE: 50,
  STREAK_BONUS: 10,      // per streak day
  SURVEY_HIGH_SCORE: 20, // understanding or civility >= 4
  PARAPHRASE_PASS: 15,   // first-try paraphrase validation
  BADGE_EARNED: 25,      // bonus XP when earning a badge
  DAILY_CHALLENGE: 15,   // daily challenge completion
};

export function getLevelFromXP(totalXP: number): { level: number; currentLevelXP: number; xpToNextLevel: number; progress: number } {
  const level = Math.floor(totalXP / XP_PER_LEVEL) + 1;
  const currentLevelXP = totalXP % XP_PER_LEVEL;
  const xpToNextLevel = XP_PER_LEVEL - currentLevelXP;
  const progress = (currentLevelXP / XP_PER_LEVEL) * 100;
  return { level, currentLevelXP, xpToNextLevel, progress };
}

export function getLevelTitle(level: number): string {
  if (level >= 20) return 'Legendary Orator';
  if (level >= 15) return 'Master Diplomat';
  if (level >= 10) return 'Skilled Negotiator';
  if (level >= 7) return 'Seasoned Debater';
  if (level >= 5) return 'Active Conversationalist';
  if (level >= 3) return 'Eager Learner';
  return 'Newcomer';
}

export function getLevelColor(level: number): string {
  if (level >= 20) return 'text-purple-700';
  if (level >= 15) return 'text-amber-700';
  if (level >= 10) return 'text-emerald-700';
  if (level >= 5) return 'text-blue-700';
  return 'text-slate-700';
}

// ─── Badge Checking ───────────────────────────────────────────────────────

export async function checkAndAwardBadges(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      surveys: true,
      messages: true,
      conversationsA: { include: { surveys: true, topic: true } },
      conversationsB: { include: { surveys: true, topic: true } },
    },
  });
  if (!user) return [];

  const currentBadges: string[] = JSON.parse(user.badges);
  const newBadges: string[] = [];

  const allConversations = [...user.conversationsA, ...user.conversationsB];
  const completedDebates = allConversations.filter(c => c.status === 'completed');
  const debateCount = completedDebates.length;

  // ── Debate badges ──
  if (debateCount >= 1 && !currentBadges.includes('First Steps')) {
    newBadges.push('First Steps');
  }
  if (debateCount >= 3 && !currentBadges.includes('Debater')) {
    newBadges.push('Debater');
  }
  if (debateCount >= 10 && !currentBadges.includes('Seasoned Debater')) {
    newBadges.push('Seasoned Debater');
  }
  if (debateCount >= 25 && !currentBadges.includes('Debate Veteran')) {
    newBadges.push('Debate Veteran');
  }
  if (debateCount >= 50 && !currentBadges.includes('Debate Legend')) {
    newBadges.push('Debate Legend');
  }

  // ── Empathy badges ──
  const highUnderstandingDebates = completedDebates.filter(c =>
    c.surveys.some(s => s.understandingScore >= 4)
  );
  if (highUnderstandingDebates.length >= 1 && !currentBadges.includes('Empathy Seed')) {
    newBadges.push('Empathy Seed');
  }
  if (highUnderstandingDebates.length >= 5 && !currentBadges.includes('Bridge Builder')) {
    newBadges.push('Bridge Builder');
  }
  if (highUnderstandingDebates.length >= 10 && !currentBadges.includes('Empathy Master')) {
    newBadges.push('Empathy Master');
  }

  // Average understanding 4.5+ across 10+ debates
  const avgUnderstanding = user.surveys.length > 0
    ? user.surveys.reduce((sum, s) => sum + s.understandingScore, 0) / user.surveys.length
    : 0;
  if (debateCount >= 10 && avgUnderstanding >= 4.5 && !currentBadges.includes('Perspective Shifter')) {
    newBadges.push('Perspective Shifter');
  }

  // ── Civility badges ──
  const highCivilityDebates = completedDebates.filter(c =>
    c.surveys.some(s => s.civilityScore >= 4)
  );
  if (highCivilityDebates.length >= 1 && !currentBadges.includes('Civil Speaker')) {
    newBadges.push('Civil Speaker');
  }
  if (highCivilityDebates.length >= 10 && !currentBadges.includes('Civil Discourse Champion')) {
    newBadges.push('Civil Discourse Champion');
  }

  // ── Evidence badges ──
  const evidenceMessages = user.messages.filter(m =>
    m.messageType === 'argument' || m.messageType === 'counter_argument' || m.messageType === 'response'
  ).filter(m =>
    m.content.toLowerCase().includes('http') ||
    m.content.toLowerCase().includes('study') ||
    m.content.toLowerCase().includes('source') ||
    m.content.toLowerCase().includes('according to')
  );
  if (evidenceMessages.length >= 1 && !currentBadges.includes('Cite Maker')) {
    newBadges.push('Cite Maker');
  }
  if (evidenceMessages.length >= 3 && !currentBadges.includes('Evidence Expert')) {
    newBadges.push('Evidence Expert');
  }
  if (evidenceMessages.length >= 10 && !currentBadges.includes('Research Scholar')) {
    newBadges.push('Research Scholar');
  }

  // ── Streak badges ──
  if (user.streak >= 3 && !currentBadges.includes('Hot Streak')) {
    newBadges.push('Hot Streak');
  }
  if (user.streak >= 7 && !currentBadges.includes('On Fire')) {
    newBadges.push('On Fire');
  }
  if (user.streak >= 14 && !currentBadges.includes('Unstoppable')) {
    newBadges.push('Unstoppable');
  }
  if (user.streak >= 30 && !currentBadges.includes('Dedicated')) {
    newBadges.push('Dedicated');
  }

  // ── Social badges ──
  const uniqueTopics = new Set(allConversations.map(c => c.topicId));
  if (uniqueTopics.size >= 3 && !currentBadges.includes('Topic Explorer')) {
    newBadges.push('Topic Explorer');
  }
  if (uniqueTopics.size >= 7 && !currentBadges.includes('Well Rounded')) {
    newBadges.push('Well Rounded');
  }

  // Paraphrase Pro: passed AI validation first-try 3 times
  // We approximate this by counting paraphrase messages that were submitted successfully
  const paraphraseMessages = user.messages.filter(m => m.messageType === 'paraphrase');
  if (paraphraseMessages.length >= 3 && !currentBadges.includes('Paraphrase Pro')) {
    newBadges.push('Paraphrase Pro');
  }

  // ── Award badges and create notifications ──
  if (newBadges.length > 0) {
    const updatedBadges = [...currentBadges, ...newBadges];
    await db.user.update({
      where: { id: userId },
      data: {
        badges: JSON.stringify(updatedBadges),
        points: { increment: XP_REWARDS.BADGE_EARNED * newBadges.length },
      },
    });
    for (const badge of newBadges) {
      await db.notification.create({
        data: {
          userId,
          type: 'badge_earned',
          content: `You earned the "${badge}" badge! +${XP_REWARDS.BADGE_EARNED} XP`,
        },
      });
    }
  }

  return newBadges;
}

// ─── Daily Challenge XP Award ──────────────────────────────────────────────

export async function awardDailyChallengeXP(userId: string): Promise<number> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return 0;

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Check if user already completed today's challenge
  if (user.lastChallengeDate === today && user.lastChallengeCompleted) {
    return 0;
  }

  // Award XP and mark as completed
  const xpAwarded = XP_REWARDS.DAILY_CHALLENGE;
  await db.user.update({
    where: { id: userId },
    data: {
      points: { increment: xpAwarded },
      lastChallengeDate: today,
      lastChallengeCompleted: true,
    },
  });

  // Create notification
  await db.notification.create({
    data: {
      userId,
      type: 'points_earned',
      content: `You completed today's daily challenge! +${xpAwarded} XP`,
    },
  });

  return xpAwarded;
}
