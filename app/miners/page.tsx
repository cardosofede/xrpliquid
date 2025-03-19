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
import { ChevronDown, Search, AlertCircle, X, Loader2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TRADING_PAIRS } from "@/lib/trading-config"

// Order interface matching the processed orders from the API
interface Order {
  orderId: string;
  account: string;
  pair: string;
  side: "BUY" | "SELL" | "UNKNOWN";
  originalAmount: string;
  price: string;
  amount: string;
  filledAmount: string | null;
  status: string;
  date: string;
  rawData: any;
}

// Pagination interface
interface Pagination {
  page: number;
  limit: number;
  totalPages: number;
  totalCount: number;
}

export default function MinersPage() {
  const [searchValue, setSearchValue] = useState<string>("david");
  const [displayedUser, setDisplayedUser] = useState<string>("david");
  const [transactionCount, setTransactionCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Order history state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersPagination, setOrdersPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalCount: 0
  });
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [selectedPair, setSelectedPair] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedSide, setSelectedSide] = useState<string>("ALL");

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
      
      // Load order history for this user
      loadOrderHistory(userId);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while loading data');
    } finally {
      setLoading(false);
    }
  };
  
  // Load order history for the given user
  const loadOrderHistory = async (
    userId: string, 
    page: number = 1, 
    tradingPair: string = "ALL",
    status: string = "ALL",
    side: string = "ALL"
  ) => {
    setOrdersLoading(true);
    setOrdersError(null);
    
    try {
      let url = `/api/miners/orders?userId=${encodeURIComponent(userId)}&page=${page}&limit=10`;
      
      // Add trading pair filter if not ALL
      if (tradingPair !== "ALL") {
        url += `&tradingPair=${encodeURIComponent(tradingPair)}`;
      }
      
      // Add status filter if not ALL
      if (status !== "ALL") {
        url += `&status=${encodeURIComponent(status)}`;
      }
      
      // Add side filter if not ALL
      if (side !== "ALL") {
        url += `&side=${encodeURIComponent(side)}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to load order history: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Order history response:', data);
      
      if (data.success) {
        setOrders(data.data || []);
        setOrdersPagination(data.pagination || {
          page: 1,
          limit: 10,
          totalPages: 1,
          totalCount: 0
        });
      } else {
        throw new Error(data.error || 'Failed to load order history');
      }
    } catch (error) {
      console.error('Error fetching order history:', error);
      setOrdersError(error instanceof Error ? error.message : 'An error occurred while loading order history');
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };
  
  // Handle trading pair filter change
  const handleTradingPairChange = (value: string) => {
    setSelectedPair(value);
    // Reset to page 1 when changing the trading pair
    setOrdersPagination(prev => ({
      ...prev,
      page: 1
    }));
    loadOrderHistory(displayedUser, 1, value, selectedStatus, selectedSide);
  };
  
  // Handle status filter change
  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    // Reset to page 1 when changing the status
    setOrdersPagination(prev => ({
      ...prev,
      page: 1
    }));
    loadOrderHistory(displayedUser, 1, selectedPair, value, selectedSide);
  };
  
  // Handle side filter change
  const handleSideChange = (value: string) => {
    setSelectedSide(value);
    // Reset to page 1 when changing the side
    setOrdersPagination(prev => ({
      ...prev,
      page: 1
    }));
    loadOrderHistory(displayedUser, 1, selectedPair, selectedStatus, value);
  };
  
  // Handle pagination for order history
  const handleOrderPageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= ordersPagination.totalPages) {
      loadOrderHistory(displayedUser, newPage, selectedPair, selectedStatus, selectedSide);
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
    setOrders([]);
  };

  // Initial data load
  useEffect(() => {
    loadUserData(searchValue);
  }, []);
  
  // Format currency amount for display
  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    return isNaN(num) ? "0.000000" : num.toFixed(6);
  };
  
  // Format date with time
  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  };

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
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Trading Pair:</span>
                <Select value={selectedPair} onValueChange={handleTradingPairChange}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Select pair" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Pairs</SelectItem>
                    {TRADING_PAIRS.map(pair => (
                      <SelectItem key={pair.id} value={pair.id}>
                        {pair.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Select value={selectedStatus} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="Filled">Filled</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                    <SelectItem value="partially_filled">Partially Filled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Side:</span>
                <Select value={selectedSide} onValueChange={handleSideChange}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Select side" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Sides</SelectItem>
                    <SelectItem value="BUY">Buy</SelectItem>
                    <SelectItem value="SELL">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Trading Pair</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Original Amount</TableHead>
                  <TableHead>Filled Amount</TableHead>
                  <TableHead className="text-right">Completed At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Loading order history...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : ordersError ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4 text-red-500">
                      <AlertCircle className="h-5 w-5 inline-block mr-2" />
                      {ordersError}
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4">
                      {selectedPair === "ALL" 
                        ? "No orders found" 
                        : `No ${selectedPair} orders found`}
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.orderId}>
                      <TableCell className="font-medium">
                        <a 
                          href={`https://livenet.xrpl.org/transactions/${order.orderId}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700 hover:underline"
                        >
                          {order.orderId.substring(0, 8)}...
                        </a>
                      </TableCell>
                      <TableCell>
                        <span className={selectedPair !== "ALL" && order.pair === selectedPair 
                          ? "font-medium" 
                          : ""}>
                          {order.pair}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          order.side === 'BUY' 
                            ? "bg-green-500/20 text-green-500" 
                            : order.side === 'SELL' 
                              ? "bg-red-500/20 text-red-500" 
                              : "bg-slate-500/20 text-slate-500"
                        }`}>
                          {order.side}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          order.status === 'Filled' 
                            ? "bg-green-500/20 text-green-500" 
                            : order.status === 'Cancelled' 
                              ? "bg-red-500/20 text-red-500" 
                              : "bg-yellow-500/20 text-yellow-500"
                        }`}>
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell>{formatAmount(order.price)}</TableCell>
                      <TableCell>{formatAmount(order.originalAmount)}</TableCell>
                      <TableCell>{order.filledAmount ? formatAmount(order.filledAmount) : 'N/A'}</TableCell>
                      <TableCell className="text-right">{formatDateTime(order.date)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                disabled={ordersPagination.page <= 1 || ordersLoading}
                onClick={() => handleOrderPageChange(ordersPagination.page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {ordersPagination.page} of {ordersPagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={ordersPagination.page >= ordersPagination.totalPages || ordersLoading}
                onClick={() => handleOrderPageChange(ordersPagination.page + 1)}
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