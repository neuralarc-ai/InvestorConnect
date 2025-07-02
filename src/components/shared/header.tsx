"use client"

import { useAuth } from "@/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { LogOut, Rocket, Search, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { AddInvestorDialog } from "@/components/investors/add-investor-dialog"
import { useState } from "react"
import { AddInvestorDialog } from "@/components/investors/add-investor-dialog"

interface HeaderProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
}

export function Header({ searchQuery, setSearchQuery }: HeaderProps) {
  const { logout } = useAuth()
  const [isAddInvestorOpen, setIsAddInvestorOpen] = useState(false)

  return (
    <>
      <header className="sticky w-full max-w-[1440px] mx-auto overflow-visible top-0 z-30 flex h-fit items-center justify-between gap-4  bg-transparent bg-card">
        <div className="container flex h-14 items-center justify-center">
          <div className="flex items-center mr-8">
            <Rocket className="mr-2 h-6 w-6" />
            <span className="font-headline text-lg font-bold">InvestorConnect</span>
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search companies or contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg bg-background pl-8"
            />
          </div>
          <div className="flex items-center space-x-2 ml-8">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsAddInvestorOpen(true)}
              aria-label="Add investor"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={logout} aria-label="Log out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      
      <AddInvestorDialog 
        isOpen={isAddInvestorOpen} 
        onClose={() => setIsAddInvestorOpen(false)} 
      />
    </>
  )
}
