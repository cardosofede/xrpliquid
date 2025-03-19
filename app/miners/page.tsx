"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MetricsCard } from "@/components/metrics-card"
import { StatsChart } from "@/components/stats-chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChevronDown, Search, AlertCircle, X } from "lucide-react"

export default function MinersPage() {
  const [searchValue, setSearchValue] = useState<string>("david");
  const [displayedUser, setDisplayedUser] = useState<string>("david");
  const [transactionCount, setTransactionCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load user data based on the search value
  const loadUserData = async (userId: string) => {
    if (!userId.trim()) {
      setError("Please enter a user ID");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      // Use the dashboard stats API since it already works
      const response = await fetch(`/api/dashboard/stats?userId=${encodeURIComponent(userId)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Dashboard stats response:', data);
      
      // Set transaction count from the stats response
      setTransactionCount(data.stats?.transactionCount || 0);
      setDisplayedUser(userId);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while loading data');
    } finally {
      setLoading(false);
    }
  };

  // Handle search submit
  const handleViewClick = () => {
    loadUserData(searchValue);
  };

  // Handle key press in search input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleViewClick();
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchValue("");
  };

  // Clear displayed user
  const handleClearDisplayedUser = () => {
    setDisplayedUser("");
    setTransactionCount(0);
  };

  // Initial data load
  useEffect(() => {
    loadUserData(searchValue);
  }, []);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Miner Details</h1>
          {displayedUser && (
            <div className="flex items-center gap-2 mt-1">
              <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-sm flex items-center gap-1">
                {displayedUser}
                <button 
                  onClick={handleClearDisplayedUser} 
                  className="ml-1 text-slate-500 hover:text-slate-700 focus:outline-none"
                  aria-label="Clear displayed user"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search user ID..." 
              className="pl-8" 
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyUp={handleKeyPress}
            />
            {searchValue && (
              <button 
                className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground focus:outline-none"
                onClick={handleClearSearch}
                aria-label="Clear search input"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button 
            variant="default" 
            onClick={handleViewClick}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'View'}
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 border border-red-200 rounded-md bg-red-50 text-red-700 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-3">
        <MetricsCard
          title="Total Transactions"
          value={transactionCount.toString()}
        />
        <MetricsCard
          title="Total Volume"
          value="$0"
        />
        <MetricsCard
          title="Current Score"
          value="0"
        />
      </div>
      
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="bg-background p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold">Trading History</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="rounded-full">Today</Button>
              <Button variant="outline" size="sm" className="rounded-full">Last week</Button>
              <Button variant="outline" size="sm" className="rounded-full">Last month</Button>
              <Button variant="outline" size="sm" className="rounded-full">All time</Button>
            </div>
          </div>
          <StatsChart className="h-64" />
        </Card>
        
        <Card className="bg-background">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">Active Open Orders</h2>
          </div>
          <div className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">No active orders found</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
      
      <div className="mt-6">
        <Card className="bg-background">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">Order History</h2>
          </div>
          <div className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Completed At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">ORD-{Math.floor(Math.random() * 10000)}</TableCell>
                    <TableCell>XRP/RLUSD</TableCell>
                    <TableCell>${(Math.random() * 1000 + 100).toFixed(2)}</TableCell>
                    <TableCell>{i % 2 === 0 ? "Buy" : "Sell"}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${i % 3 === 0 ? "bg-green-500/20 text-green-500" : i % 3 === 1 ? "bg-red-500/20 text-red-500" : "bg-yellow-500/20 text-yellow-500"}`}>
                        {i % 3 === 0 ? "Completed" : i % 3 === 1 ? "Cancelled" : "Partial"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{new Date(Date.now() - i * 86400000).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                disabled
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  )
} 