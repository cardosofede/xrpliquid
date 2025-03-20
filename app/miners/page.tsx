"use client"

import { useState, useEffect, useMemo, useRef } from "react"
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
  ArrowUp,
  RefreshCw
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
  executedPrice: string | null;
  status: string;
  date: string;
  fee: string;
  rawData: any;
  isNew?: boolean; // Flag to indicate new items
}

// Transaction interface for deposits and withdrawals
interface Transaction {
  id: string;
  userId: string;
  type: "deposit" | "withdrawal";
  amount: string;
  currency: string;
  fee: string;
  fromAddress: string;
  toAddress: string;
  timestamp: string;
  hash: string;
  ledgerIndex: number;
  rawData: any;
  isNew?: boolean; // Flag to indicate new items
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

// Separate fuzzy filter for transactions table
const transactionsFuzzyFilter: FilterFn<Transaction> = (row, columnId, value, addMeta) => {
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
  const [selectedSide, setSelectedSide] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);

  // Active open orders state - keep it simple
  const [openOrders, setOpenOrders] = useState<any[]>([]);
  const [openOrdersLoading, setOpenOrdersLoading] = useState<boolean>(false);
  const [openOrdersError, setOpenOrdersError] = useState<string | null>(null);
  const [openOrdersPage, setOpenOrdersPage] = useState<number>(1);
  const [openOrdersPagination, setOpenOrdersPagination] = useState<{
    page: number;
    limit: number;
    totalPages: number;
    totalCount: number;
  }>({
    page: 1,
    limit: 15,
    totalPages: 1,
    totalCount: 0
  });

  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // Deposits/withdrawals state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsPagination, setTransactionsPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalCount: 0
  });
  const [transactionsLoading, setTransactionsLoading] = useState<boolean>(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [selectedCurrency, setSelectedCurrency] = useState<string | undefined>(undefined);
  const [transactionsSorting, setTransactionsSorting] = useState<SortingState>([]);
  const [transactionsPageIndex, setTransactionsPageIndex] = useState(0);
  const [transactionsPageSize, setTransactionsPageSize] = useState(10);
  const [transactionsGlobalFilter, setTransactionsGlobalFilter] = useState('');

  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());

  // Load user data based on the search value
  const loadUserData = async (userId: string, silent: boolean = false) => {
    if (!userId.trim()) {
      setError("Please enter a user ID");
      return;
    }
    
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    
    try {
      // Use the dashboard stats API since it already works
      const response = await fetch(`/api/dashboard/stats?userId=${encodeURIComponent(userId)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Set transaction count from the stats response
      setTransactionCount(data.stats?.transactionCount || 0);
      
      if (!silent) {
        setDisplayedUser(userId);
        
        // Reset pagination and filters before loading orders
        setPageIndex(0);
        setSelectedPair("ALL");
        setSelectedSide(undefined);
        setSelectedStatus(undefined);
        
        // Reset transactions pagination and filters
        setTransactionsPageIndex(0);
        setSelectedType(undefined);
        setSelectedCurrency(undefined);
        
        // Reset open orders pagination
        setOpenOrdersPage(1);
        
        // Load order history for this user
        await loadOrderHistory(userId, 1, "ALL", undefined, undefined);
        
        // Load open orders for this user (page 1)
        await loadOpenOrders(userId, 1);
        
        // Load deposits and withdrawals for this user
        await loadTransactions(userId, 1);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while loading data');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };
  
  // Load order history for the given user with filters
  const loadOrderHistory = async (
    userId: string, 
    page: number = 1, 
    tradingPair: string = "ALL", 
    side?: string,
    status?: string,
    sortField?: string,
    sortDirection?: string,
    silent: boolean = false
  ) => {
    if (!userId) return;
    
    if (!silent) {
      setOrdersLoading(true);
    }
    setOrdersError(null);
    
    try {
      // Still request 50 records to have enough data for client-side pagination
      const limit = 50;
      
      let url = `/api/miners/orders?userId=${encodeURIComponent(userId)}&page=${page}&limit=${limit}`;
      
      // Add trading pair filter if not ALL
      if (tradingPair !== "ALL") {
        url += `&tradingPair=${encodeURIComponent(tradingPair)}`;
      }
      
      // Add side filter if specified
      if (side) {
        url += `&side=${encodeURIComponent(side)}`;
      }
      
      // Add status filter if specified
      if (status) {
        url += `&status=${encodeURIComponent(status)}`;
      }
      
      // Add sorting if specified
      if (sortField) {
        url += `&sortField=${encodeURIComponent(sortField)}&sortDirection=${sortDirection || 'asc'}`;
      }
      
      console.log('Fetching orders with URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to load order history: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Check for new orders
        if (silent && orders.length > 0) {
          // Get existing order IDs
          const existingIds = new Set(orders.map(order => order.orderId));
          
          // Find new orders
          const newOrders = data.data.filter((order: Order) => !existingIds.has(order.orderId));
          
          if (newOrders.length > 0) {
            // Mark new orders
            const markedNewOrders = newOrders.map((order: Order) => ({
              ...order,
              isNew: true
            }));
            
            // Merge orders with existing ones
            const updatedOrders = [...markedNewOrders, ...orders];
            
            // Remove isNew flag after 3 seconds
            setTimeout(() => {
              setOrders(prevOrders => 
                prevOrders.map(order => ({
                  ...order,
                  isNew: false
                }))
              );
            }, 3000);
            
            setOrders(updatedOrders);
          }
        } else {
          // Store all orders normally on initial or explicit load
          setOrders(data.data || []);
        }
        
        // Calculate total pages based on total count and page size (for display only)
        const totalCount = data.pagination?.totalCount || 0;
        const totalPages = totalCount > 0 
          ? Math.ceil(totalCount / pageSize)
          : 1;
          
        console.log(`Pagination: page ${page}, total pages ${totalPages}, total count ${totalCount}`);
        
        setOrdersPagination({
          page: 1, // Reset to page 1 for client-side pagination
          limit: pageSize,
          totalPages: totalPages,
          totalCount: totalCount
        });
        
        if (!silent) {
          // Reset to first page
          setPageIndex(0);
        }
      } else {
        throw new Error(data.error || 'Failed to load order history');
      }
    } catch (error) {
      console.error('Error fetching order history:', error);
      setOrdersError(error instanceof Error ? error.message : 'An error occurred while loading order history');
      if (!silent) {
        setOrders([]);
      }
    } finally {
      if (!silent) {
        setOrdersLoading(false);
      }
    }
  };
  
  // Simple function to load open orders with pagination
  const loadOpenOrders = async (userId: string, page: number = 1, silent: boolean = false) => {
    if (!userId) return;
    
    if (!silent) {
      setOpenOrdersLoading(true);
    }
    setOpenOrdersError(null);
    
    try {
      // Use pagination parameters
      const url = `/api/miners/open-orders?userId=${encodeURIComponent(userId)}&page=${page}&limit=${openOrdersPagination.limit}`;
      
      console.log(`Fetching open orders (page ${page}) with URL:`, url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to load open orders: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        if (silent && openOrders.length > 0) {
          // Get existing order hashes
          const existingHashes = new Set(openOrders.map(order => order.hash));
          
          // Find new open orders
          const newOpenOrders = data.data.filter((order: any) => !existingHashes.has(order.hash));
          
          if (newOpenOrders.length > 0) {
            // Mark new open orders
            const markedNewOrders = newOpenOrders.map((order: any) => ({
              ...order,
              isNew: true
            }));
            
            // Merge with existing open orders
            const updatedOpenOrders = [...markedNewOrders, ...openOrders];
            
            // Remove isNew flag after 3 seconds
            setTimeout(() => {
              setOpenOrders(prevOrders => 
                prevOrders.map(order => ({
                  ...order,
                  isNew: false
                }))
              );
            }, 3000);
            
            setOpenOrders(updatedOpenOrders);
          }
        } else {
          // Store open orders normally
          setOpenOrders(data.data || []);
        }
        
        setOpenOrdersPagination({
          page: data.pagination?.page || 1,
          limit: data.pagination?.limit || 15,
          totalPages: data.pagination?.totalPages || 1,
          totalCount: data.pagination?.totalCount || 0
        });
        
        if (!silent) {
          setOpenOrdersPage(data.pagination?.page || 1);
        }
      } else {
        throw new Error(data.error || 'Failed to load open orders');
      }
    } catch (error) {
      console.error('Error fetching open orders:', error);
      setOpenOrdersError(error instanceof Error ? error.message : 'An error occurred while loading open orders');
      if (!silent) {
        setOpenOrders([]);
      }
    } finally {
      if (!silent) {
        setOpenOrdersLoading(false);
      }
    }
  };
  
  // Load deposits and withdrawals for the given user with filters
  const loadTransactions = async (
    userId: string, 
    page: number = 1, 
    type?: string,
    currency?: string,
    silent: boolean = false
  ) => {
    if (!userId) return;
    
    if (!silent) {
      setTransactionsLoading(true);
    }
    setTransactionsError(null);
    
    try {
      // Request transactions with pagination
      const limit = 50; // Fetch more for client-side pagination
      
      let url = `/api/miners/deposits-withdrawals?userId=${encodeURIComponent(userId)}&page=${page}&limit=${limit}`;
      
      // Add type filter if specified
      if (type) {
        url += `&type=${encodeURIComponent(type)}`;
      }
      
      // Add currency filter if specified
      if (currency) {
        url += `&currency=${encodeURIComponent(currency)}`;
      }
      
      console.log('Fetching transactions with URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to load transactions: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        if (silent && transactions.length > 0) {
          // Get existing transaction IDs
          const existingIds = new Set(transactions.map(tx => tx.id));
          
          // Find new transactions
          const newTransactions = data.data.filter((tx: Transaction) => !existingIds.has(tx.id));
          
          if (newTransactions.length > 0) {
            // Mark new transactions
            const markedNewTransactions = newTransactions.map((tx: Transaction) => ({
              ...tx,
              isNew: true
            }));
            
            // Merge with existing transactions
            const updatedTransactions = [...markedNewTransactions, ...transactions];
            
            // Remove isNew flag after 3 seconds
            setTimeout(() => {
              setTransactions(prevTransactions => 
                prevTransactions.map(tx => ({
                  ...tx,
                  isNew: false
                }))
              );
            }, 3000);
            
            setTransactions(updatedTransactions);
          }
        } else {
          // Store transactions normally
          setTransactions(data.data || []);
        }
        
        // Calculate total pages based on total count and page size
        const totalCount = data.pagination?.totalCount || 0;
        const totalPages = totalCount > 0 
          ? Math.ceil(totalCount / transactionsPageSize)
          : 1;
          
        setTransactionsPagination({
          page: 1, // Reset to page 1 for client-side pagination
          limit: transactionsPageSize,
          totalPages: totalPages,
          totalCount: totalCount
        });
        
        if (!silent) {
          // Reset to first page
          setTransactionsPageIndex(0);
        }
      } else {
        throw new Error(data.error || 'Failed to load transactions');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactionsError(error instanceof Error ? error.message : 'An error occurred while loading transactions');
      if (!silent) {
        setTransactions([]);
      }
    } finally {
      if (!silent) {
        setTransactionsLoading(false);
      }
    }
  };
  
  // Handle auto-refresh toggle
  const toggleAutoRefresh = () => {
    setAutoRefresh(prev => !prev);
  };

  // Manual refresh function
  const handleManualRefresh = async () => {
    if (refreshing || !displayedUser) return;
    
    setRefreshing(true);
    
    try {
      // Convert table sorting to API sorting
      const sortField = sorting.length > 0 ? sorting[0].id : undefined;
      const sortDirection = sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : undefined;
      
      // Load data silently (without loading indicators)
      await Promise.all([
        loadOrderHistory(
          displayedUser, 
          ordersPagination.page, 
          selectedPair, 
          selectedSide, 
          selectedStatus,
          sortField,
          sortDirection,
          true // silent mode
        ),
        loadOpenOrders(displayedUser, openOrdersPage, true),
        loadTransactions(displayedUser, transactionsPagination.page, selectedType, selectedCurrency, true),
        loadUserData(displayedUser, true)
      ]);
      
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle trading pair filter change
  const handleTradingPairChange = (value: string) => {
    setSelectedPair(value);
    setPageIndex(0); // Reset to first page
  };
  
  // Handle side filter change
  const handleSideFilterChange = (value: string | undefined) => {
    setSelectedSide(value);
    setPageIndex(0); // Reset to first page
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (value: string | undefined) => {
    setSelectedStatus(value);
    setPageIndex(0); // Reset to first page
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
    setOpenOrders([]);
    setTransactions([]);
    setOpenOrdersPage(1);
    setOpenOrdersPagination({
      page: 1,
      limit: 15,
      totalPages: 1,
      totalCount: 0
    });
    
    // Clear auto-refresh interval when user is cleared
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
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
          const executedPrice = row.getValue('executedPrice');
          return <div>{executedPrice ? formatAmount(executedPrice.toString()) : 'N/A'}</div>;
        },
        sortingFn: (rowA, rowB, columnId) => {
          const valueA = parseFloat(rowA.getValue(columnId)) || 0;
          const valueB = parseFloat(rowB.getValue(columnId)) || 0;
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
        cell: ({ row }) => <div>{formatAmount(row.getValue('fee'))}</div>,
        sortingFn: (rowA, rowB, columnId) => {
          const valueA = parseFloat(rowA.getValue(columnId)) || 0;
          const valueB = parseFloat(rowB.getValue(columnId)) || 0;
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

  // Initialize the table with client-side pagination
  const table = useReactTable({
    data: orders,
    columns,
    manualPagination: false, // Use client-side pagination
    manualSorting: true, // Keep server-side sorting
    manualFiltering: true, // Keep server-side filtering for server-side filters
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      const newState = typeof updater === 'function' ? updater({
        pageIndex,
        pageSize,
      }) : updater;
      setPageIndex(newState.pageIndex);
      setPageSize(newState.pageSize);
    },
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
      pagination: {
        pageIndex,
        pageSize,
      },
    },
  });

  // Handle open orders page change
  const handleOpenOrdersPageChange = (newPage: number) => {
    if (newPage < 1 || newPage > openOrdersPagination.totalPages || openOrdersLoading) {
      return;
    }
    loadOpenOrders(displayedUser, newPage);
  };

  // Content of the active open orders card - with pagination
  const renderActiveOpenOrders = () => {
    return (
      <Card className="bg-background">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">
            Active Open Orders {openOrdersPagination.totalCount > 0 && `(${openOrdersPagination.totalCount} Total)`}
          </h2>
        </div>
        <div className="p-4">
          {openOrdersError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              {openOrdersError}
            </div>
          )}
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Trading Pair</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>XRP Fee</TableHead>
                <TableHead className="text-right">Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {openOrdersLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-16 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    <span className="mt-1 block text-sm text-muted-foreground">
                      Loading open orders...
                    </span>
                  </TableCell>
                </TableRow>
              ) : openOrders.length > 0 ? (
                openOrders.map((order) => (
                  <TableRow 
                    key={order.hash}
                    className={order.isNew ? "bg-green-50 dark:bg-green-900/20 transition-colors duration-1000" : ""}
                  >
                    <TableCell>
                      <a 
                        href={`https://livenet.xrpl.org/transactions/${order.hash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 hover:underline"
                      >
                        {`${order.hash.substring(0, 8)}...`}
                      </a>
                    </TableCell>
                    <TableCell>
                      {order.trading_pair?.id || "Unknown/Unknown"}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        order.market_side?.toUpperCase() === 'BUY'
                          ? "bg-green-500/20 text-green-500" 
                          : order.market_side?.toUpperCase() === 'SELL'
                            ? "bg-red-500/20 text-red-500" 
                            : "bg-slate-500/20 text-slate-500"
                      }`}>
                        {order.market_side?.toUpperCase() || "UNKNOWN"}
                      </span>
                    </TableCell>
                    <TableCell>{formatAmount(order.price?.toString() || "0")}</TableCell>
                    <TableCell>{formatAmount(order.original_amount?.toString() || "0")}</TableCell>
                    <TableCell>{formatAmount(order.fee_xrp?.toString() || "0")}</TableCell>
                    <TableCell className="text-right">{formatDateTime(order.created_date)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">No active orders found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Pagination controls for open orders */}
          {openOrdersPagination.totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4 mt-2">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenOrdersPageChange(openOrdersPage - 1)}
                  disabled={openOrdersPage <= 1 || openOrdersLoading}
                  className="px-4"
                >
                  Previous
                </Button>
                
                <div className="flex items-center bg-muted px-2 rounded">
                  <span className="text-sm mx-2">
                    Page {openOrdersPage} of {openOrdersPagination.totalPages}
                  </span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenOrdersPageChange(openOrdersPage + 1)}
                  disabled={openOrdersPage >= openOrdersPagination.totalPages || openOrdersLoading}
                  className="px-4"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  };

  // Effect for server-side filtering for transactions
  useEffect(() => {
    if (displayedUser) {
      loadTransactions(displayedUser, 1, selectedType, selectedCurrency);
    }
  }, [displayedUser, selectedType, selectedCurrency]);
  
  // Handle transaction type filter change
  const handleTypeFilterChange = (value: string | undefined) => {
    setSelectedType(value);
    setTransactionsPageIndex(0);
  };
  
  // Handle currency filter change
  const handleCurrencyFilterChange = (value: string | undefined) => {
    setSelectedCurrency(value);
    setTransactionsPageIndex(0);
  };

  // Table column definitions for transactions
  const transactionsColumns = useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        accessorKey: 'hash',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent px-0"
          >
            Transaction Hash
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <a 
            href={`https://livenet.xrpl.org/transactions/${row.getValue('hash')}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 hover:underline"
          >
            {`${String(row.getValue('hash')).substring(0, 8)}...`}
          </a>
        ),
      },
      {
        accessorKey: 'type',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent px-0"
          >
            Type
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className={`px-2 py-1 rounded-full text-xs ${
            row.getValue('type') === 'deposit' 
              ? "bg-green-500/20 text-green-500" 
              : "bg-red-500/20 text-red-500"
          }`}>
            {(row.getValue('type') as string).toUpperCase()}
          </span>
        ),
        filterFn: "equals",
      },
      {
        accessorKey: 'amount',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent px-0"
          >
            Amount
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>{formatAmount(row.getValue('amount'))}</div>,
        sortingFn: (rowA, rowB, columnId) => {
          const valueA = parseFloat(rowA.getValue(columnId)) || 0;
          const valueB = parseFloat(rowB.getValue(columnId)) || 0;
          return valueA - valueB;
        },
      },
      {
        accessorKey: 'currency',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent px-0"
          >
            Currency
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue('currency')}</div>,
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
        cell: ({ row }) => <div>{formatAmount(row.getValue('fee'))}</div>,
        sortingFn: (rowA, rowB, columnId) => {
          const valueA = parseFloat(rowA.getValue(columnId)) || 0;
          const valueB = parseFloat(rowB.getValue(columnId)) || 0;
          return valueA - valueB;
        },
      },
      {
        accessorKey: 'fromAddress',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent px-0"
          >
            From Address
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <a 
            href={`https://livenet.xrpl.org/accounts/${row.getValue('fromAddress')}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 hover:underline"
          >
            {`${String(row.getValue('fromAddress')).substring(0, 8)}...`}
          </a>
        ),
      },
      {
        accessorKey: 'toAddress',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent px-0"
          >
            To Address
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <a 
            href={`https://livenet.xrpl.org/accounts/${row.getValue('toAddress')}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 hover:underline"
          >
            {`${String(row.getValue('toAddress')).substring(0, 8)}...`}
          </a>
        ),
      },
      {
        accessorKey: 'timestamp',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent px-0"
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div className="text-right">{formatDateTime(row.getValue('timestamp'))}</div>,
        sortingFn: (rowA, rowB, columnId) => {
          const dateA = new Date(rowA.getValue(columnId)).getTime();
          const dateB = new Date(rowB.getValue(columnId)).getTime();
          return dateA - dateB;
        },
      },
    ],
    []
  );

  // Initialize the transactions table with client-side pagination
  const transactionsTable = useReactTable({
    data: transactions,
    columns: transactionsColumns,
    manualPagination: false, // Use client-side pagination
    manualSorting: false,    // Use client-side sorting
    manualFiltering: false,  // Use client-side filtering
    onSortingChange: setTransactionsSorting,
    onPaginationChange: (updater) => {
      const newState = typeof updater === 'function' ? updater({
        pageIndex: transactionsPageIndex,
        pageSize: transactionsPageSize,
      }) : updater;
      setTransactionsPageIndex(newState.pageIndex);
      setTransactionsPageSize(newState.pageSize);
    },
    onGlobalFilterChange: setTransactionsGlobalFilter,
    globalFilterFn: transactionsFuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting: transactionsSorting,
      globalFilter: transactionsGlobalFilter,
      pagination: {
        pageIndex: transactionsPageIndex,
        pageSize: transactionsPageSize,
      },
    },
  });

  // Setup auto-refresh interval
  useEffect(() => {
    if (autoRefresh && displayedUser) {
      // Clear any existing interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      
      // Set up new interval
      refreshIntervalRef.current = setInterval(() => {
        handleManualRefresh();
      }, 4000);
    } else if (refreshIntervalRef.current) {
      // Clear interval if auto-refresh is disabled
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    
    // Cleanup on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, displayedUser]);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Miner Details</h1>
          <div className="flex items-center gap-2 mt-1">
            {displayedUser && (
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
            )}
            <Button 
              variant={autoRefresh ? "outline" : "ghost"} 
              size="sm" 
              onClick={toggleAutoRefresh}
              className={`flex items-center gap-1 ${displayedUser ? "" : "opacity-50 pointer-events-none"}`}
              disabled={!displayedUser}
            >
              <span className={`h-2 w-2 rounded-full ${autoRefresh ? "bg-green-500" : "bg-gray-400"}`}></span>
              {autoRefresh ? "Auto-refresh On" : "Auto-refresh Off"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualRefresh}
              disabled={refreshing || !displayedUser}
              className={displayedUser ? "" : "opacity-50 pointer-events-none"}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              <span className="ml-1 text-xs">
                {lastRefreshTime && `Last: ${lastRefreshTime.toLocaleTimeString()}`}
              </span>
            </Button>
          </div>
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
        
        {renderActiveOpenOrders()}
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
                  onChange={(e) => {
                    setGlobalFilter(e.target.value);
                    // Reset to first page when filtering
                    setPageIndex(0);
                  }}
                  className="pl-8"
                />
              </div>
              
              {/* Side Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-2">
                    Side Filter
                    {selectedSide && `: ${selectedSide}`}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleSideFilterChange(undefined)}>
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSideFilterChange('BUY')}>
                    Buy
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSideFilterChange('SELL')}>
                    Sell
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Status Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-2">
                    Status Filter
                    {selectedStatus && `: ${selectedStatus}`}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleStatusFilterChange(undefined)}>
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusFilterChange('Filled')}>
                    Filled
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusFilterChange('Cancelled')}>
                    Cancelled
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusFilterChange('Open')}>
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
                    <TableCell colSpan={9} className="h-24 text-center">
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
                      className={row.original.isNew ? "bg-green-50 dark:bg-green-900/20 transition-colors duration-1000" : ""}
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
                    <TableCell colSpan={9} className="h-24 text-center">
                      No orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {ordersPagination.totalCount > 0 ? (
                  <>
                    Showing {((ordersPagination.page - 1) * ordersPagination.limit) + 1} to{" "}
                    {Math.min(ordersPagination.page * ordersPagination.limit, ordersPagination.totalCount)} of{" "}
                    {ordersPagination.totalCount} orders
                  </>
                ) : (
                  <>Showing 0 of 0 orders</>
                )}
              </span>
              
              <Select
                value={table.getState().pagination.pageSize.toString()}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="h-8 w-[80px]">
                  <SelectValue placeholder={table.getState().pagination.pageSize.toString()} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={pageSize.toString()}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">per page</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage() || ordersLoading}
                className="px-4"
              >
                Previous
              </Button>
              
              <div className="flex items-center bg-muted px-2 rounded">
                <span className="text-sm mx-2">
                  Page {pageIndex + 1} of {table.getPageCount()}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage() || ordersLoading}
                className="px-4"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </Card>
      
      {/* New Deposits and Withdrawals Card */}
      <Card className="mt-6">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Deposits and Withdrawals</h2>
            <div className="flex items-center gap-4">
              {/* Table Filter Input */}
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter transactions..."
                  value={transactionsGlobalFilter ?? ""}
                  onChange={(e) => {
                    setTransactionsGlobalFilter(e.target.value);
                    setTransactionsPageIndex(0);
                  }}
                  className="pl-8"
                />
              </div>
              
              {/* Type Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-2">
                    Type Filter
                    {selectedType && `: ${selectedType}`}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleTypeFilterChange(undefined)}>
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleTypeFilterChange('deposit')}>
                    Deposits
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleTypeFilterChange('withdrawal')}>
                    Withdrawals
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Currency Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-2">
                    Currency Filter
                    {selectedCurrency && `: ${selectedCurrency}`}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleCurrencyFilterChange(undefined)}>
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCurrencyFilterChange('XRP')}>
                    XRP
                  </DropdownMenuItem>
                  {/* Could add other currencies here as needed */}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {transactionsError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              {transactionsError}
            </div>
          )}
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {transactionsTable.getHeaderGroups().map((headerGroup) => (
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
                {transactionsLoading ? (
                  <TableRow>
                    <TableCell colSpan={transactionsColumns.length} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <span className="mt-2 block text-sm text-muted-foreground">
                        Loading transactions...
                      </span>
                    </TableCell>
                  </TableRow>
                ) : transactionsTable.getRowModel().rows?.length ? (
                  transactionsTable.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className={row.original.isNew ? "bg-green-50 dark:bg-green-900/20 transition-colors duration-1000" : ""}
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
                    <TableCell colSpan={transactionsColumns.length} className="h-24 text-center">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {transactionsPagination.totalCount > 0 ? (
                  <>
                    Showing {transactionsPageIndex * transactionsPageSize + 1} to{" "}
                    {Math.min((transactionsPageIndex + 1) * transactionsPageSize, transactions.length)} of{" "}
                    {transactionsPagination.totalCount} transactions
                  </>
                ) : (
                  <>Showing 0 of 0 transactions</>
                )}
              </span>
              
              <Select
                value={transactionsTable.getState().pagination.pageSize.toString()}
                onValueChange={(value) => {
                  transactionsTable.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="h-8 w-[80px]">
                  <SelectValue placeholder={transactionsTable.getState().pagination.pageSize.toString()} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={pageSize.toString()}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">per page</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => transactionsTable.previousPage()}
                disabled={!transactionsTable.getCanPreviousPage() || transactionsLoading}
                className="px-4"
              >
                Previous
              </Button>
              
              <div className="flex items-center bg-muted px-2 rounded">
                <span className="text-sm mx-2">
                  Page {transactionsPageIndex + 1} of {transactionsTable.getPageCount() || 1}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => transactionsTable.nextPage()}
                disabled={!transactionsTable.getCanNextPage() || transactionsLoading}
                className="px-4"
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