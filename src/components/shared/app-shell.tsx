"use client"

import { useAuth } from "@/providers/auth-provider"
import { PinLogin } from "@/components/auth/pin-login"
import { InvestorDashboard } from "@/components/investors/investor-dashboard"
import { InvestorProvider } from "@/providers/investor-provider"

export function AppShell() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      {isAuthenticated ? (
        <InvestorProvider>
          <InvestorDashboard />
        </InvestorProvider>
      ) : (
        <PinLogin />
      )}
    </div>
  )
}
