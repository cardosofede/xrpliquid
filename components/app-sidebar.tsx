"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Medal, User, Wallet, Activity, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function AppSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration error by only rendering dynamic content after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render anything until client-side to avoid hydration mismatch
  if (!mounted) {
    return (
      <aside className="border-r border-border bg-background relative w-[280px] transition-all duration-300">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <Wallet className="h-6 w-6" />
          <span className="font-bold">XRPLiquid</span>
        </div>
        <nav className="space-y-2 px-2 py-4">
          <Button variant={pathname.includes("/dashboard") ? "default" : "ghost"} className="w-full justify-start gap-2" asChild>
            <Link href="/dashboard"><LayoutDashboard className="h-4 w-4" />Dashboard</Link>
          </Button>
          <Button variant={pathname.includes("/leaderboard") ? "default" : "ghost"} className="w-full justify-start gap-2" asChild>
            <Link href="/leaderboard"><Medal className="h-4 w-4" />Leaderboard</Link>
          </Button>
          <Button variant={pathname.includes("/miners") ? "default" : "ghost"} className="w-full justify-start gap-2" asChild>
            <Link href="/miners"><User className="h-4 w-4" />Miners</Link>
          </Button>
          <Button variant={pathname.includes("/health") ? "default" : "ghost"} className="w-full justify-start gap-2" asChild>
            <Link href="/health"><Activity className="h-4 w-4" />Health</Link>
          </Button>
        </nav>
      </aside>
    )
  }

  return (
    <aside className={cn(
      "border-r border-border bg-background relative transition-all duration-300",
      collapsed ? "w-[80px]" : "w-[280px]"
    )}>
      <div className="flex h-16 items-center gap-2 border-b border-border px-6 relative">
        <Wallet className="h-6 w-6" />
        {!collapsed && <span className="font-bold">XRPLiquid</span>}
        
        <div className="absolute -right-3 flex items-center h-full">
          <Button 
            size="sm" 
            variant="secondary" 
            className="h-7 w-7 p-0 rounded-l-none rounded-r-md" 
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <nav className={cn("space-y-2 px-2 py-4", collapsed && "flex flex-col items-center")}>
        <Button 
          variant={pathname.includes("/dashboard") ? "default" : "ghost"} 
          className={cn("justify-start gap-2", collapsed ? "w-auto px-2" : "w-full")}
          asChild
        >
          <Link href="/dashboard">
            <LayoutDashboard className="h-4 w-4" />
            {!collapsed && "Dashboard"}
          </Link>
        </Button>
        <Button 
          variant={pathname.includes("/leaderboard") ? "default" : "ghost"} 
          className={cn("justify-start gap-2", collapsed ? "w-auto px-2" : "w-full")}
          asChild
        >
          <Link href="/leaderboard">
            <Medal className="h-4 w-4" />
            {!collapsed && "Leaderboard"}
          </Link>
        </Button>
        <Button 
          variant={pathname.includes("/miners") ? "default" : "ghost"} 
          className={cn("justify-start gap-2", collapsed ? "w-auto px-2" : "w-full")}
          asChild
        >
          <Link href="/miners">
            <User className="h-4 w-4" />
            {!collapsed && "Miners"}
          </Link>
        </Button>
        <Button 
          variant={pathname.includes("/health") ? "default" : "ghost"} 
          className={cn("justify-start gap-2", collapsed ? "w-auto px-2" : "w-full")}
          asChild
        >
          <Link href="/health">
            <Activity className="h-4 w-4" />
            {!collapsed && "Health"}
          </Link>
        </Button>
      </nav>
    </aside>
  )
} 