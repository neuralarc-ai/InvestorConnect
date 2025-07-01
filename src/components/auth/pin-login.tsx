"use client"

import { useState } from "react"
import { useAuth } from "@/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock } from "lucide-react"

export function PinLogin() {
  const [pin, setPin] = useState("")
  const [error, setError] = useState(false)
  const { login } = useAuth()

  const handleLogin = () => {
    if (!login(pin)) {
      setError(true)
      setTimeout(() => setError(false), 500)
    }
  }

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d{0,4}$/.test(value)) {
      setPin(value);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className={`w-full max-w-sm ${error ? "animate-shake" : ""}`}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">InvestorConnect</CardTitle>
          <CardDescription>Enter your 4-digit PIN to access the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="••••"
              value={pin}
              onChange={handlePinChange}
              maxLength={4}
              className="text-center text-2xl font-mono tracking-[1em]"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            <Button onClick={handleLogin} className="w-full" disabled={pin.length !== 4}>
              Unlock
            </Button>
          </div>
        </CardContent>
      </Card>
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}
