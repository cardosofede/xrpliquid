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
import { ChevronDown, Search } from "lucide-react"

export default function MinersPage() {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Miner Details</h1>
          <p className="text-muted-foreground">User_1001</p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search user ID..." className="pl-8" />
          </div>
          <Button variant="default">View</Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <MetricsCard
          title="Total Transactions"
          value="143"
          change={{
            value: "12",
            percentage: "+9.2%",
            isPositive: true
          }}
        />
        <MetricsCard
          title="Total Volume"
          value="$24,521"
          change={{
            value: "$1,840",
            percentage: "+8.1%",
            isPositive: true
          }}
        />
        <MetricsCard
          title="Current Score"
          value="892"
          change={{
            value: "65",
            percentage: "+7.9%",
            isPositive: true
          }}
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
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">ORD-{Math.floor(Math.random() * 10000)}</TableCell>
                    <TableCell>XRP/RLUSD</TableCell>
                    <TableCell>${(Math.random() * 1000 + 100).toFixed(2)}</TableCell>
                    <TableCell>{i % 2 === 0 ? "Buy" : "Sell"}</TableCell>
                    <TableCell className="text-right">{new Date().toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
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