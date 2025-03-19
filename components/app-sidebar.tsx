"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Medal, User, Wallet, Activity, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function AppSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={cn(
      "border-r border-border bg-background relative transition-all duration-300",
      collapsed ? "w-[80px]" : "w-[280px]"
    )}>
      <div className="absolute -right-4 top-20 z-10">
        <Button 
          size="sm" 
          variant="secondary" 
          className="rounded-full h-8 w-8 p-0" 
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <Wallet className="h-6 w-6" />
        {!collapsed && <span className="font-bold">XRPLiquid</span>}
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