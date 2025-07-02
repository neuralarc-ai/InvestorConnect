"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Lock, Mail, Key } from "lucide-react"

interface PinAuthProps {
  onSuccess: (email: string, pin: string) => void
  pitchDeckUrl?: string
}

export function PinAuth({ onSuccess, pitchDeckUrl }: PinAuthProps) {
  const [email, setEmail] = useState("")
  const [pin, setPin] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/test-pin?email=${encodeURIComponent(email)}&pin=${encodeURIComponent(pin)}`)
      const result = await response.json()

      if (result.success && result.isValid) {
        toast({
          title: "Access Granted",
          description: "Welcome to the pitch deck!"
        })
        onSuccess(email, pin)
      } else {
        setError(result.message || "Invalid PIN or email")
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: result.message || "Invalid credentials"
        })
      }
    } catch (error) {
      console.error("PIN validation error:", error)
      setError("Failed to validate PIN. Please try again.")
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to validate PIN. Please try again."
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold">Pitch Deck Access</CardTitle>
          <p className="text-muted-foreground">
            Enter your email and PIN to access the pitch deck
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center">
                <Mail className="mr-2 h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pin" className="flex items-center">
                <Key className="mr-2 h-4 w-4" />
                Access PIN
              </Label>
              <Input
                id="pin"
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter your 4-digit PIN"
                maxLength={4}
                pattern="[0-9]{4}"
                required
                disabled={isLoading}
                className="text-center text-lg font-mono tracking-widest"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !email || !pin}
            >
              {isLoading ? "Validating..." : "Access Pitch Deck"}
            </Button>
          </form>

          {pitchDeckUrl && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Need a PIN? Contact us at{" "}
                <a 
                  href={`mailto:dev@neuralarc.ai?subject=Pitch Deck Access Request&body=Hi, I would like access to the pitch deck.`}
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  dev@neuralarc.ai
                </a>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 