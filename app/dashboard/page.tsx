// Force dynamic rendering to avoid stale data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MetricsCard } from "@/components/metrics-card"
import { StatsChart } from "@/components/stats-chart"
import { VaultTable } from "@/components/vault-table"
import { ChevronDown } from "lucide-react"
import { API, DEFAULTS } from "@/lib/config"

// Function to fetch transaction date range
async function getTransactionDateRange() {
  try {
    console.log('API Request: GET /api/transactions/date-range');
    
    // Use absolute URL format for server components
    const url = new URL('/api/transactions/date-range', 'http://localhost:3000');
    url.searchParams.append('t', Date.now().toString());
    
    const response = await fetch(url, {
      next: { revalidate: 0 }, // Disable caching
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch transaction date range')
    }
    
    const data = await response.json()
    console.log('Transaction date range API response:', data);
    
    // Create proper Date objects from ISO strings
    const minDate = data.minDate ? new Date(data.minDate) : new Date();
    const maxDate = data.maxDate ? new Date(data.maxDate) : new Date();
    
    console.log('Parsed date objects:', { 
      minDateStr: data.minDate,
      minDateObj: minDate,
      minDateIso: minDate.toISOString(),
      maxDateStr: data.maxDate,
      maxDateObj: maxDate,
      maxDateIso: maxDate.toISOString()
    });
    
    return {
      minDate,
      maxDate,
      transactionCount: data.transactionCount || 0
    }
  } catch (error) {
    console.error('Error fetching transaction date range:', error)
    // Return default dates in case of error
    return {
      minDate: new Date(),
      maxDate: new Date(),
      transactionCount: 0
    }
  }
}

// Function to fetch dashboard statistics
async function getDashboardStats() {
  try {
    console.log('API Request: GET /api/dashboard/stats');
    
    // Use absolute URL format for server components
    const url = new URL('/api/dashboard/stats', 'http://localhost:3000');
    url.searchParams.append('t', Date.now().toString());
    
    const response = await fetch(url, {
      next: { revalidate: 0 }, // Disable caching
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard statistics')
    }
    
    const data = await response.json()
    return data.stats
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error)
    // Return default stats in case of error
    return {
      userCount: 0,
      walletCount: 0,
      transactionCount: 0,
      totalVolume: 0,
      assetVolumes: {}
    }
  }
}

function formatDateRange(minDate: Date, maxDate: Date) {
  console.log('Formatting date range', { 
    minDate, 
    maxDate, 
    minDateType: typeof minDate,
    maxDateType: typeof maxDate,
    minDateIsValid: minDate instanceof Date && !isNaN(minDate.getTime()),
    maxDateIsValid: maxDate instanceof Date && !isNaN(maxDate.getTime()),
  });

  // Check if dates are valid
  if (!(minDate instanceof Date) || !(maxDate instanceof Date) || 
      isNaN(minDate.getTime()) || isNaN(maxDate.getTime())) {
    console.error('Invalid date objects received:', { minDate, maxDate });
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

export default async function DashboardPage() {
  const { minDate, maxDate, transactionCount: dateRangeTransactionCount } = await getTransactionDateRange()
  const dateRangeText = formatDateRange(minDate, maxDate)
  
  const { userCount, walletCount, transactionCount, totalVolume, assetVolumes } = await getDashboardStats()
  
  // Calculate changes (typically would compare to previous period)
  // These are placeholder calculations - in a real app you'd fetch historical data for comparison
  const userChange = {
    value: formatNumber(Math.floor(userCount * 0.05)),
    percentage: "+5%",
    isPositive: true
  }
  
  const walletChange = {
    value: formatNumber(Math.floor(walletCount * 0.08)),
    percentage: "+8%",
    isPositive: true
  }
  
  const transactionChange = {
    value: formatNumber(Math.floor(transactionCount * 0.12)),
    percentage: "+12%",
    isPositive: true
  }
  
  // Debug info for date troubleshooting
  const debugInfo = {
    minDate: minDate instanceof Date ? minDate.toISOString() : 'Not a Date',
    maxDate: maxDate instanceof Date ? maxDate.toISOString() : 'Not a Date',
    minDateObj: {
      day: minDate.getDate(),
      month: minDate.getMonth() + 1,
      year: minDate.getFullYear(),
      time: minDate.toTimeString()
    },
    maxDateObj: {
      day: maxDate.getDate(),
      month: maxDate.getMonth() + 1,
      year: maxDate.getFullYear(),
      time: maxDate.toTimeString()
    },
    dateRangeText,
    areSameDates: minDate.getTime() === maxDate.getTime(),
    areSameDays: minDate.getDate() === maxDate.getDate() && 
                minDate.getMonth() === maxDate.getMonth() && 
                minDate.getFullYear() === maxDate.getFullYear(),
    userCount,
    walletCount,
    transactionCount
  }
  
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">{dateRangeText}</p>
        </div>
        <Button variant="outline" className="gap-2">
          XRPL Network
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Debug info - remove in production */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="mb-6 p-4 bg-black/10 rounded-md text-xs overflow-auto max-h-48">
          <h3 className="font-bold mb-2">Debug Info:</h3>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-3">
        <MetricsCard
          title="Users"
          value={formatNumber(userCount)}
          change={userChange}
        />
        <MetricsCard
          title="Wallets"
          value={formatNumber(walletCount)}
          change={walletChange}
        />
        <MetricsCard
          title="Transactions"
          value={formatNumber(transactionCount)}
          change={transactionChange}
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
            <h2 className="text-xl font-bold">Total Volume by Asset</h2>
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
      </div>
      <div className="mt-6">
        <Card className="bg-background">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">Asset Trading Statistics</h2>
          </div>
          <VaultTable />
        </Card>
      </div>
    </>
  )
} 