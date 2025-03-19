"use client"

import { useState, useEffect, useMemo } from "react"
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
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  AlertCircle, 
  X, 
  Loader2,
  ArrowUpDown,
  ArrowDown,
  ArrowUp
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TRADING_PAIRS } from "@/lib/trading-config"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  FilterFn,
} from "@tanstack/react-table"
import { rankItem } from "@tanstack/match-sorter-utils"

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

// Global fuzzy filter for the table
const fuzzyFilter: FilterFn<Order> = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)
  
  // Store the ranking info
  addMeta({
    itemRank,
  })
  
  // Return if the item should be filtered in/out
  return itemRank.passed
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

  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')

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
  const loadOrderHistory = async (userId: string, page: number = 1, tradingPair: string = "ALL") => {
    setOrdersLoading(true);
    setOrdersError(null);
    
    try {
      let url = `/api/miners/orders?userId=${encodeURIComponent(userId)}&page=${page}&limit=10`;
      
      // Add trading pair filter if not ALL
      if (tradingPair !== "ALL") {
        url += `&tradingPair=${encodeURIComponent(tradingPair)}`;
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
    loadOrderHistory(displayedUser, 1, value);
  };
  
  // Handle pagination for order history
  const handleOrderPageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= ordersPagination.totalPages) {
      loadOrderHistory(displayedUser, newPage, selectedPair);
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

  // Table column definitions
  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: 'orderId',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent px-0"
          >
            Order ID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <a 
            href={`https://livenet.xrpl.org/transactions/${row.getValue('orderId')}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 hover:underline"
          >
            {`${String(row.getValue('orderId')).substring(0, 8)}...`}
          </a>
        ),
      },
      {
        accessorKey: 'pair',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent px-0"
          >
            Trading Pair
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className={selectedPair !== "ALL" && row.getValue('pair') === selectedPair 
            ? "font-medium" 
            : ""}>
            {row.getValue('pair')}
          </span>
        ),
        filterFn: "includesString",
      },
      {
        accessorKey: 'side',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent px-0"
          >
            Side
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className={`px-2 py-1 rounded-full text-xs ${
            row.getValue('side') === 'BUY' 
              ? "bg-green-500/20 text-green-500" 
              : row.getValue('side') === 'SELL' 
                ? "bg-red-500/20 text-red-500" 
                : "bg-slate-500/20 text-slate-500"
          }`}>
            {row.getValue('side')}
          </span>
        ),
        filterFn: "equals",
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent px-0"
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className={`px-2 py-1 rounded-full text-xs ${
            row.getValue('status') === 'Filled' 
              ? "bg-green-500/20 text-green-500" 
              : row.getValue('status') === 'Cancelled' 
                ? "bg-red-500/20 text-red-500" 
                : "bg-yellow-500/20 text-yellow-500"
          }`}>
            {row.getValue('status')}
          </span>
        ),
        filterFn: "equals",
      },
      {
        accessorKey: 'price',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent px-0"
          >
            Price
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>{formatAmount(row.getValue('price'))}</div>,
        sortingFn: (rowA, rowB, columnId) => {
          const valueA = parseFloat(rowA.getValue(columnId)) || 0;
          const valueB = parseFloat(rowB.getValue(columnId)) || 0;
          return valueA - valueB;
        },
      },
      {
        accessorKey: 'originalAmount',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent px-0"
          >
            Original Amount
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>{formatAmount(row.getValue('originalAmount'))}</div>,
        sortingFn: (rowA, rowB, columnId) => {
          const valueA = parseFloat(rowA.getValue(columnId)) || 0;
          const valueB = parseFloat(rowB.getValue(columnId)) || 0;
          return valueA - valueB;
        },
      },
      {
        accessorKey: 'filledAmount',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent px-0"
          >
            Filled Amount
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue('filledAmount') ? formatAmount(row.getValue('filledAmount')) : 'N/A'}</div>,
        sortingFn: (rowA, rowB, columnId) => {
          const valueA = parseFloat(rowA.getValue(columnId)) || 0;
          const valueB = parseFloat(rowB.getValue(columnId)) || 0;
          return valueA - valueB;
        },
      },
      {
        accessorKey: 'executedPrice',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent px-0"
          >
            Executed Price
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const rawData = row.original.rawData;
          const status = row.getValue('status');
          
          // Only calculate executed price for filled orders
          if (status === 'Filled' && rawData && rawData.filled_gets && rawData.filled_pays) {
            try {
              // Get the values from the filled_gets and filled_pays fields
              const filledGetsValue = rawData.filled_gets.value;
              const filledPaysValue = rawData.filled_pays.value;
              
              if (!filledGetsValue || !filledPaysValue) {
                return <div>0.000000</div>;
              }
              
              // Instead of using the side to determine calculation, use the trading pair convention
              // Check if filled_gets currency is XRP
              const isGetsXRP = rawData.filled_gets.currency === "XRP";
              // Check if filled_pays currency is XRP
              const isPaysXRP = rawData.filled_pays.currency === "XRP";
              
              let executedPrice;
              
              // For CORE/XRP pairs, price is always XRP/CORE regardless of side
              if (isPaysXRP && !isGetsXRP) {
                // If pays is XRP and gets is not, price = XRP/CORE (pays/gets)
                executedPrice = parseFloat(filledPaysValue) / parseFloat(filledGetsValue);
              } else if (isGetsXRP && !isPaysXRP) {
                // If gets is XRP and pays is not, price = XRP/CORE (gets/pays)
                executedPrice = parseFloat(filledGetsValue) / parseFloat(filledPaysValue);
              } else {
                // For any other pair, use the standard calculation
                const pairId = row.getValue('pair');
                if (pairId === "CORE/XRP") {
                  // For CORE/XRP, price is XRP/CORE
                  if (rawData.filled_gets.currency === "434F524500000000000000000000000000000000") {
                    executedPrice = parseFloat(filledPaysValue) / parseFloat(filledGetsValue);
                  } else {
                    executedPrice = parseFloat(filledGetsValue) / parseFloat(filledPaysValue);
                  }
                } else {
                  // Default to original calculation based on side
                  const side = row.getValue('side');
                  if (side === 'BUY') {
                    executedPrice = parseFloat(filledPaysValue) / parseFloat(filledGetsValue);
                  } else {
                    executedPrice = parseFloat(filledGetsValue) / parseFloat(filledPaysValue);
                  }
                }
              }
              
              return <div>{formatAmount(executedPrice.toString())}</div>;
            } catch (error) {
              console.error('Error calculating executed price:', error, rawData);
              return <div>0.000000</div>;
            }
          }
          return <div>0.000000</div>;
        },
        sortingFn: (rowA, rowB, columnId) => {
          const rawDataA = rowA.original.rawData;
          const rawDataB = rowB.original.rawData;
          const statusA = rowA.getValue('status');
          const statusB = rowB.getValue('status');
          
          let valueA = 0;
          let valueB = 0;
          
          try {
            if (statusA === 'Filled' && rawDataA && rawDataA.filled_gets && rawDataA.filled_pays) {
              const filledGetsValueA = rawDataA.filled_gets.value;
              const filledPaysValueA = rawDataA.filled_pays.value;
              
              if (filledGetsValueA && filledPaysValueA) {
                const isGetsXRP_A = rawDataA.filled_gets.currency === "XRP";
                const isPaysXRP_A = rawDataA.filled_pays.currency === "XRP";
                
                if (isPaysXRP_A && !isGetsXRP_A) {
                  valueA = parseFloat(filledPaysValueA) / parseFloat(filledGetsValueA);
                } else if (isGetsXRP_A && !isPaysXRP_A) {
                  valueA = parseFloat(filledGetsValueA) / parseFloat(filledPaysValueA);
                } else {
                  const pairId = rowA.getValue('pair');
                  if (pairId === "CORE/XRP") {
                    // For CORE/XRP, price is XRP/CORE
                    if (rawDataA.filled_gets.currency === "434F524500000000000000000000000000000000") {
                      valueA = parseFloat(filledPaysValueA) / parseFloat(filledGetsValueA);
                    } else {
                      valueA = parseFloat(filledGetsValueA) / parseFloat(filledPaysValueA);
                    }
                  } else {
                    // Default to original calculation based on side
                    if (rowA.getValue('side') === 'BUY') {
                      valueA = parseFloat(filledPaysValueA) / parseFloat(filledGetsValueA);
                    } else {
                      valueA = parseFloat(filledGetsValueA) / parseFloat(filledPaysValueA);
                    }
                  }
                }
              }
            }
            
            if (statusB === 'Filled' && rawDataB && rawDataB.filled_gets && rawDataB.filled_pays) {
              const filledGetsValueB = rawDataB.filled_gets.value;
              const filledPaysValueB = rawDataB.filled_pays.value;
              
              if (filledGetsValueB && filledPaysValueB) {
                const isGetsXRP_B = rawDataB.filled_gets.currency === "XRP";
                const isPaysXRP_B = rawDataB.filled_pays.currency === "XRP";
                
                if (isPaysXRP_B && !isGetsXRP_B) {
                  valueB = parseFloat(filledPaysValueB) / parseFloat(filledGetsValueB);
                } else if (isGetsXRP_B && !isPaysXRP_B) {
                  valueB = parseFloat(filledGetsValueB) / parseFloat(filledPaysValueB);
                } else {
                  const pairId = rowB.getValue('pair');
                  if (pairId === "CORE/XRP") {
                    // For CORE/XRP, price is XRP/CORE
                    if (rawDataB.filled_gets.currency === "434F524500000000000000000000000000000000") {
                      valueB = parseFloat(filledPaysValueB) / parseFloat(filledGetsValueB);
                    } else {
                      valueB = parseFloat(filledGetsValueB) / parseFloat(filledPaysValueB);
                    }
                  } else {
                    // Default to original calculation based on side
                    if (rowB.getValue('side') === 'BUY') {
                      valueB = parseFloat(filledPaysValueB) / parseFloat(filledGetsValueB);
                    } else {
                      valueB = parseFloat(filledGetsValueB) / parseFloat(filledPaysValueB);
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error in sorting executed price:', error);
          }
          
          return valueA - valueB;
        },
      },
      {
        accessorKey: 'fee',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent px-0"
          >
            XRP Fee
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const rawData = row.original.rawData;
          if (rawData && rawData.fee_xrp) {
            return <div>{formatAmount(rawData.fee_xrp)}</div>;
          }
          return <div>0.000000</div>;
        },
        sortingFn: (rowA, rowB, columnId) => {
          const rawDataA = rowA.original.rawData;
          const rawDataB = rowB.original.rawData;
          
          const valueA = rawDataA && rawDataA.fee_xrp ? parseFloat(rawDataA.fee_xrp) : 0;
          const valueB = rawDataB && rawDataB.fee_xrp ? parseFloat(rawDataB.fee_xrp) : 0;
          
          return valueA - valueB;
        },
      },
      {
        accessorKey: 'date',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent px-0"
          >
            Completed At
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div className="text-right">{formatDateTime(row.getValue('date'))}</div>,
        sortingFn: (rowA, rowB, columnId) => {
          const dateA = new Date(rowA.getValue(columnId)).getTime();
          const dateB = new Date(rowB.getValue(columnId)).getTime();
          return dateA - dateB;
        },
      },
    ],
    [selectedPair]
  );

  // Initialize the table
  const table = useReactTable({
    data: orders,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

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
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'View'
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <MetricsCard
          title="Transaction Count"
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

      <Card className="mt-6">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Order History</h2>
            <div className="flex items-center gap-4">
              {/* Table Filter Input */}
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter orders..."
                  value={globalFilter ?? ""}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              {/* Side Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-2">
                    Side Filter
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => table.getColumn('side')?.setFilterValue(undefined)}>
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => table.getColumn('side')?.setFilterValue('BUY')}>
                    Buy
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => table.getColumn('side')?.setFilterValue('SELL')}>
                    Sell
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Status Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-2">
                    Status Filter
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => table.getColumn('status')?.setFilterValue(undefined)}>
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => table.getColumn('status')?.setFilterValue('Filled')}>
                    Filled
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => table.getColumn('status')?.setFilterValue('Cancelled')}>
                    Cancelled
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => table.getColumn('status')?.setFilterValue('Open')}>
                    Open
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Trading Pair Selector */}
              <Select
                value={selectedPair}
                onValueChange={handleTradingPairChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select trading pair" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Pairs</SelectItem>
                  {TRADING_PAIRS.map((pair) => (
                    <SelectItem key={pair.id} value={pair.id}>
                      {pair.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {ordersError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              {ordersError}
            </div>
          )}
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {ordersLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <span className="mt-2 block text-sm text-muted-foreground">
                        Loading orders...
                      </span>
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {table.getRowModel().rows.length} of{" "}
              {ordersPagination.totalCount} orders
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <div className="text-sm">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
} 