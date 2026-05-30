'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  MessageSquare,
  Users,
  Trophy,
  User,
  Bell,
  LogOut,
  ArrowLeft,
  Send,
  Sparkles,
  ExternalLink,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Search,
  Star,
  Flame,
  Award,
  Shield,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Loader2,
  Handshake,
  Scale,
  Heart,
  Target,
  Zap,
  TrendingUp,
  Crown,
  Globe,
  Compass,
  PenTool,
  GraduationCap,
  Rocket,
  RefreshCw,
  Calendar,
  Gift,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type View = 'landing' | 'onboarding' | 'dashboard' | 'debate' | 'survey' | 'archive' | 'leaderboard' | 'profile';

interface Topic {
  id: string;
  name: string;
  question: string;
  optionA: string;
  optionB: string;
  sourceUrl1: string;
  sourceUrl2?: string;
  active: boolean;
  userStance?: string | null;
}

interface Conversation {
  id: string;
  topicId: string;
  topic: { id: string; name: string; question: string; optionA: string; optionB: string; sourceUrl1: string; sourceUrl2?: string };
  status: string;
  currentStep: number;
  understandingScore?: number | null;
  civilityScore?: number | null;
  isUserA: boolean;
  otherUser: { id: string; username: string } | null;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  senderId: string;
  messageType: string;
  content: string;
  step: number;
  createdAt: string;
}

interface Notification {
  id: string;
  type: string;
  content: string;
  read: boolean;
  createdAt: string;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  points: number;
  badges: string[];
  streak: number;
  debateCount: number;
  averageUnderstandingScore: number;
  averageCivilityScore: number;
  level: number;
  levelTitle: string;
  currentLevelXP: number;
  xpToNextLevel: number;
  xpProgress: number;
  totalXP: number;
  badgesCount: number;
  totalBadges: number;
  badgeDetails: { name: string; description: string; icon: string; tier: 'bronze' | 'silver' | 'gold' | 'platinum'; category: string; earned: boolean }[];
  topicsExplored: number;
  evidenceUsed: number;
  totalWordsWritten: number;
  highUnderstandingDebates: number;
  highCivilityDebates: number;
  stancesCount: number;
  recentDebates: { id: string; topicName: string; topicQuestion: string; understandingScore: number | null; civilityScore: number | null; completedAt: string; isUserA: boolean }[];
  longestStreak: number;
  createdAt?: string;
}

interface LeaderboardUser {
  id: string;
  username: string;
  points: number;
  badgesCount: number;
  streak: number;
  level: number;
  levelTitle: string;
  debateCount: number;
}

interface DailyChallenge {
  challenge: { title: string; description: string; xpReward: number; icon: string };
  completed: boolean;
  completedToday: boolean;
}

interface XPPopup {
  id: string;
  amount: number;
  reason: string;
  timestamp: number;
}

