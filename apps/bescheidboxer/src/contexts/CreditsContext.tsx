import { createContext, useContext, useState, ReactNode } from 'react'
import { PlanType, UserCredits, canAskQuestion, canGenerateLetter, canScanBescheid, canPostInForum } from '@/lib/credits'

interface CreditsContextType {
  credits: UserCredits | null
  checkQuestion: () => { allowed: boolean; reason?: string }
  checkLetter: () => { allowed: boolean; reason?: string; cost: number }
  checkScan: () => { allowed: boolean; reason?: string }
  checkForum: () => { allowed: boolean; reason?: string }
  useQuestion: () => Promise<void>
  useLetter: () => Promise<void>
  useScan: () => Promise<void>
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined)

export function CreditsProvider({ children }: { children: ReactNode }) {
  const [credits, setCredits] = useState<UserCredits>({
    userId: 'demo',
    plan: 'schnupperer' as PlanType,
    creditsAktuell: 5,
    chatMessagesUsedToday: 0,
    lettersGeneratedThisMonth: 0,
    scansThisMonth: 0,
    periodStart: new Date(),
    periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  })

  const checkQuestion = () => canAskQuestion(credits)
  const checkLetter = () => canGenerateLetter(credits)
  const checkScan = () => canScanBescheid(credits)
  const checkForum = () => canPostInForum()

  const useQuestion = async () => {
    setCredits(prev => ({
      ...prev,
      chatMessagesUsedToday: prev.chatMessagesUsedToday + 1,
    }))
  }

  const useLetter = async () => {
    setCredits(prev => ({
      ...prev,
      lettersGeneratedThisMonth: prev.lettersGeneratedThisMonth + 1,
    }))
  }

  const useScan = async () => {
    setCredits(prev => ({
      ...prev,
      scansThisMonth: prev.scansThisMonth + 1,
    }))
  }

  return (
    <CreditsContext.Provider
      value={{
        credits,
        checkQuestion,
        checkLetter,
        checkScan,
        checkForum,
        useQuestion,
        useLetter,
        useScan,
      }}
    >
      {children}
    </CreditsContext.Provider>
  )
}

export function useCreditsContext() {
  const context = useContext(CreditsContext)
  if (context === undefined) {
    throw new Error('useCreditsContext must be used within a CreditsProvider')
  }
  return context
}
