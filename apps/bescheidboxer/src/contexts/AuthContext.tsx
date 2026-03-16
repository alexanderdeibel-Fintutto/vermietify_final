import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { PlanType } from '@/lib/credits'

interface UserProfile {
  id: string
  email: string
  name: string | null
  plan: PlanType
  chatMessagesUsedToday: number
  lettersGeneratedThisMonth: number
  scansThisMonth: number
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name?: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ---------------------------------------------------------------------------
// Demo auth (localStorage-based, works without Supabase backend)
// ---------------------------------------------------------------------------

const DEMO_USERS_KEY = 'bescheidboxer_demo_users'
const DEMO_SESSION_KEY = 'bescheidboxer_demo_session'

interface DemoUser {
  id: string
  email: string
  name: string | null
  password: string
  plan: PlanType
  createdAt: string
}

function getDemoUsers(): DemoUser[] {
  try {
    return JSON.parse(localStorage.getItem(DEMO_USERS_KEY) || '[]')
  } catch { return [] }
}

function saveDemoUsers(users: DemoUser[]) {
  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users))
}

function getDemoSession(): DemoUser | null {
  try {
    const raw = localStorage.getItem(DEMO_SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveDemoSession(user: DemoUser | null) {
  if (user) {
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(DEMO_SESSION_KEY)
  }
}

function generateId(): string {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// True when a real Supabase anon key is provided via env
const hasRealSupabase = !!(
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !String(import.meta.env.VITE_SUPABASE_ANON_KEY).includes('placeholder')
)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hasRealSupabase) {
      // Demo mode: restore session from localStorage
      const saved = getDemoSession()
      if (saved) {
        setUser({ id: saved.id, email: saved.email } as User)
        setProfile({
          id: saved.id,
          email: saved.email,
          name: saved.name,
          plan: saved.plan,
          chatMessagesUsedToday: 0,
          lettersGeneratedThisMonth: 0,
          scansThisMonth: 0,
        })
      }
      setLoading(false)
      return
    }

    // Real Supabase mode
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('amt_users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      setProfile({
        id: userId,
        email: user?.email || '',
        name: null,
        plan: 'schnupperer',
        chatMessagesUsedToday: 0,
        lettersGeneratedThisMonth: 0,
        scansThisMonth: 0,
      })
      return
    }

    if (data) {
      setProfile({
        id: data.id,
        email: data.email,
        name: data.name,
        plan: data.plan || 'schnupperer',
        chatMessagesUsedToday: data.chat_messages_used_today || 0,
        lettersGeneratedThisMonth: data.letters_generated_this_month || 0,
        scansThisMonth: data.scans_this_month || 0,
      })
    }
  }

  const refreshProfile = async () => {
    if (!hasRealSupabase) return
    if (user) {
      await fetchProfile(user.id)
    }
  }

  // ---- signIn ----
  const signIn = async (email: string, password: string) => {
    if (!hasRealSupabase) {
      const users = getDemoUsers()
      const found = users.find(u => u.email === email && u.password === password)
      if (!found) throw new Error('E-Mail oder Passwort falsch.')
      setUser({ id: found.id, email: found.email } as User)
      setProfile({
        id: found.id,
        email: found.email,
        name: found.name,
        plan: found.plan,
        chatMessagesUsedToday: 0,
        lettersGeneratedThisMonth: 0,
        scansThisMonth: 0,
      })
      saveDemoSession(found)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  // ---- signUp ----
  const signUp = async (email: string, password: string, name?: string) => {
    if (!hasRealSupabase) {
      const users = getDemoUsers()
      if (users.find(u => u.email === email)) {
        throw new Error('Diese E-Mail ist bereits registriert.')
      }
      const newUser: DemoUser = {
        id: generateId(),
        email,
        name: name || null,
        password,
        plan: 'schnupperer',
        createdAt: new Date().toISOString(),
      }
      users.push(newUser)
      saveDemoUsers(users)
      setUser({ id: newUser.id, email: newUser.email } as User)
      setProfile({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        plan: 'schnupperer',
        chatMessagesUsedToday: 0,
        lettersGeneratedThisMonth: 0,
        scansThisMonth: 0,
      })
      saveDemoSession(newUser)
      return
    }

    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    if (data.user) {
      await supabase.from('amt_users').insert({
        id: data.user.id,
        email,
        name: name || null,
        plan: 'schnupperer',
        chat_messages_used_today: 0,
        letters_generated_this_month: 0,
        scans_this_month: 0,
      })
    }
  }

  // ---- signOut ----
  const signOut = async () => {
    if (!hasRealSupabase) {
      setUser(null)
      setProfile(null)
      saveDemoSession(null)
      return
    }

    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setProfile(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
