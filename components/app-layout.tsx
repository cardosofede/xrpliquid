"use client"

import { AppSidebar } from "@/components/app-sidebar"

export function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid grid-cols-[auto_1fr]">
        <AppSidebar />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
} 