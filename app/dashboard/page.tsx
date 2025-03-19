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
    const response = await fetch(`${API.BASE_URL}/api/transactions/date-range`, {
      next: { revalidate: API.REVALIDATION_TIME }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch transaction date range')
    }
    
    const data = await response.json()
    return {
      minDate: new Date(data.minDate),
      maxDate: new Date(data.maxDate),
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
    const response = await fetch(`${API.BASE_URL}/api/dashboard/stats`, {
      next: { revalidate: API.REVALIDATION_TIME }
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
  return `${minDate.toLocaleDateString('en-US', DEFAULTS.DATE_FORMAT_OPTIONS)} - ${maxDate.toLocaleDateString('en-US', DEFAULTS.DATE_FORMAT_OPTIONS)}`
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