"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MetricsCard } from "@/components/metrics-card"
import { StatsChart } from "@/components/stats-chart"
import { VaultTable } from "@/components/vault-table"
import { ChevronDown } from "lucide-react"
import { DEFAULTS } from "@/lib/config"

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState({
    minDate: new Date(),
    maxDate: new Date(),
    transactionCount: 0
  });
  const [stats, setStats] = useState({
    userCount: 0, 
    walletCount: 0,
    transactionCount: 0,
    totalVolume: 0,
    assetVolumes: {}
  });
  const [loading, setLoading] = useState(true);

  // Fetch data on component mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch transaction date range
        try {
          const response = await fetch('/api/transactions/date-range');
          if (response.ok) {
            const data = await response.json();
            setDateRange({
              minDate: data.minDate ? new Date(data.minDate) : new Date(),
              maxDate: data.maxDate ? new Date(data.maxDate) : new Date(),
              transactionCount: data.transactionCount || 0
            });
          }
        } catch (error) {
          console.error('Error fetching transaction date range:', error);
        }
        
        // Fetch dashboard stats
        try {
          const response = await fetch('/api/dashboard/stats');
          if (response.ok) {
            const data = await response.json();
            setStats(data.stats || {
              userCount: 0,
              walletCount: 0,
              transactionCount: 0,
              totalVolume: 0,
              assetVolumes: {}
            });
          }
        } catch (error) {
          console.error('Error fetching dashboard stats:', error);
        }
        
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  function formatDateRange(minDate: Date, maxDate: Date) {
    // Check if dates are valid
    if (!(minDate instanceof Date) || !(maxDate instanceof Date) || 
        isNaN(minDate.getTime()) || isNaN(maxDate.getTime())) {
      return 'Invalid date range';
    }
    
    // Check if min and max dates are the same
    const sameDay = minDate.getDate() === maxDate.getDate() && 
                    minDate.getMonth() === maxDate.getMonth() && 
                    minDate.getFullYear() === maxDate.getFullYear();
    
    if (sameDay) {
      return minDate.toLocaleDateString('en-US', DEFAULTS.DATE_FORMAT_OPTIONS);
    } else {
      // Different formatting based on whether years are the same
      const sameYear = minDate.getFullYear() === maxDate.getFullYear();
      
      if (sameYear) {
        // Same year, show full first date but only month and day for second date
        const firstDate = minDate.toLocaleDateString('en-US', DEFAULTS.DATE_FORMAT_OPTIONS);
        const secondDate = maxDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
        return `${firstDate} - ${secondDate}, ${maxDate.getFullYear()}`;
      } else {
        // Different years, show full dates for both
        return `${minDate.toLocaleDateString('en-US', DEFAULTS.DATE_FORMAT_OPTIONS)} - ${maxDate.toLocaleDateString('en-US', DEFAULTS.DATE_FORMAT_OPTIONS)}`;
      }
    }
  }

  function formatNumber(num: number): string {
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1) + 'M'
    } else if (num >= 1_000) {
      return (num / 1_000).toFixed(1) + 'K'
    } else {
      return num.toString()
    }
  }

  const dateRangeText = formatDateRange(dateRange.minDate, dateRange.maxDate);
  
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">{loading ? 'Loading...' : dateRangeText}</p>
        </div>
        <Button variant="outline" className="gap-2">
          XRPL Network
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-4">
        <MetricsCard
          title="Users"
          value={loading ? '...' : formatNumber(stats.userCount)}
        />
        <MetricsCard
          title="Wallets"
          value={loading ? '...' : formatNumber(stats.walletCount)}
        />
        <MetricsCard
          title="Transactions"
          value={loading ? '...' : formatNumber(stats.transactionCount)}
        />
        <MetricsCard
          title="Volume (RLUSD)"
          value={loading ? '...' : `${formatNumber(stats.totalVolume)}`}
        />
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card className="p-6 bg-background">
          <div className="mb-4">
            <h2 className="text-xl font-bold">Trading Volume (RLUSD)</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="rounded-full">Today</Button>
              <Button variant="outline" size="sm" className="rounded-full">Last week</Button>
              <Button variant="outline" size="sm" className="rounded-full">Last month</Button>
              <Button variant="outline" size="sm" className="rounded-full">Last 6 month</Button>
              <Button variant="outline" size="sm" className="rounded-full">Year</Button>
            </div>
          </div>
          <StatsChart className="h-64" />
        </Card>
        <Card className="p-6 bg-background">
          <div className="mb-4">
            <h2 className="text-xl font-bold">Transaction Count</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="rounded-full">Today</Button>
              <Button variant="outline" size="sm" className="rounded-full">Last week</Button>
              <Button variant="outline" size="sm" className="rounded-full">Last month</Button>
              <Button variant="outline" size="sm" className="rounded-full">Last 6 month</Button>
              <Button variant="outline" size="sm" className="rounded-full">Year</Button>
            </div>
          </div>
          <StatsChart className="h-64" />
        </Card>
        <Card className="col-span-full p-6 bg-background">
          <div className="mb-6">
            <h2 className="text-xl font-bold">Latest Transactions</h2>
          </div>
          <VaultTable />
        </Card>
      </div>
    </>
  )
} 