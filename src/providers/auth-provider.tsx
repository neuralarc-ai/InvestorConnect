"use client"

import React, { createContext, useContext, useState, type ReactNode } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useToast } from "@/hooks/use-toast"

const CORRECT_PIN = "1111"

interface AuthContextType {
  isAuthenticated: boolean
  login: (pin: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage<boolean>("investor-connect-auth", false)
  const { toast } = useToast()

  const login = (pin: string) => {
    if (pin === CORRECT_PIN) {
      setIsAuthenticated(true)
      toast({ title: "Login Successful", description: "Welcome to 86F." })
      return true
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "The PIN you entered is incorrect.",
      })
      return false
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