interface ArchiveConversation {
  id: string;
  topic: { name: string; question: string; optionA: string; optionB: string; sourceUrl1: string; sourceUrl2?: string };
  personA: { username: string; stance: string | null };
  personB: { username: string; stance: string | null };
  understandingScore: number | null;
  civilityScore: number | null;
  messages: { step: number; messageType: string; content: string; sender: string; createdAt: string }[];
  keyEvidence: { step: number; messageType: string; content: string }[];
  createdAt: string;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function getStepLabel(step: number): string {
  const labels: Record<number, string> = {
    1: 'Opening Argument',
    2: 'Paraphrase',
    3: 'Counter-Argument',
    4: 'Response',
    5: 'Final Summary',
  };
  return labels[step] || `Step ${step}`;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'waiting':
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Waiting for Match</Badge>;
    case 'matched':
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Matched</Badge>;
    case 'step2_paraphrase':
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Paraphrase</Badge>;
    case 'step3':
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Counter-Argument</Badge>;
    case 'step4':
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Responding</Badge>;
    case 'step5':
      return <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">Final Summary</Badge>;
    case 'completed':
      return <Badge className="bg-emerald-500 text-white">Completed</Badge>;
    default:
      // step2_validate is obsolete but handle gracefully
      if (status?.startsWith('step')) {
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">In Progress</Badge>;
      }
      return <Badge variant="outline">{status}</Badge>;
  }
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function Home() {
  const { toast } = useToast();

  // Core state
  const [view, setView] = useState<View>('landing');
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Data state
  const [topics, setTopics] = useState<Topic[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [archiveConversations, setArchiveConversations] = useState<ArchiveConversation[]>([]);
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Auth form
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Onboarding state
  const [onboardingStances, setOnboardingStances] = useState<Record<string, string>>({});

  // Debate state
  const [debateInput, setDebateInput] = useState('');
  const [paraphraseFeedback, setParaphraseFeedback] = useState<string | null>(null);
  const [paraphraseValid, setParaphraseValid] = useState<boolean | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [submittingMessage, setSubmittingMessage] = useState(false);
  const [validatingParaphrase, setValidatingParaphrase] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittingStepRef = useRef<number | null>(null); // Track which step is being submitted

  // Survey state
  const [understandingScore, setUnderstandingScore] = useState(0);
  const [civilityScore, setCivilityScore] = useState(0);
  const [learnedText, setLearnedText] = useState('');

  // UI state
  const [showNotifications, setShowNotifications] = useState(false);
  const [archiveSearch, setArchiveSearch] = useState('');
  const [expandedArchive, setExpandedArchive] = useState<string | null>(null);

  // Stance selection dialog state
  const [selectingStanceTopic, setSelectingStanceTopic] = useState<Topic | null>(null);
  const [stanceDialogValue, setStanceDialogValue] = useState<string>('');
  const [savingStance, setSavingStance] = useState(false);

  // Gamification state
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [xpPopups, setXPPopups] = useState<XPPopup[]>([]);
  const [badgeCelebration, setBadgeCelebration] = useState<string | null>(null);

  // ─── Session Helpers ────────────────────────────────────────────────────

  const saveSession = useCallback((userId: string) => {
    try { localStorage.setItem('storyswap_session', userId); } catch { /* ignore */ }
  }, []);

  const clearSession = useCallback(() => {
    try { localStorage.removeItem('storyswap_session'); } catch { /* ignore */ }
  }, []);

  const getSessionId = useCallback((): string | null => {
    try { return localStorage.getItem('storyswap_session'); } catch { return null; }
  }, []);

  // ─── API Helpers ────────────────────────────────────────────────────────

  const buildHeaders = useCallback((extra?: Record<string, string>) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const sid = getSessionId();
    if (sid) headers['x-session-user-id'] = sid;
    return { ...headers, ...extra };
  }, [getSessionId]);

  const apiCall = useCallback(async (url: string, options?: RequestInit) => {
    const res = await fetch(url, {
      credentials: 'include',
      headers: buildHeaders(),
      ...options,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Something went wrong');
    }
    return data;
  }, [buildHeaders]);

  // Silent API call - never shows toast (for background data loading)
  const apiCallSilent = useCallback(async (url: string, options?: RequestInit) => {
    try {
      const res = await fetch(url, {
        credentials: 'include',
        headers: buildHeaders(),
        ...options,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      return data;
    } catch {
      return null;
    }
  }, [buildHeaders]);

  // Show error toast helper
  const showError = useCallback((message: string) => {
    toast({ title: 'Error', description: message, variant: 'destructive' });
  }, [toast]);

  // ─── Data Fetching ─────────────────────────────────────────────────────

  const fetchTopics = useCallback(async () => {
    const data = await apiCallSilent('/api/topics');
    if (data) setTopics(data.topics || []);
  }, [apiCallSilent]);

  const fetchConversations = useCallback(async () => {
    const data = await apiCallSilent('/api/conversations');
    if (data) setConversations(data.conversations || []);
  }, [apiCallSilent]);

  const fetchNotifications = useCallback(async () => {
    const data = await apiCallSilent('/api/notifications');
    if (data) setNotifications(data.notifications || []);
  }, [apiCallSilent]);

  const fetchProfile = useCallback(async () => {
    const data = await apiCallSilent('/api/gamification/profile');
    if (data) setUserProfile(data.profile || null);
  }, [apiCallSilent]);

  const fetchDailyChallenge = useCallback(async () => {
    const data = await apiCallSilent('/api/gamification/daily-challenge');
    if (data) setDailyChallenge(data as DailyChallenge);
  }, [apiCallSilent]);

  const fetchLeaderboard = useCallback(async () => {
    const data = await apiCallSilent('/api/gamification/leaderboard');
    if (data) setLeaderboardUsers(data.leaderboard || []);
  }, [apiCallSilent]);

  const fetchArchive = useCallback(async () => {
    const data = await apiCallSilent('/api/archive');
    if (data) setArchiveConversations(data.conversations || []);
  }, [apiCallSilent]);

  const fetchConversationById = useCallback(async (id: string) => {
    const data = await apiCallSilent(`/api/conversations/${id}`);
    if (data) setCurrentConversation(data.conversation || null);
  }, [apiCallSilent]);

  // ─── Load Dashboard Data ──────────────────────────────────────────────

  const loadDashboardData = useCallback(async () => {
    await Promise.all([
      fetchTopics(),
      fetchConversations(),
      fetchNotifications(),
      fetchProfile(),
      fetchDailyChallenge(),
    ]);
  }, [fetchTopics, fetchConversations, fetchNotifications, fetchProfile, fetchDailyChallenge]);

  // ─── Auth ──────────────────────────────────────────────────────────────

  const handleSignup = async () => {
    if (!username || !email || !password || !confirmPassword) {
      showError('All fields are required');
      return;
    }
    if (password !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const data = await apiCall('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      });
      setUser(data.user);
      saveSession(data.user.id);
      if (!data.user.onboardingDone) {
        await fetchTopics();
        setView('onboarding');
      } else {
        setView('dashboard');
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showError('Email and password are required');
      return;
    }
    setLoading(true);
    try {
      const data = await apiCall('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setUser(data.user);
      saveSession(data.user.id);
      if (!data.user.onboardingDone) {
        await fetchTopics();
        setView('onboarding');
      } else {
        setView('dashboard');
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiCallSilent('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    clearSession();
    setUser(null);
    setView('landing');
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  // ─── Onboarding ────────────────────────────────────────────────────────

  const handleOnboardingSubmit = async () => {
    const stanceEntries = Object.entries(onboardingStances);
    if (stanceEntries.length < 3) {
      showError('Please select a stance on all 3 topics');
      return;
    }
    setLoading(true);
    try {
      await apiCall('/api/topics/stances', {
        method: 'POST',
        body: JSON.stringify({
          stances: stanceEntries.map(([topicId, stanceSelected]) => ({ topicId, stanceSelected })),
        }),
      });
      toast({ title: 'Welcome!', description: 'Your perspectives have been saved. Let\'s start debating!' });
      setView('dashboard');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save stances');
    } finally {
      setLoading(false);
    }
  };

  // ─── Conversation Actions ──────────────────────────────────────────────

  const startConversation = async (topicId: string) => {
    setLoading(true);
    try {
      const data = await apiCall('/api/conversations/start', {
        method: 'POST',
        body: JSON.stringify({ topicId }),
      });
      if (data?.conversation) {
        // Use the full conversation data returned directly (no need to re-fetch)
        setCurrentConversation(data.conversation as Conversation);
        await fetchConversations();
        setView('debate');
        setDebateInput('');
        setValidatingParaphrase(false);
        setParaphraseFeedback(null);
        setParaphraseValid(null);
        setAiSuggestions([]);
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to start conversation');
    } finally {
      setLoading(false);
    }
  };

  // Handle stance selection from dashboard dialog
  const handleStanceSelectAndStart = async () => {
    if (!selectingStanceTopic || !stanceDialogValue) return;
    setSavingStance(true);
    try {
      // Save the stance first
      await apiCall('/api/topics/stances', {
        method: 'POST',
        body: JSON.stringify({
          stances: [{ topicId: selectingStanceTopic.id, stanceSelected: stanceDialogValue }],
        }),
      });
      // Update local topics state
      setTopics(prev => prev.map(t =>
        t.id === selectingStanceTopic.id ? { ...t, userStance: stanceDialogValue } : t
      ));
      // Close dialog
      setSelectingStanceTopic(null);
      setStanceDialogValue('');
      // Now start the conversation
      await startConversation(selectingStanceTopic.id);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save stance');
    } finally {
      setSavingStance(false);
    }
  };

  // Handle clicking a topic card on the dashboard
  const handleTopicClick = (topic: Topic) => {
    const activeConv = conversations.find(c => c.topicId === topic.id && c.status !== 'completed');
    if (activeConv) {
      openConversation(activeConv.id);
    } else if (!topic.userStance) {
      // No stance selected yet - show stance selection dialog
      setSelectingStanceTopic(topic);
      setStanceDialogValue('');
    } else {
      startConversation(topic.id);
    }
  };

  const openConversation = async (conversationId: string) => {
    setLoading(true);
    try {
      await fetchConversationById(conversationId);
      setView('debate');
      setDebateInput('');
      setValidatingParaphrase(false);
      setParaphraseFeedback(null);
      setParaphraseValid(null);
      setAiSuggestions([]);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to open conversation');
    } finally {
      setLoading(false);
    }
  };

  // ─── Debate Message Submission ─────────────────────────────────────────

  const submitMessage = async (messageType: string, content: string, step: number) => {
    if (!currentConversation) return;
    setSubmittingMessage(true);
    submittingStepRef.current = step;
    try {
      await apiCall(`/api/conversations/${currentConversation.id}/message`, {
        method: 'POST',
        body: JSON.stringify({ messageType, content, step }),
      });
      await fetchConversationById(currentConversation.id);
      await fetchConversations();
      setDebateInput('');
      // Clear all validation state after successful submission
      setValidatingParaphrase(false);
      setParaphraseFeedback(null);
      setParaphraseValid(null);
      submittingStepRef.current = null;
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to send message');
      submittingStepRef.current = null;
    } finally {
      setSubmittingMessage(false);
    }
  };

  const validateParaphrase = async (originalArgument: string, paraphrase: string): Promise<boolean> => {
    // Safety: Only User B at step 2 should ever call this
    if (!currentConversation || currentConversation.isUserA) return false;
    
    setValidatingParaphrase(true);
    try {
      const data = await apiCall('/api/ai/validate-paraphrase', {
        method: 'POST',
        body: JSON.stringify({ originalArgument, paraphrase }),
      });
      setParaphraseValid(data.valid);
      setParaphraseFeedback(data.feedback);
      return data.valid;
    } catch {
      // On AI error, allow the paraphrase through
      setParaphraseValid(true);
      setParaphraseFeedback('Could not validate - proceeding anyway.');
      return true;
    } finally {
      setValidatingParaphrase(false);
    }
  };

  const getSuggestions = async () => {
    if (!currentConversation) return;
    setLoadingSuggestions(true);
    try {
      const otherMessages = currentConversation.messages.filter(
        m => m.senderId !== (user as Record<string, unknown>)?.id
      );
      const myMessages = currentConversation.messages.filter(
        m => m.senderId === (user as Record<string, unknown>)?.id
      );
      const otherLast = otherMessages[otherMessages.length - 1]?.content || '';
      const myLast = myMessages[myMessages.length - 1]?.content || debateInput;

      const data = await apiCall('/api/ai/suggest', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: currentConversation.id,
          currentStep: currentConversation.currentStep,
          userMessage: myLast,
          otherPersonMessage: otherLast,
        }),
      });
      setAiSuggestions(data.suggestions || []);
    } catch {
      setAiSuggestions(['Could not load suggestions. Make sure to address their evidence and use charitable language.']);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // ─── Survey ────────────────────────────────────────────────────────────

  const submitSurvey = async () => {
    if (!currentConversation) return;
    if (understandingScore === 0 || civilityScore === 0) {
      showError('Please answer both rating questions');
      return;
    }
    setLoading(true);
    try {
      const surveyResult = await apiCall('/api/surveys', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: currentConversation.id,
          understandingScore,
          civilityScore,
          learnedText: learnedText || undefined,
        }),
      });
      const xpEarned = (understandingScore >= 4 ? 20 : 0) + (civilityScore >= 4 ? 20 : 0);
      // Show XP popups for each reward
      if (xpEarned > 0) {
        if (understandingScore >= 4) showXPPopup(20, 'High Understanding Score');
        if (civilityScore >= 4) showXPPopup(20, 'High Civility Score');
      }
      if (surveyResult.dailyChallengeXP > 0) {
        setTimeout(() => showXPPopup(surveyResult.dailyChallengeXP, 'Daily Challenge!'), 800);
      }
      if (surveyResult.newBadges?.length > 0) {
        setTimeout(() => setBadgeCelebration(surveyResult.newBadges[0]), 1500);
      }
      toast({ title: 'Survey Submitted', description: `Thank you! +${xpEarned} XP earned${surveyResult.newBadges?.length ? ` \u2022 ${surveyResult.newBadges.length} new badge(s)!` : ''}${surveyResult.dailyChallengeXP > 0 ? ` \u2022 Daily Challenge +${surveyResult.dailyChallengeXP} XP!` : ''}` });
      setView('dashboard');
      await loadDashboardData();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to submit survey');
    } finally {
      setLoading(false);
    }
  };

  // ─── Mark Notifications Read ───────────────────────────────────────────

  const markAllRead = async () => {
    try {
      await apiCallSilent('/api/notifications/read-all', { method: 'POST' });
      await fetchNotifications();
    } catch {
      // silent
    }
  };

  // ─── Polling for Debate & Dashboard Updates ────────────────────────────

  // Clear validation state whenever the conversation data changes
  // This is critical: paraphraseFeedback / paraphraseValid are ONLY relevant
  // while User B is actively at step 2 and seeing the paraphrase input.
  // If the conversation advances past step 2, or if User A is viewing,
  // all validation state must be cleared.
  useEffect(() => {
    if (!currentConversation) return;
    // If the conversation has a step 2 message (paraphrase submitted),
    // validation state is stale and must be cleared
    const hasStep2 = currentConversation.messages.some(m => m.step === 2);
    if (hasStep2 || currentConversation.isUserA) {
      setValidatingParaphrase(false);
      setParaphraseFeedback(null);
      setParaphraseValid(null);
    }
  }, [currentConversation?.id, currentConversation?.messages?.length, currentConversation?.isUserA]);

  // Poll for conversation updates when in a debate
  useEffect(() => {
    if (view === 'debate' && currentConversation && currentConversation.status !== 'completed') {
      pollRef.current = setInterval(async () => {
        try {
          if (currentConversation.status === 'waiting') {
            // When waiting, use the check-match endpoint which also handles race conditions
            const matchData = await apiCallSilent('/api/conversations/check-match', {
              method: 'POST',
              body: JSON.stringify({
                topicId: currentConversation.topicId,
                currentConversationId: currentConversation.id,
              }),
            });
            if (matchData?.matched && matchData.conversation) {
              // Found a match! Switch to the matched conversation
              setCurrentConversation(matchData.conversation as Conversation);
              await fetchConversations();
            }
          } else {
            // Normal polling for active conversations - use apiCallSilent for proper auth
            const data = await apiCallSilent(`/api/conversations/${currentConversation.id}`);
            if (data?.conversation) {
              setCurrentConversation(data.conversation);
            }
          }
        } catch {
          // silent
        }
      }, 2000); // Poll every 2 seconds for faster match detection
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [view, currentConversation?.id, currentConversation?.status, apiCallSilent, fetchConversations]);

  // Poll for match updates on the dashboard (auto-detect when waiting conversation gets matched)
  const dashboardPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (view === 'dashboard' && user) {
      dashboardPollRef.current = setInterval(async () => {
        try {
          const data = await apiCallSilent('/api/conversations');
          if (data?.conversations) {
            const prevConvs = conversations;
            setConversations(data.conversations);
            // Auto-navigate to debate if a conversation just got matched
            // Case 1: An existing conversation changed from waiting to matched
            const newlyMatched = data.conversations.find(
              (newC: Conversation) => {
                const prevC = prevConvs.find((oldC: Conversation) => oldC.id === newC.id);
                return prevC && prevC.status === 'waiting' && newC.status !== 'waiting';
              }
            );
            // Case 2: A new matched conversation appeared (race condition fix)
            const newMatchedConv = data.conversations.find(
              (newC: Conversation) => {
                const prevC = prevConvs.find((oldC: Conversation) => oldC.id === newC.id);
                return !prevC && (newC.status === 'matched' || newC.status.startsWith('step'));
              }
            );
            const convToOpen = newlyMatched || newMatchedConv;
            if (convToOpen) {
              setCurrentConversation(convToOpen);
              setView('debate');
              setDebateInput('');
              setValidatingParaphrase(false);
              setParaphraseFeedback(null);
              setParaphraseValid(null);
              setAiSuggestions([]);
            }
          }
        } catch {
          // silent
        }
      }, 2000); // Poll every 2 seconds for faster match detection
    }
    return () => {
      if (dashboardPollRef.current) clearInterval(dashboardPollRef.current);
    };
  }, [view, user, apiCallSilent, conversations]);

  // ─── Navigate Helper ──────────────────────────────────────────────────

  const navigateTo = async (newView: View) => {
    setView(newView);
    if (newView === 'dashboard') {
      await loadDashboardData();
    } else if (newView === 'archive') {
      await fetchArchive();
    } else if (newView === 'leaderboard') {
      await fetchLeaderboard();
    } else if (newView === 'profile') {
      await fetchProfile();
    }
  };

  // ─── Init ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      try {
        // Seed topics
        const sid = getSessionId();
        const initHeaders: Record<string, string> = {};
        if (sid) initHeaders['x-session-user-id'] = sid;
        await fetch('/api/seed', { method: 'POST', credentials: 'include', headers: initHeaders }).catch(() => {});

        // Check auth - use both cookie and header
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
          headers: initHeaders,
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          saveSession(data.user.id);
          if (!data.user.onboardingDone) {
            await fetchTopics();
            setView('onboarding');
          } else {
            setView('dashboard');
          }
        } else {
          clearSession();
          setView('landing');
        }
      } catch {
        setView('landing');
      } finally {
        setInitializing(false);
      }
    };
    init();
  }, [getSessionId, saveSession, clearSession, fetchTopics]);

  // Load dashboard data when view becomes dashboard
  useEffect(() => {
    if (view === 'dashboard' && user) {
      loadDashboardData().catch(() => {});
    }
  }, [view, user, loadDashboardData]);

  // ─── Debate Step Logic ────────────────────────────────────────────────

  const getDebateStep = (): { step: number; isMyTurn: boolean; prompt: string } => {
    if (!currentConversation) return { step: 0, isMyTurn: false, prompt: '' };
    const { isUserA } = currentConversation;

    // PRIMARY: Use message count to determine actual debate progress
    // This is more robust than relying on status strings which can be
    // stale, transitional, or in obsolete states like step2_validate
    const hasStep1 = currentConversation.messages.some(m => m.step === 1);
    const hasStep2 = currentConversation.messages.some(m => m.step === 2);
    const hasStep3 = currentConversation.messages.some(m => m.step === 3);
    const hasStep4 = currentConversation.messages.some(m => m.step === 4);
    const hasStep5 = currentConversation.messages.some(m => m.step === 5);

    // Waiting for match
    if (currentConversation.status === 'waiting') {
      return { step: 0, isMyTurn: false, prompt: 'Waiting for a debate partner with an opposing view...' };
    }

    // Debate flow (5 steps):
    // Step 1: User A writes opening argument
    // Step 2: User B paraphrases User A's argument (with AI validation)
    // Step 3: User B writes counter-argument
    // Step 4: User A responds to counter-argument
    // Step 5: User B writes final summary

    // No messages yet -> matched, waiting for User A to write argument
    if (!hasStep1) {
      return isUserA
        ? { step: 1, isMyTurn: true, prompt: "You're matched! Write your opening argument." }
        : { step: 1, isMyTurn: false, prompt: "Your partner is writing their opening argument..." };
    }

    // Step 1 done, no paraphrase yet -> User B's turn to paraphrase
    if (hasStep1 && !hasStep2) {
      return isUserA
        ? { step: 2, isMyTurn: false, prompt: 'Your partner is paraphrasing your argument. You\'ll see it once they submit.' }
        : { step: 2, isMyTurn: true, prompt: "Now paraphrase Person A's main argument in your own words." };
    }

    // Step 2 done, no counter-argument yet -> User B's turn to write counter-argument
    if (hasStep2 && !hasStep3) {
      return isUserA
        ? { step: 3, isMyTurn: false, prompt: 'Your partner is writing their counter-argument...' }
        : { step: 3, isMyTurn: true, prompt: 'Now respond with your counter-argument. Support with evidence.' };
    }

    // Step 3 done, no response yet -> User A's turn to respond
    if (hasStep3 && !hasStep4) {
      return isUserA
        ? { step: 4, isMyTurn: true, prompt: "Respond to your partner's counter-argument." }
        : { step: 4, isMyTurn: false, prompt: 'Your partner is writing their response...' };
    }

    // Step 4 done, no summary yet -> User B's turn to write summary
    if (hasStep4 && !hasStep5) {
      return isUserA
        ? { step: 5, isMyTurn: false, prompt: 'Your partner is writing their final summary...' }
        : { step: 5, isMyTurn: true, prompt: "Summarize what you learned from Person A's argument." };
    }

    // All steps done
    if (hasStep5) {
      return { step: 6, isMyTurn: false, prompt: 'Debate Complete!' };
    }

    return { step: 0, isMyTurn: false, prompt: '' };
  };

  const handleSubmitStep = async () => {
    if (!currentConversation) return;
    const { step, isMyTurn } = getDebateStep();
    if (!isMyTurn) return;

    // Ironclad safety: User A should NEVER submit at steps 2 or 5 (User B's steps)
    if (currentConversation.isUserA && (step === 2 || step === 5)) {
      console.error('User A attempted to submit at step', step, '- blocked');
      return;
    }

    const wordCount = countWords(debateInput);

    if (step === 1 || step === 3) {
      if (wordCount < 200) {
        showError('Please write at least 200 words');
        return;
      }
      if (wordCount > 300) {
        showError('Please keep it under 300 words');
        return;
      }
      await submitMessage(step === 1 ? 'argument' : 'counter_argument', debateInput, step);
    } else if (step === 2) {
      if (wordCount < 10) {
        showError('Please write at least 10 words for your paraphrase');
        return;
      }
      const argument = currentConversation.messages.find(m => m.step === 1)?.content || '';
      const isValid = await validateParaphrase(argument, debateInput);
      if (isValid) {
        await submitMessage('paraphrase', debateInput, 2);
      }
      // If not valid, user can revise - feedback is shown in the input card
    } else if (step === 4) {
      if (wordCount < 50) {
        showError('Please write at least 50 words');
        return;
      }
      if (wordCount > 200) {
        showError('Please keep it under 200 words');
        return;
      }
      await submitMessage('response', debateInput, 4);
    } else if (step === 5) {
      if (wordCount < 20) {
        showError('Please write at least 20 words');
        return;
      }
      if (wordCount > 100) {
        showError('Please keep it under 100 words');
        return;
      }
      await submitMessage('final_summary', debateInput, 5);
    }
  };

  // ─── XP Popup System ─────────────────────────────────────────────────

  const showXPPopup = useCallback((amount: number, reason: string) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    setXPPopups(prev => [...prev, { id, amount, reason, timestamp: Date.now() }]);
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setXPPopups(prev => prev.filter(p => p.id !== id));
    }, 3000);
  }, []);

