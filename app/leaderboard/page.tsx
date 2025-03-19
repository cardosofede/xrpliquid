import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChevronDown, Search } from "lucide-react"

export default function LeaderboardPage() {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground">User performance metrics for the campaign</p>
        </div>
        <Button variant="outline" className="gap-2">
          Last 30 Days
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
      <Card className="bg-background">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">User Performance</h2>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users..." className="pl-8" />
          </div>
        </div>
        <div className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Rank</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Transactions</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{i + 1}</TableCell>
                  <TableCell>User_{1000 + i}</TableCell>
                  <TableCell>{Math.floor(Math.random() * 100) + 50}</TableCell>
                  <TableCell className="text-right">${(Math.random() * 10000 + 5000).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{Math.floor(Math.random() * 1000) + 500}</TableCell>
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
    </>
  )
} 