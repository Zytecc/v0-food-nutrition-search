"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"
import { createClientSide } from "@/lib/supabase"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signUp: (
    email: string,
    password: string,
  ) => Promise<{
    error: any | null
    data: any | null
  }>
  signIn: (
    email: string,
    password: string,
  ) => Promise<{
    error: any | null
    data: any | null
  }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientSide()

  useEffect(() => {
    // Set up the auth state listener
    const setupAuthListener = async () => {
      setIsLoading(true)

      // Get the initial session
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession()

      if (initialSession) {
        setSession(initialSession)
        setUser(initialSession.user)
      }

      // Set up the auth state change listener
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        // Force a router refresh when auth state changes
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          router.refresh()
        }

        if (event === "SIGNED_OUT") {
          router.push("/auth/login")
        }
      })

      setIsLoading(false)

      // Clean up the listener when the component unmounts
      return () => {
        subscription.unsubscribe()
      }
    }

    setupAuthListener()
  }, [router, supabase.auth])

  const signUp = async (email: string, password: string) => {
    const response = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return response
  }

  const signIn = async (email: string, password: string) => {
    const response = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (response.data.session) {
      // Force a router refresh after successful sign-in
      router.refresh()
    }

    return response
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const value = {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