  // ─── Unread Notifications ─────────────────────────────────────────────

  const unreadCount = notifications.filter(n => !n.read).length;

  // ─── Challenge Icon Helper ────────────────────────────────────────────

  const getChallengeIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      Compass: <Compass className="h-5 w-5" />,
      CheckCircle: <CheckCircle className="h-5 w-5" />,
      Shield: <Shield className="h-5 w-5" />,
      MessageSquare: <MessageSquare className="h-5 w-5" />,
      Lightbulb: <Lightbulb className="h-5 w-5" />,
    };
    return icons[iconName] || <Target className="h-5 w-5" />;
  };

  // ─── Streak Visualization (last 7 days) ──────────────────────────────

  const getStreakDays = () => {
    if (!userProfile?.lastDebateDate) return Array(7).fill(false);
    const days: boolean[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      // Simple: if streak is N, the last N days were active
      const streak = userProfile.streak || 0;
      days.push(i < streak);
    }
    return days;
  };

  // ─── XP Popup Renderer ──────────────────────────────────────────────

  const XPPopupOverlay = () => (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {xpPopups.map(popup => (
        <div
          key={popup.id}
          className="animate-slide-in-right bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 rounded-xl shadow-lg shadow-amber-200/50 flex items-center gap-3 min-w-[200px]"
        >
          <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
            +{popup.amount}
          </div>
          <div>
            <p className="text-sm font-bold">+{popup.amount} XP</p>
            <p className="text-xs text-amber-100">{popup.reason}</p>
          </div>
        </div>
      ))}
    </div>
  );

  // ─── Badge Celebration Dialog ────────────────────────────────────────

  const BadgeCelebrationDialog = () => (
    <Dialog open={!!badgeCelebration} onOpenChange={(open) => { if (!open) setBadgeCelebration(null); }}>
      <DialogContent className="max-w-sm text-center">
        <div className="py-4">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Award className="h-10 w-10 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-amber-900 mb-2">Badge Unlocked!</DialogTitle>
          <p className="text-lg font-semibold text-slate-800 mb-1">{badgeCelebration}</p>
          <p className="text-sm text-slate-500 mb-4">You earned +25 XP bonus!</p>
          <Button onClick={() => setBadgeCelebration(null)} className="bg-amber-600 hover:bg-amber-700 text-white">
            Awesome!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // ─── Loading Screen ───────────────────────────────────────────────────

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50/30">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Scale className="h-8 w-8 text-amber-600" />
            <span className="text-2xl font-bold text-amber-900 tracking-tight">StorySwap</span>
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-amber-600 mx-auto" />
          <p className="text-sm text-slate-500 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  // ─── Global Gamification Overlays ─────────────────────────────────────

  const GamificationOverlays = () => (
    <>
      <XPPopupOverlay />
      <BadgeCelebrationDialog />
    </>
  );

  // ═══════════════════════════════════════════════════════════════════════
  // LANDING VIEW
  // ═══════════════════════════════════════════════════════════════════════

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <div className="max-w-5xl mx-auto px-4 py-8 sm:py-16">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Scale className="h-10 w-10 sm:h-12 sm:w-12 text-amber-600" />
              <h1 className="text-4xl sm:text-5xl font-bold text-amber-900 tracking-tight">StorySwap</h1>
            </div>
            <p className="text-xl sm:text-2xl text-amber-800 font-medium mb-3">
              Where perspectives meet. Debate with empathy.
            </p>
            <p className="text-slate-600 max-w-xl mx-auto leading-relaxed">
              Engage in structured conversations with people who disagree with you.
              Build understanding through respectful, evidence-based dialogue.
            </p>
          </div>

          {/* How it Works */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12">
            {[
              { icon: <BookOpen className="h-7 w-7" />, title: 'Take a Stance', desc: 'Choose your position on trending topics.' },
              { icon: <Users className="h-7 w-7" />, title: 'Get Matched', desc: 'We pair you with someone who disagrees.' },
              { icon: <Handshake className="h-7 w-7" />, title: 'Debate with Civility', desc: 'Follow structured steps for productive dialogue.' },
            ].map((item, i) => (
              <Card key={i} className="bg-white/80 border-amber-200/60 text-center">
                <CardContent className="pt-6">
                  <div className="flex justify-center text-amber-600 mb-3">{item.icon}</div>
                  <h3 className="font-semibold text-slate-800 mb-1">{item.title}</h3>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Auth Form */}
          <Card className="max-w-md mx-auto bg-white border-amber-200/60 shadow-lg">
            <CardHeader>
              <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as 'login' | 'signup')}>
                <TabsList className="grid w-full grid-cols-2 bg-amber-100">
                  <TabsTrigger value="signup" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">Sign Up</TabsTrigger>
                  <TabsTrigger value="login" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">Log In</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              {authMode === 'signup' ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Your username" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm password" className="mt-1" />
                  </div>
                  <Button onClick={handleSignup} disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Account
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="loginEmail">Email</Label>
                    <Input id="loginEmail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="loginPassword">Password</Label>
                    <Input id="loginPassword" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" className="mt-1" />
                  </div>
                  <Button onClick={handleLogin} disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Log In
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ONBOARDING VIEW
  // ═══════════════════════════════════════════════════════════════════════

  if (view === 'onboarding') {
    const onboardingTopics = topics.slice(0, 3);
    const allStancesSelected = onboardingTopics.every(t => onboardingStances[t.id]);

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <Scale className="h-10 w-10 text-amber-600 mx-auto mb-3" />
            <h1 className="text-3xl font-bold text-amber-900 tracking-tight mb-2">
              Let&apos;s understand your perspectives
            </h1>
            <p className="text-slate-600">
              Select your stance on these trending topics. You&apos;ll be matched with someone who disagrees.
            </p>
          </div>

          <div className="space-y-6 mb-8">
            {onboardingTopics.map((topic) => (
              <Card key={topic.id} className="bg-white border-amber-200/60">
                <CardHeader>
                  <CardTitle className="text-lg text-amber-900">{topic.name}</CardTitle>
                  <CardDescription>{topic.question}</CardDescription>
                  <a
                    href={topic.sourceUrl1}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-amber-600 hover:underline flex items-center gap-1 mt-1"
                  >
                    <ExternalLink className="h-3 w-3" /> Source
                  </a>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={onboardingStances[topic.id] || ''}
                    onValueChange={(val) =>
                      setOnboardingStances(prev => ({ ...prev, [topic.id]: val }))
                    }
                  >
                    <div className="flex items-start space-x-3 mb-3 p-3 rounded-lg hover:bg-amber-50 transition-colors">
                      <RadioGroupItem value="A" id={`${topic.id}-a`} className="mt-0.5" />
                      <Label htmlFor={`${topic.id}-a`} className="cursor-pointer font-normal text-slate-700">
                        <span className="font-medium text-amber-700">Option A:</span> {topic.optionA}
                      </Label>
                    </div>
                    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-emerald-50 transition-colors">
                      <RadioGroupItem value="B" id={`${topic.id}-b`} className="mt-0.5" />
                      <Label htmlFor={`${topic.id}-b`} className="cursor-pointer font-normal text-slate-700">
                        <span className="font-medium text-emerald-700">Option B:</span> {topic.optionB}
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button
            onClick={handleOnboardingSubmit}
            disabled={!allStancesSelected || loading}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white h-12 text-base"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
            Begin Debating
          </Button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // NAV BAR (for dashboard, debate, survey, archive, leaderboard, profile)
  // ═══════════════════════════════════════════════════════════════════════

  const NavBar = () => (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-amber-200/60 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigateTo('dashboard')} className="flex items-center gap-2 hover:opacity-80 transition">
            <Scale className="h-6 w-6 text-amber-600" />
            <span className="font-bold text-amber-900 hidden sm:inline">StorySwap</span>
          </button>
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {[
              { key: 'dashboard' as View, label: 'Dashboard', icon: <MessageSquare className="h-4 w-4" /> },
              { key: 'archive' as View, label: 'Archive', icon: <BookOpen className="h-4 w-4" /> },
              { key: 'leaderboard' as View, label: 'Leaderboard', icon: <Trophy className="h-4 w-4" /> },
              { key: 'profile' as View, label: 'Profile', icon: <User className="h-4 w-4" /> },
            ].map(item => (
              <Button
                key={item.key}
                variant="ghost"
                size="sm"
                onClick={() => navigateTo(item.key)}
                className={`gap-1.5 ${view === item.key ? 'bg-amber-100 text-amber-800' : 'text-slate-600'}`}
              >
                {item.icon}
                <span className="hidden lg:inline">{item.label}</span>
              </Button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile nav */}
          <div className="md:hidden flex items-center gap-1">
            {[
              { key: 'dashboard' as View, icon: <MessageSquare className="h-4 w-4" /> },
              { key: 'archive' as View, icon: <BookOpen className="h-4 w-4" /> },
              { key: 'leaderboard' as View, icon: <Trophy className="h-4 w-4" /> },
              { key: 'profile' as View, icon: <User className="h-4 w-4" /> },
            ].map(item => (
              <Button
                key={item.key}
                variant="ghost"
                size="icon"
                onClick={() => navigateTo(item.key)}
                className={`h-8 w-8 ${view === item.key ? 'bg-amber-100 text-amber-800' : 'text-slate-500'}`}
              >
                {item.icon}
              </Button>
            ))}
          </div>

          {/* Notifications */}
          <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8">
                <Bell className="h-4 w-4 text-slate-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Notifications</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-64">
                {notifications.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No notifications yet</p>
                ) : (
                  <div className="space-y-2">
                    {notifications.map(n => (
                      <div key={n.id} className={`p-2 rounded text-sm ${n.read ? 'text-slate-400' : 'text-slate-700 bg-amber-50'}`}>
                        <p>{n.content}</p>
                        <p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              {unreadCount > 0 && (
                <Button size="sm" variant="outline" onClick={markAllRead} className="w-full mt-2">
                  Mark All Read
                </Button>
              )}
            </DialogContent>
          </Dialog>

          {/* User info */}
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-amber-200 text-amber-800 text-xs">
                {String(user?.username || '?')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline text-sm font-medium text-slate-700">
              {String(user?.username || '')}
            </span>
            <Badge variant="outline" className="hidden sm:inline text-xs bg-amber-50 text-amber-700 border-amber-200">
              Lv.{userProfile?.level || 1} &bull; {Number(user?.points || 0)} pts
            </Badge>
          </div>

          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );

  // ═══════════════════════════════════════════════════════════════════════
  // DASHBOARD VIEW
  // ═══════════════════════════════════════════════════════════════════════

  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-amber-50/30 flex flex-col">
        <GamificationOverlays />
        <NavBar />
        <main className="flex-1 max-w-5xl mx-auto px-4 py-6 w-full">
          {/* Gamification Stats */}
          <section className="mb-8">
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200/60 mb-4">
              <CardContent className="py-5">
                <div className="flex items-center gap-4 mb-3">
                  <div className="h-14 w-14 rounded-full bg-amber-200 flex items-center justify-center text-2xl font-bold text-amber-800">
                    {userProfile?.level || 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-amber-900 text-lg">Level {userProfile?.level || 1}</h3>
                      <Badge className="bg-amber-500 text-white text-xs">{userProfile?.levelTitle || 'Newcomer'}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Progress value={userProfile?.xpProgress || 0} className="h-3 flex-1" />
                      <span className="text-xs text-amber-700 shrink-0">{userProfile?.currentLevelXP || 0}/{100} XP</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{userProfile?.xpToNextLevel || 100} XP to next level</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold text-amber-700">{userProfile?.totalXP || 0}</p>
                    <p className="text-xs text-slate-500">Total XP</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Points', value: userProfile?.points || 0, icon: <Star className="h-4 w-4 text-amber-500" />, color: 'bg-amber-50 text-amber-700 border-amber-200' },
                { label: 'Day Streak', value: userProfile?.streak || 0, icon: <Flame className="h-4 w-4 text-orange-500" />, color: 'bg-orange-50 text-orange-700 border-orange-200' },
                { label: 'Debates', value: userProfile?.debateCount || 0, icon: <MessageSquare className="h-4 w-4 text-emerald-500" />, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                { label: 'Badges', value: `${userProfile?.badgesCount || 0}/${userProfile?.totalBadges || 20}`, icon: <Award className="h-4 w-4 text-purple-500" />, color: 'bg-purple-50 text-purple-700 border-purple-200' },
              ].map((stat, i) => (
                <Card key={i} className={`${stat.color} border`}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-2 mb-1">
                      {stat.icon}
                      <span className="text-xs font-medium opacity-80">{stat.label}</span>
                    </div>
                    <p className="text-xl font-bold">{stat.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Daily Challenge + Streak Row */}
          <section className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Daily Challenge */}
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200/60">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-full bg-purple-200 flex items-center justify-center">
                    <Gift className="h-4 w-4 text-purple-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-purple-900 text-sm">Daily Challenge</h3>
                    <p className="text-[10px] text-purple-600">Resets daily at midnight</p>
                  </div>
                  {dailyChallenge?.completedToday && (
                    <Badge className="bg-emerald-500 text-white text-[10px] ml-auto">
                      <CheckCircle className="h-3 w-3 mr-0.5" /> Done!
                    </Badge>
                  )}
                </div>
                {dailyChallenge ? (
                  <div className={`p-3 rounded-lg ${dailyChallenge.completedToday ? 'bg-emerald-50 border border-emerald-200' : 'bg-white border border-purple-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-purple-600">{getChallengeIcon(dailyChallenge.challenge.icon)}</span>
                      <h4 className="font-semibold text-sm text-slate-800">{dailyChallenge.challenge.title}</h4>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{dailyChallenge.challenge.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={`text-[10px] ${dailyChallenge.completedToday ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        +{dailyChallenge.challenge.xpReward} XP
                      </Badge>
                      {dailyChallenge.completedToday ? (
                        <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Completed!
                        </span>
                      ) : (
                        <span className="text-xs text-purple-500">Complete a debate to earn this</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-white border border-purple-200 animate-pulse">
                    <div className="h-4 bg-purple-100 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-purple-50 rounded w-full" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Streak Visualization */}
            <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200/60">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-full bg-orange-200 flex items-center justify-center">
                    <Flame className="h-4 w-4 text-orange-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-orange-900 text-sm">Streak</h3>
                    <p className="text-[10px] text-orange-600">{userProfile?.streak || 0} day{userProfile?.streak !== 1 ? 's' : ''} and counting</p>
                  </div>
                  {(userProfile?.streak || 0) >= 3 && (
                    <Badge className="bg-orange-500 text-white text-[10px] ml-auto">
                      <Zap className="h-3 w-3 mr-0.5" /> On Fire!
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                  {getStreakDays().map((active, i) => {
                    const dayLabel = ['M', 'T', 'W', 'T', 'F', 'S', 'S'][((new Date().getDay() - 6 + i) % 7 + 7) % 7];
                    return (
                      <div key={i} className="flex-1 text-center">
                        <div className={`h-8 rounded-md flex items-center justify-center text-xs font-bold transition-all ${active ? 'bg-gradient-to-br from-orange-400 to-red-400 text-white shadow-sm shadow-orange-200' : 'bg-orange-100 text-orange-300'}`}>
                          {active ? <Flame className="h-4 w-4" /> : dayLabel}
                        </div>
                        <p className="text-[9px] text-orange-400 mt-1">{dayLabel}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-orange-600">Best: {userProfile?.longestStreak || 0} days</span>
                  <span className="text-orange-400">
                    {(userProfile?.streak || 0) >= 3 ? 'Keep it going!' : (userProfile?.streak || 0) > 0 ? `${3 - (userProfile?.streak || 0)} more for Hot Streak badge` : 'Debate daily to build your streak!'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Start a New Debate */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-600" /> Start a New Debate
            </h2>
            {topics.length === 0 ? (
              <Card className="bg-white border-amber-200/60">
                <CardContent className="py-8 text-center text-slate-500">
                  No topics available yet.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {topics.map(topic => {
                  // Check if user already has an active conversation on this topic
                  const activeConv = conversations.find(c => c.topicId === topic.id && c.status !== 'completed');
                  const hasStance = !!topic.userStance;
                  return (
                    <Card
                      key={topic.id}
                      className={`bg-white border-amber-200/60 hover:shadow-md transition-shadow cursor-pointer group ${activeConv ? 'ring-2 ring-amber-300' : ''}`}
                      onClick={() => handleTopicClick(topic)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base text-amber-900 group-hover:text-amber-700 transition-colors">
                            {topic.name}
                          </CardTitle>
                          <div className="flex gap-1 shrink-0">
                            {hasStance ? (
                              <Badge variant="outline" className={`text-xs ${topic.userStance === 'A' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                {topic.userStance === 'A' ? 'Option A' : 'Option B'}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs bg-slate-50 text-slate-500 border-slate-200">
                                No stance
                              </Badge>
                            )}
                            {activeConv && getStatusBadge(activeConv.status)}
                          </div>
                        </div>
                        <CardDescription className="text-xs line-clamp-2">{topic.question}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {activeConv ? (
                          <div className="text-xs text-amber-700 font-medium">
                            {activeConv.status === 'waiting' ? '🔄 Waiting for a partner...' : '💬 Continue your debate →'}
                          </div>
                        ) : !hasStance ? (
                          <div className="text-xs text-slate-500">
                            <span className="text-amber-600 font-medium">Click to select your stance →</span>
                            <div className="space-y-0.5 mt-1">
                              <p><span className="font-medium text-amber-600">A:</span> {topic.optionA}</p>
                              <p><span className="font-medium text-emerald-600">B:</span> {topic.optionB}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 space-y-0.5">
                            <p><span className="font-medium text-amber-600">A:</span> {topic.optionA}</p>
                            <p><span className="font-medium text-emerald-600">B:</span> {topic.optionB}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* Active Conversations */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-amber-600" /> Your Active Conversations
            </h2>
            {conversations.length === 0 ? (
              <Card className="bg-white border-amber-200/60">
                <CardContent className="py-8 text-center">
                  <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No conversations yet.</p>
                  <p className="text-sm text-slate-400">Pick a topic above to start your first debate!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {conversations.map(conv => (
                  <Card
                    key={conv.id}
                    className="bg-white border-amber-200/60 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => openConversation(conv.id)}
                  >
                    <CardContent className="py-4 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-800 truncate">{conv.topic.name}</h3>
                          {getStatusBadge(conv.status)}
                        </div>
                        <p className="text-sm text-slate-500 truncate">{conv.topic.question}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Step {conv.currentStep}/5 &middot; Updated {new Date(conv.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {conv.status === 'waiting' ? (
                          <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
                        ) : conv.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <ArrowLeft className="h-5 w-5 text-slate-400 rotate-180" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </main>
        <footer className="mt-auto border-t border-amber-100 bg-white/60 py-4 text-center text-xs text-slate-400">
          StorySwap &mdash; Where perspectives meet. Debate with empathy.
        </footer>

        {/* Stance Selection Dialog */}
        <Dialog open={!!selectingStanceTopic} onOpenChange={(open) => { if (!open) { setSelectingStanceTopic(null); setStanceDialogValue(''); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-amber-900">Select Your Stance</DialogTitle>
            </DialogHeader>
            {selectingStanceTopic && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">{selectingStanceTopic.question}</p>
                <a
                  href={selectingStanceTopic.sourceUrl1}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-amber-600 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" /> Read the source
                </a>
                <RadioGroup
                  value={stanceDialogValue}
                  onValueChange={setStanceDialogValue}
                >
                  <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-amber-50 transition-colors border border-transparent"
                    onClick={() => setStanceDialogValue('A')}
                  >
                    <RadioGroupItem value="A" id="stance-dialog-a" className="mt-0.5" />
                    <Label htmlFor="stance-dialog-a" className="cursor-pointer font-normal text-slate-700">
                      <span className="font-medium text-amber-700">Option A:</span> {selectingStanceTopic.optionA}
                    </Label>
                  </div>
                  <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-emerald-50 transition-colors border border-transparent"
                    onClick={() => setStanceDialogValue('B')}
                  >
                    <RadioGroupItem value="B" id="stance-dialog-b" className="mt-0.5" />
                    <Label htmlFor="stance-dialog-b" className="cursor-pointer font-normal text-slate-700">
                      <span className="font-medium text-emerald-700">Option B:</span> {selectingStanceTopic.optionB}
                    </Label>
                  </div>
                </RadioGroup>
                <Button
                  onClick={handleStanceSelectAndStart}
                  disabled={!stanceDialogValue || savingStance}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {savingStance ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {stanceDialogValue ? 'Begin Debating' : 'Select a stance to continue'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DEBATE VIEW
  // ═══════════════════════════════════════════════════════════════════════

  if (view === 'debate' && currentConversation) {
    const { step: currentStep, isMyTurn, prompt } = getDebateStep();
    // Fallback: if topic is missing from conversation, look it up from the topics list
    const topic = currentConversation.topic || topics.find(t => t.id === currentConversation.topicId);
    const wordCount = countWords(debateInput);

    // If topic data isn't available yet, show loading
    if (!topic) {
      return (
        <div className="min-h-screen bg-amber-50/30 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
        </div>
      );
    }

    const getWordLimitInfo = () => {
      if (currentStep === 1 || currentStep === 3) return { min: 200, max: 300 };
      if (currentStep === 2) return { min: 10, max: 80 };
      if (currentStep === 4) return { min: 50, max: 200 };
      if (currentStep === 5) return { min: 20, max: 100 };
      return { min: 0, max: 0 };
    };
    const wordLimits = getWordLimitInfo();

    return (
      <div className="min-h-screen bg-amber-50/30 flex flex-col">
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-amber-200/60 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigateTo('dashboard')} className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="min-w-0 flex-1">
              <h1 className="font-semibold text-slate-800 truncate">{topic.name}</h1>
            </div>
            {getStatusBadge(currentConversation.status)}
          </div>
        </header>

        <main className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full">
          {/* Topic Info */}
          <Card className="bg-white border-amber-200/60 mb-6">
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-amber-900">{topic.question}</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    You are <span className="font-medium">{currentConversation.isUserA ? 'Person A' : 'Person B'}</span>
                    {currentConversation.otherUser && ` • Debating with ${currentConversation.otherUser.username}`}
                  </p>
                </div>
                <a href={topic.sourceUrl1} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <Button variant="outline" size="sm" className="text-xs gap-1">
                    <ExternalLink className="h-3 w-3" /> Source
                  </Button>
                </a>
              </div>
              <div className="flex gap-3 mt-3">
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                  A: {topic.optionA}
                </Badge>
                <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                  B: {topic.optionB}
                </Badge>
              </div>
              {/* Progress */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Progress</span>
                  <span>Step {Math.min(currentConversation.currentStep, 5)}/5</span>
                </div>
                <Progress value={Math.min((currentConversation.currentStep / 5) * 100, 100)} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Message Thread */}
          {currentConversation.messages.length > 0 && (
            <div className="mb-6 space-y-3">
              {currentConversation.messages.map((msg) => {
                const isMyMessage = msg.senderId === (user as Record<string, unknown>)?.id;
                return (
                  <Card
                    key={msg.id}
                    className={`${isMyMessage ? 'bg-amber-50 border-amber-200/60' : 'bg-emerald-50 border-emerald-200/60'}`}
                  >
                    <CardContent className="py-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className={`text-[10px] ${isMyMessage ? 'bg-amber-200 text-amber-800' : 'bg-emerald-200 text-emerald-800'}`}>
                            {isMyMessage ? 'A' : 'B'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-slate-600">
                          {isMyMessage ? 'You' : 'Your Partner'}
                        </span>
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                          {getStepLabel(msg.step)}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Waiting State */}
          {currentConversation.status === 'waiting' && (
            <Card className="bg-white border-amber-200/60 mb-6">
              <CardContent className="py-8 text-center">
                <Loader2 className="h-8 w-8 text-amber-500 animate-spin mx-auto mb-3" />
                <p className="text-slate-700 font-medium mb-1">Looking for a debate partner with an opposing view...</p>
                <p className="text-sm text-slate-500">We&apos;re automatically checking every few seconds. You&apos;ll be connected as soon as someone joins.</p>
                <Button variant="outline" className="mt-4" onClick={async () => {
                  // Manually trigger a match check
                  try {
                    const matchData = await apiCall('/api/conversations/check-match', {
                      method: 'POST',
                      body: JSON.stringify({
                        topicId: currentConversation.topicId,
                        currentConversationId: currentConversation.id,
                      }),
                    });
                    if (matchData?.matched && matchData.conversation) {
                      setCurrentConversation(matchData.conversation as Conversation);
                      await fetchConversations();
                    } else {
                      toast({ title: 'No partner yet', description: 'Still looking for someone with an opposing view. Try again in a moment.' });
                    }
                  } catch (err) {
                    showError(err instanceof Error ? err.message : 'Failed to check for matches');
                  }
                }}>
                  <Users className="h-4 w-4 mr-2" /> Check for Partner Now
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Not My Turn */}
          {!isMyTurn && currentConversation.status !== 'waiting' && currentConversation.status !== 'completed' && (
            <Card className="bg-white border-amber-200/60 mb-6">
              <CardContent className="py-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className={`text-[10px] ${currentConversation.isUserA ? 'bg-amber-200 text-amber-800' : 'bg-emerald-200 text-emerald-800'}`}>
                      {currentConversation.isUserA ? 'A' : 'B'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-slate-500">
                    You are {currentConversation.isUserA ? 'Person A' : 'Person B'}
                  </span>
                </div>
                <AlertCircle className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                <p className="text-slate-700 font-medium">{prompt}</p>
                <p className="text-sm text-slate-500 mt-1">We&apos;ll auto-update when it&apos;s your turn.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={async () => {
                  const data = await apiCallSilent(`/api/conversations/${currentConversation.id}`);
                  if (data?.conversation) setCurrentConversation(data.conversation);
                }}>
                  Refresh Now
                </Button>
              </CardContent>
            </Card>
          )}

          {/* My Turn - Input Area */}
          {isMyTurn && currentConversation.status !== 'completed' && (
            <Card className="bg-white border-amber-200/60 mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-amber-900">{prompt}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Show source link for argument steps */}
                {(currentStep === 1 || currentStep === 3) && (
                  <div className="mb-3">
                    <a
                      href={topic.sourceUrl1}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-amber-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" /> Reference source for evidence
                    </a>
                  </div>
                )}

                {/* Show Person A's argument for paraphrase step */}
                {currentStep === 2 && (
                  <>
                    <Card className="bg-amber-50 border-amber-200/60 mb-3">
                      <CardContent className="py-3">
                        <p className="text-xs font-medium text-amber-700 mb-1">Person A&apos;s Argument:</p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                          {currentConversation.messages.find(m => m.step === 1)?.content}
                        </p>
                      </CardContent>
                    </Card>
                    {/* Inline paraphrase feedback - only visible to User B at step 2 */}
                    {validatingParaphrase && (
                      <div className="flex items-center gap-2 mb-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
                        <Loader2 className="h-4 w-4 text-purple-500 animate-spin shrink-0" />
                        <p className="text-sm text-purple-700">AI is checking your paraphrase...</p>
                      </div>
                    )}
                    {paraphraseFeedback && !paraphraseValid && !validatingParaphrase && (
                      <div className="flex items-start gap-2 mb-3 p-3 rounded-lg bg-red-50 border border-red-200">
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-red-700">Paraphrase needs revision</p>
                          <p className="text-sm text-red-600 mt-1">{paraphraseFeedback}</p>
                        </div>
                      </div>
                    )}
                    {paraphraseFeedback && paraphraseValid && !validatingParaphrase && (
                      <div className="flex items-center gap-2 mb-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                        <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                        <p className="text-sm text-emerald-700">Paraphrase validated! Click Submit to continue.</p>
                      </div>
                    )}
                  </>
                )}

                {/* Show counter-argument for response step */}
                {currentStep === 4 && (
                  <Card className="bg-emerald-50 border-emerald-200/60 mb-3">
                    <CardContent className="py-3">
                      <p className="text-xs font-medium text-emerald-700 mb-1">Your Partner&apos;s Counter-Argument:</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">
                        {currentConversation.messages.find(m => m.step === 3)?.content}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Show Person A's argument for final summary */}
                {currentStep === 5 && (
                  <Card className="bg-amber-50 border-amber-200/60 mb-3">
                    <CardContent className="py-3">
                      <p className="text-xs font-medium text-amber-700 mb-1">Person A&apos;s Argument:</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">
                        {currentConversation.messages.find(m => m.step === 1)?.content}
                      </p>
                    </CardContent>
                  </Card>
                )}

                <Textarea
                  value={debateInput}
                  onChange={e => setDebateInput(e.target.value)}
                  placeholder={
                    currentStep === 1
                      ? 'Write your argument supporting your stance. Include evidence...'
                      : currentStep === 2
                        ? 'Paraphrase their main argument in YOUR OWN WORDS (1-2 sentences). Be charitable...'
                        : currentStep === 3
                          ? 'Write your counter-argument. Support with evidence...'
                          : currentStep === 4
                            ? 'Respond to their counter-argument...'
                            : 'Summarize what you learned from their argument...'
                  }
                  rows={currentStep === 2 ? 3 : 6}
                  className="mb-2"
                />

                {/* Word Count */}
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className={`${wordCount < wordLimits.min ? 'text-red-500' : wordCount > wordLimits.max ? 'text-red-500' : 'text-emerald-600'}`}>
                    {wordCount} words
                  </span>
                  <span className="text-slate-400">
                    {wordLimits.min}-{wordLimits.max} words required
                  </span>
                </div>

                {/* AI Suggestions (step 4) */}
                {currentStep === 4 && (
                  <div className="mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={getSuggestions}
                      disabled={loadingSuggestions || debateInput.trim().length < 10}
                      className="gap-1.5 text-xs mb-3"
                    >
                      {loadingSuggestions ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lightbulb className="h-3 w-3" />}
                      Get AI Suggestions
                    </Button>
                    {aiSuggestions.length > 0 && (
                      <Card className="bg-purple-50 border-purple-200">
                        <CardContent className="py-3">
                          <p className="text-xs font-medium text-purple-700 mb-2 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> AI Suggestions
                          </p>
                          <ul className="space-y-1.5">
                            {aiSuggestions.map((s, i) => (
                              <li key={i} className="text-xs text-purple-700 flex items-start gap-1.5">
                                <span className="mt-0.5 shrink-0">•</span>
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                <Button
                  onClick={handleSubmitStep}
                  disabled={submittingMessage || validatingParaphrase || debateInput.trim().length === 0}
                  className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
                >
                  {submittingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Submit
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Completed State */}
          {currentConversation.status === 'completed' && (
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/60 mb-6">
              <CardContent className="py-6 text-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-emerald-800 mb-1">Debate Complete!</h3>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="bg-white/80 rounded-lg px-3 py-2 border border-emerald-200">
                    <p className="text-2xl font-bold text-amber-600">+50</p>
                    <p className="text-xs text-slate-500">XP Earned</p>
                  </div>
                  <div className="bg-white/80 rounded-lg px-3 py-2 border border-emerald-200">
                    <p className="text-2xl font-bold text-emerald-600">5/5</p>
                    <p className="text-xs text-slate-500">Steps Done</p>
                  </div>
                </div>
                <p className="text-sm text-emerald-700 mb-4">Complete the survey for bonus XP and badge progress!</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => { setUnderstandingScore(0); setCivilityScore(0); setLearnedText(''); setView('survey'); }} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                    <Star className="h-4 w-4" /> Take Survey for Bonus XP
                  </Button>
                  <Button variant="outline" onClick={() => navigateTo('dashboard')}>
                    Return to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SURVEY VIEW
  // ═══════════════════════════════════════════════════════════════════════

  if (view === 'survey') {
    return (
      <div className="min-h-screen bg-amber-50/30 flex flex-col">
        <NavBar />
        <main className="flex-1 max-w-2xl mx-auto px-4 py-8 w-full">
          <Card className="bg-white border-amber-200/60">
            <CardHeader>
              <CardTitle className="text-xl text-amber-900">Post-Debate Reflection</CardTitle>
              <CardDescription>Take a moment to reflect on your conversation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Understanding Score */}
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-3 block">
                  Did you understand your partner&apos;s perspective better?
                </Label>
                <RadioGroup value={String(understandingScore)} onValueChange={v => setUnderstandingScore(Number(v))}>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: '1', label: 'Not at all' },
                      { value: '2', label: 'Slightly' },
                      { value: '3', label: 'Moderately' },
                      { value: '4', label: 'Well' },
                      { value: '5', label: 'Completely' },
                    ].map(opt => (
                      <label key={opt.value} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${understandingScore === Number(opt.value) ? 'bg-amber-50 border-amber-300 text-amber-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        <RadioGroupItem value={opt.value} id={`understanding-${opt.value}`} />
                        <span className="text-sm">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              {/* Civility Score */}
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-3 block">
                  Was the conversation civil?
                </Label>
                <RadioGroup value={String(civilityScore)} onValueChange={v => setCivilityScore(Number(v))}>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: '1', label: 'Not at all' },
                      { value: '2', label: 'Slightly' },
                      { value: '3', label: 'Moderately' },
                      { value: '4', label: 'Very civil' },
                      { value: '5', label: 'Extremely civil' },
                    ].map(opt => (
                      <label key={opt.value} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${civilityScore === Number(opt.value) ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        <RadioGroupItem value={opt.value} id={`civility-${opt.value}`} />
                        <span className="text-sm">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              {/* What did you learn? */}
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">
                  What&apos;s one thing you learned? <span className="text-slate-400 font-normal">(optional)</span>
                </Label>
                <Textarea
                  value={learnedText}
                  onChange={e => setLearnedText(e.target.value)}
                  placeholder="Share something you learned from this debate..."
                  rows={3}
                />
              </div>

              <Button
                onClick={submitSurvey}
                disabled={loading || understandingScore === 0 || civilityScore === 0}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Submit Survey
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ARCHIVE VIEW
  // ═══════════════════════════════════════════════════════════════════════

  if (view === 'archive') {
    const filtered = archiveConversations.filter(c =>
      c.topic.name.toLowerCase().includes(archiveSearch.toLowerCase())
    );

    return (
      <div className="min-h-screen bg-amber-50/30 flex flex-col">
        <NavBar />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-amber-900 tracking-tight mb-1">Conversation Archive</h1>
            <p className="text-slate-600">Learn from past debates between people who disagree</p>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={archiveSearch}
              onChange={e => setArchiveSearch(e.target.value)}
              placeholder="Search by topic name..."
              className="pl-9 bg-white"
            />
          </div>

          {filtered.length === 0 ? (
            <Card className="bg-white border-amber-200/60">
              <CardContent className="py-8 text-center">
                <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">
                  {archiveConversations.length === 0 ? 'No archived conversations yet.' : 'No conversations match your search.'}
                </p>
                <p className="text-sm text-slate-400">Completed debates will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filtered.map(conv => (
                <Card key={conv.id} className="bg-white border-amber-200/60">
                  <CardContent className="py-4">
                    <div
                      className="flex items-start justify-between gap-3 cursor-pointer"
                      onClick={() => setExpandedArchive(expandedArchive === conv.id ? null : conv.id)}
                    >
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-800">{conv.topic.name}</h3>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                            A: {conv.topic.optionA}
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                            B: {conv.topic.optionB}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-center">
                          <p className="text-xs text-slate-400">Understanding</p>
                          <p className="font-bold text-amber-600">{conv.understandingScore ?? '-'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-400">Civility</p>
                          <p className="font-bold text-emerald-600">{conv.civilityScore ?? '-'}</p>
                        </div>
                        {expandedArchive === conv.id ? (
                          <ChevronUp className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {expandedArchive === conv.id && (
                      <div className="mt-4 pt-4 border-t border-amber-100">
                        <ScrollArea className="max-h-96">
                          <div className="space-y-3 pr-4">
                            {conv.messages.map((msg, i) => (
                              <div
                                key={i}
                                className={`p-3 rounded-lg text-sm ${msg.sender === 'Person A' ? 'bg-amber-50 border border-amber-100' : 'bg-emerald-50 border border-emerald-100'}`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs font-medium ${msg.sender === 'Person A' ? 'text-amber-700' : 'text-emerald-700'}`}>
                                    {msg.sender}
                                  </span>
                                  <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                                    {getStepLabel(msg.step)}
                                  </Badge>
                                </div>
                                <p className="text-slate-700 whitespace-pre-wrap">{msg.content}</p>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>

                        {conv.keyEvidence.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-amber-100">
                            <p className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-1">
                              <BookOpen className="h-3 w-3" /> Key Evidence Used
                            </p>
                            <div className="space-y-1.5">
                              {conv.keyEvidence.map((ev, i) => (
                                <p key={i} className="text-xs text-slate-500 line-clamp-2">
                                  • {ev.content.substring(0, 150)}{ev.content.length > 150 ? '...' : ''}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
        <footer className="mt-auto border-t border-amber-100 bg-white/60 py-4 text-center text-xs text-slate-400">
          StorySwap &mdash; Where perspectives meet. Debate with empathy.
        </footer>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LEADERBOARD VIEW
  // ═══════════════════════════════════════════════════════════════════════

  if (view === 'leaderboard') {
    const userId = user?.id;

    return (
      <div className="min-h-screen bg-amber-50/30 flex flex-col">
        <NavBar />
        <main className="flex-1 max-w-2xl mx-auto px-4 py-6 w-full">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-amber-900 tracking-tight mb-1">Leaderboard</h1>
            <p className="text-slate-600">Top civil discourse participants</p>
          </div>

          {/* Podium for top 3 */}
          {leaderboardUsers.length >= 3 && (
            <div className="flex items-end justify-center gap-3 mb-8">
              {/* 2nd place */}
              <div className="text-center">
                <Avatar className="h-12 w-12 mx-auto mb-2 border-2 border-slate-300">
                  <AvatarFallback className="bg-slate-200 text-slate-700">
                    {leaderboardUsers[1].username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm font-medium text-slate-700">{leaderboardUsers[1].username}</p>
                <Badge className="bg-amber-500 text-white text-[10px] mt-1">Lv.{leaderboardUsers[1].level}</Badge>
                <p className="text-xs text-slate-500">{leaderboardUsers[1].points} pts</p>
                <div className="bg-slate-300 rounded-t-lg h-16 w-20 mx-auto mt-2 flex items-center justify-center">
                  <span className="text-xl font-bold text-slate-600">2</span>
                </div>
              </div>
              {/* 1st place */}
              <div className="text-center">
                <Star className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                <Avatar className="h-14 w-14 mx-auto mb-2 border-2 border-amber-400">
                  <AvatarFallback className="bg-amber-200 text-amber-800">
                    {leaderboardUsers[0].username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm font-bold text-amber-800">{leaderboardUsers[0].username}</p>
                <Badge className="bg-amber-500 text-white text-[10px] mt-1">Lv.{leaderboardUsers[0].level}</Badge>
                <p className="text-xs text-amber-600">{leaderboardUsers[0].points} pts</p>
                <div className="bg-amber-400 rounded-t-lg h-24 w-20 mx-auto mt-2 flex items-center justify-center">
                  <span className="text-2xl font-bold text-amber-900">1</span>
                </div>
              </div>
              {/* 3rd place */}
              <div className="text-center">
                <Avatar className="h-12 w-12 mx-auto mb-2 border-2 border-amber-700">
                  <AvatarFallback className="bg-amber-100 text-amber-800">
                    {leaderboardUsers[2].username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm font-medium text-slate-700">{leaderboardUsers[2].username}</p>
                <Badge className="bg-amber-500 text-white text-[10px] mt-1">Lv.{leaderboardUsers[2].level}</Badge>
                <p className="text-xs text-slate-500">{leaderboardUsers[2].points} pts</p>
                <div className="bg-amber-700 rounded-t-lg h-12 w-20 mx-auto mt-2 flex items-center justify-center">
                  <span className="text-xl font-bold text-amber-100">3</span>
                </div>
              </div>
            </div>
          )}

          {/* Full table */}
          {leaderboardUsers.length === 0 ? (
            <Card className="bg-white border-amber-200/60">
              <CardContent className="py-8 text-center">
                <Trophy className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No users on the leaderboard yet.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white border-amber-200/60">
              <CardContent className="p-0">
                <div className="divide-y divide-amber-100">
                  {leaderboardUsers.map((u, i) => (
                    <div
                      key={u.id}
                      className={`flex items-center gap-3 px-4 py-3 ${u.id === userId ? 'bg-amber-50' : ''}`}
                    >
                      <span className={`w-7 text-center font-bold text-sm ${i < 3 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {i + 1}
                      </span>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-amber-100 text-amber-800 text-xs">
                          {u.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-800 truncate">{u.username}{u.id === userId && <span className="text-amber-600 ml-1">(You)</span>}</p>
                          <Badge className="bg-amber-500 text-white text-[10px] h-4">Lv.{u.level}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>{u.debateCount} debates</span>
                          {u.streak > 0 && <span className="flex items-center gap-0.5"><Flame className="h-3 w-3 text-orange-400" />{u.streak}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {u.badgesCount > 0 && <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200"><Award className="h-3 w-3 mr-0.5" />{u.badgesCount}</Badge>}
                        <span className="text-sm font-semibold text-amber-700">{u.points}</span>
                        <span className="text-xs text-slate-400">pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </main>
        <footer className="mt-auto border-t border-amber-100 bg-white/60 py-4 text-center text-xs text-slate-400">
          StorySwap &mdash; Where perspectives meet. Debate with empathy.
        </footer>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PROFILE VIEW
  // ═══════════════════════════════════════════════════════════════════════

  if (view === 'profile') {
    const tierColors: Record<string, string> = {
      bronze: 'from-amber-600 to-amber-800',
      silver: 'from-slate-400 to-slate-600',
      gold: 'from-yellow-400 to-yellow-600',
      platinum: 'from-purple-400 to-purple-700',
    };
    const tierBorders: Record<string, string> = {
      bronze: 'border-amber-300',
      silver: 'border-slate-300',
      gold: 'border-yellow-400',
      platinum: 'border-purple-400',
    };
    const tierLabels: Record<string, string> = {
      bronze: '\u{1F9C9}',
      silver: '\u{1F9C8}',
      gold: '\u{1F947}',
      platinum: '\u{1F48E}',
    };
    const categoryIcons: Record<string, React.ReactNode> = {
      debate: <MessageSquare className="h-4 w-4" />,
      empathy: <Heart className="h-4 w-4" />,
      evidence: <BookOpen className="h-4 w-4" />,
      streak: <Flame className="h-4 w-4" />,
      social: <Users className="h-4 w-4" />,
    };

    return (
      <div className="min-h-screen bg-amber-50/30 flex flex-col">
        <NavBar />
        <main className="flex-1 max-w-3xl mx-auto px-4 py-6 w-full">
          {/* Profile Header */}
          <Card className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 border-amber-200/60 mb-6">
            <CardContent className="py-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-20 w-20 rounded-full bg-amber-200 flex items-center justify-center text-3xl font-bold text-amber-800 border-4 border-amber-300">
                  {userProfile?.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-800">{userProfile?.username}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-amber-500 text-white">
                      <Crown className="h-3 w-3 mr-1" /> Level {userProfile?.level || 1}
                    </Badge>
                    <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                      {userProfile?.levelTitle || 'Newcomer'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-amber-700 font-medium">{userProfile?.streak || 0} day streak</span>
                    <span className="text-slate-400 mx-1">&bull;</span>
                    <span className="text-sm text-slate-500">Joined {new Date(String(userProfile?.createdAt || '')).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-amber-700">{userProfile?.totalXP || 0}</p>
                  <p className="text-xs text-slate-500">Total XP</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={userProfile?.xpProgress || 0} className="h-4 flex-1" />
                <span className="text-sm text-amber-700 font-medium shrink-0">{userProfile?.currentLevelXP || 0}/100 XP</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{userProfile?.xpToNextLevel || 100} XP to level {((userProfile?.level || 1) + 1)}</p>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Points', value: userProfile?.points || 0, icon: <Star className="h-5 w-5" />, bg: 'bg-amber-50', text: 'text-amber-700' },
              { label: 'Level', value: userProfile?.level || 1, icon: <TrendingUp className="h-5 w-5" />, bg: 'bg-blue-50', text: 'text-blue-700' },
              { label: 'Debates', value: userProfile?.debateCount || 0, icon: <MessageSquare className="h-5 w-5" />, bg: 'bg-emerald-50', text: 'text-emerald-700' },
              { label: 'Day Streak', value: userProfile?.streak || 0, icon: <Flame className="h-5 w-5" />, bg: 'bg-orange-50', text: 'text-orange-700' },
              { label: 'Best Streak', value: userProfile?.longestStreak || 0, icon: <Crown className="h-5 w-5" />, bg: 'bg-yellow-50', text: 'text-yellow-700' },
              { label: 'Avg Civility', value: userProfile?.averageCivilityScore || 0, icon: <Handshake className="h-5 w-5" />, bg: 'bg-teal-50', text: 'text-teal-700' },
              { label: 'Topics Explored', value: userProfile?.topicsExplored || 0, icon: <Compass className="h-5 w-5" />, bg: 'bg-cyan-50', text: 'text-cyan-700' },
              { label: 'Words Written', value: userProfile?.totalWordsWritten?.toLocaleString() || '0', icon: <PenTool className="h-5 w-5" />, bg: 'bg-rose-50', text: 'text-rose-700' },
            ].map((stat, i) => (
              <Card key={i} className="bg-white border-amber-200/60">
                <CardContent className="py-3 px-4">
                  <div className={`${stat.text} mb-1`}>{stat.icon}</div>
                  <p className="text-xl font-bold text-slate-800">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Badges */}
          <Card className="bg-white border-amber-200/60 mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-amber-900 flex items-center gap-2">
                <Award className="h-5 w-5" /> Badges
                <Badge variant="outline" className="ml-auto text-xs">{userProfile?.badgesCount || 0}/{userProfile?.totalBadges || 20}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(userProfile?.badgeDetails || []).map(badge => (
                  <div
                    key={badge.name}
                    className={`p-3 rounded-xl border transition-colors ${
                      badge.earned
                        ? `${tierBorders[badge.tier]} bg-white`
                        : 'bg-slate-50 border-slate-200 opacity-40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${tierColors[badge.tier]} flex items-center justify-center text-white`}>
                        {tierLabels[badge.tier]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm font-semibold ${badge.earned ? 'text-slate-800' : 'text-slate-500'}`}>
                            {badge.name}
                          </h4>
                          {badge.earned && (
                            <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{badge.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 capitalize">{badge.tier}</Badge>
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                            {categoryIcons[badge.category]} {badge.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Debates */}
          <Card className="bg-white border-amber-200/60">
            <CardHeader>
              <CardTitle className="text-lg text-amber-900 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" /> Recent Debates
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(userProfile?.recentDebates?.length || 0) === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No completed debates yet. Start one!</p>
              ) : (
                <div className="space-y-3">
                  {(userProfile?.recentDebates || []).map(debate => (
                    <div key={debate.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50/50 border border-amber-100">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-medium text-slate-800 truncate">{debate.topicName}</h4>
                        <p className="text-xs text-slate-500 truncate">{debate.topicQuestion}</p>
                        <p className="text-xs text-slate-400 mt-1">{new Date(debate.completedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        {debate.understandingScore != null && (
                          <div className="text-center">
                            <p className="text-xs text-slate-400">Underst.</p>
                            <p className="font-bold text-amber-600">{debate.understandingScore}</p>
                          </div>
                        )}
                        {debate.civilityScore != null && (
                          <div className="text-center">
                            <p className="text-xs text-slate-400">Civility</p>
                            <p className="font-bold text-emerald-600">{debate.civilityScore}</p>
                          </div>
                        )}
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
        <footer className="mt-auto border-t border-amber-100 bg-white/60 py-4 text-center text-xs text-slate-400">
          StorySwap &mdash; Where perspectives meet. Debate with empathy.
        </footer>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FALLBACK
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-amber-50/30 flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-500 mb-4">Something went wrong.</p>
        <Button onClick={() => setView('landing')}>Go to Home</Button>
      </div>
    </div>
  );
}
