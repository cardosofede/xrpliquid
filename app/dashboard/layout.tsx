"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Medal, User, Wallet, Activity } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-border bg-background">
          <div className="flex h-16 items-center gap-2 border-b border-border px-6">
            <Wallet className="h-6 w-6" />
            <span className="font-bold">XRPLiquid</span>
          </div>
          <div className="px-4 py-4">
            <Input placeholder="Search" className="bg-secondary/50" />
          </div>
          <nav className="space-y-2 px-2">
            <Button 
              variant={pathname.includes("/dashboard") ? "default" : "ghost"} 
              className="w-full justify-start gap-2"
              asChild
            >
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button 
              variant={pathname.includes("/leaderboard") ? "default" : "ghost"} 
              className="w-full justify-start gap-2"
              asChild
            >
              <Link href="/leaderboard">
                <Medal className="h-4 w-4" />
                Leaderboard
              </Link>
            </Button>
            <Button 
              variant={pathname.includes("/miners") ? "default" : "ghost"} 
              className="w-full justify-start gap-2"
              asChild
            >
              <Link href="/miners">
                <User className="h-4 w-4" />
                Miners
              </Link>
            </Button>
            <Button 
              variant={pathname.includes("/health") ? "default" : "ghost"} 
              className="w-full justify-start gap-2"
              asChild
            >
              <Link href="/health">
                <Activity className="h-4 w-4" />
                Health
              </Link>
            </Button>
          </nav>
        </aside>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
} 