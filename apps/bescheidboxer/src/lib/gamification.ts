// BescheidBoxer Gamification System

export type BoxerLevel = 'anfaenger' | 'kaempfer' | 'profi' | 'experte' | 'legende'

export interface BoxerLevelInfo {
  id: BoxerLevel
  name: string
  minPoints: number
  icon: string
  cssClass: string
  description: string
}

export const BOXER_LEVELS: BoxerLevelInfo[] = [
  {
    id: 'anfaenger',
    name: 'Anfaenger',
    minPoints: 0,
    icon: '🥊',
    cssClass: 'level-anfaenger',
    description: 'Willkommen im Ring! Du lernst gerade deine Rechte kennen.',
  },
  {
    id: 'kaempfer',
    name: 'Kaempfer',
    minPoints: 100,
    icon: '💪',
    cssClass: 'level-kaempfer',
    description: 'Du wehrst dich! Erste Widersprueche sind raus.',
  },
  {
    id: 'profi',
    name: 'Profi',
    minPoints: 500,
    icon: '🏆',
    cssClass: 'level-profi',
    description: 'Du kennst deine Rechte und setzt sie durch!',
  },
  {
    id: 'experte',
    name: 'Experte',
    minPoints: 1500,
    icon: '⚡',
    cssClass: 'level-experte',
    description: 'Jobcenter-Sachbearbeiter nehmen dich ernst!',
  },
  {
    id: 'legende',
    name: 'Legende',
    minPoints: 5000,
    icon: '👑',
    cssClass: 'level-legende',
    description: 'Du bist eine Inspiration fuer andere Betroffene!',
  },
]

export interface BoxerBadge {
  id: string
  name: string
  description: string
  icon: string
  points: number
}

export const BADGES: BoxerBadge[] = [
  { id: 'erster_scan', name: 'Erster Scan', description: 'Ersten Bescheid gescannt', icon: '🔍', points: 10 },
  { id: 'erster_widerspruch', name: 'Erster Widerspruch', description: 'Ersten Widerspruch erstellt', icon: '✊', points: 25 },
  { id: 'forum_held', name: 'Forum-Held', description: '10 Forum-Beitraege geschrieben', icon: '💬', points: 50 },
  { id: 'rechte_kenner', name: 'Rechte-Kenner', description: '20 KI-Fragen gestellt', icon: '📚', points: 30 },
  { id: 'geld_zurueck', name: 'Geld zurueck!', description: 'Nachzahlung durch Widerspruch erhalten', icon: '💰', points: 100 },
  { id: 'helfer', name: 'Helfer', description: 'Beitrag als "Beste Antwort" markiert', icon: '🤝', points: 40 },
  { id: 'scanner_pro', name: 'Scanner-Profi', description: '5 Bescheide gescannt', icon: '📋', points: 50 },
  { id: 'community_star', name: 'Community-Star', description: '50 Upvotes im Forum', icon: '⭐', points: 75 },
  { id: 'dokumenten_meister', name: 'Dokumenten-Meister', description: '10 Schreiben erstellt', icon: '📝', points: 100 },
  { id: 'empfehler', name: 'Empfehler', description: 'Einen Freund eingeladen', icon: '📢', points: 50 },
]

export const POINTS_CONFIG = {
  chatQuestion: 5,
  bescheidScan: 15,
  letterGenerated: 20,
  forumPost: 10,
  forumReply: 5,
  forumUpvoteReceived: 2,
  profileComplete: 25,
  firstLogin: 10,
  dailyLogin: 3,
  referral: 50,
}

export function getLevelForPoints(points: number): BoxerLevelInfo {
  const sorted = [...BOXER_LEVELS].sort((a, b) => b.minPoints - a.minPoints)
  return sorted.find(l => points >= l.minPoints) || BOXER_LEVELS[0]
}

export function getNextLevel(points: number): BoxerLevelInfo | null {
  const sorted = [...BOXER_LEVELS].sort((a, b) => a.minPoints - b.minPoints)
  return sorted.find(l => l.minPoints > points) || null
}

export function getProgressToNextLevel(points: number): number {
  const current = getLevelForPoints(points)
  const next = getNextLevel(points)
  if (!next) return 100
  const range = next.minPoints - current.minPoints
  const progress = points - current.minPoints
  return Math.min(100, Math.round((progress / range) * 100))
}

export interface UserStats {
  totalPoints: number
  totalScans: number
  totalLetters: number
  totalForumPosts: number
  totalChatQuestions: number
  moneyRecovered: number
  badges: string[]
  level: BoxerLevel
  memberSince: string
}

export function calculateEstimatedRecovery(errors: { betrag?: number }[]): {
  monthly: number
  sixMonths: number
  yearly: number
} {
  const monthly = errors.reduce((sum, e) => sum + (e.betrag || 0), 0)
  return {
    monthly,
    sixMonths: monthly * 6,
    yearly: monthly * 12,
  }
}
