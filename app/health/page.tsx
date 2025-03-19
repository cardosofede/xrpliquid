"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Loader2, InfoIcon, ArrowRight, Database } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Collection {
  name: string
  count: number
  info: any
}

export default function HealthPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [queryCollection, setQueryCollection] = useState("")
  const [queryOperation, setQueryOperation] = useState("find")
  const [queryString, setQueryString] = useState("{}")
  const [queryLimit, setQueryLimit] = useState("20")
  const [queryResults, setQueryResults] = useState<any[]>([])
  const [queryLoading, setQueryLoading] = useState(false)
  const [queryError, setQueryError] = useState<string | null>(null)
  const [healthStatus, setHealthStatus] = useState<any>(null)
  const [healthLoading, setHealthLoading] = useState(true)
  
  // Fetch health status on load
  useEffect(() => {
    async function fetchHealthStatus() {
      try {
        const response = await fetch("/api/health")
        const data = await response.json()
        setHealthStatus(data)
      } catch (err) {
        console.error("Failed to fetch health status:", err)
        setError("Failed to fetch health status")
      } finally {
        setHealthLoading(false)
      }
    }
    
    fetchHealthStatus()
  }, [])
  
  // Fetch MongoDB collections on load
  useEffect(() => {
    async function fetchCollections() {
      try {
        const response = await fetch("/api/mongodb/collections")
        const data = await response.json()
        
        if (data.status === "success") {
          setCollections(data.collections)
          if (data.collections.length > 0) {
            setQueryCollection(data.collections[0].name)
          }
        } else {
          setError(data.error || "Failed to fetch collections")
        }
      } catch (err) {
        console.error("Failed to fetch collections:", err)
        setError("Failed to fetch collections")
      } finally {
        setLoading(false)
      }
    }
    
    fetchCollections()
  }, [])
  
  // Function to execute a query
  async function executeQuery() {
    setQueryLoading(true)
    setQueryError(null)
    setQueryResults([])
    
    try {
      // Parse the query string (or use empty object if invalid)
      let parsedQuery = {}
      try {
        parsedQuery = JSON.parse(queryString)
      } catch (err) {
        setQueryError("Invalid JSON query")
        setQueryLoading(false)
        return
      }
      
      const response = await fetch("/api/mongodb/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collection: queryCollection,
          operation: queryOperation,
          query: parsedQuery,
          limit: parseInt(queryLimit),
        }),
      })
      
      const data = await response.json()
      
      if (data.status === "success") {
        setQueryResults(Array.isArray(data.result) ? data.result : [data.result])
      } else {
        setQueryError(data.error || "Failed to execute query")
      }
    } catch (err) {
      console.error("Failed to execute query:", err)
      setQueryError("Failed to execute query")
    } finally {
      setQueryLoading(false)
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Database Health</h1>
      </div>
      
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="query">Query Tool</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>MongoDB Connection</CardTitle>
              <CardDescription>Current database connection status</CardDescription>
            </CardHeader>
            <CardContent>
              {healthLoading ? (
                <div className="flex items-center justify-center p-6">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : healthStatus ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-green-500" /> 
                    <span className="font-medium">Status:</span>
                    <span className={healthStatus.mongodb.status === "connected" ? "text-green-500" : "text-red-500"}>
                      {healthStatus.mongodb.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Connection URI</p>
                      <p className="font-mono text-sm">{healthStatus.mongodb.uri}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Database</p>
                      <p className="font-mono text-sm">{healthStatus.mongodb.db}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Server Version</p>
                      <p className="font-mono text-sm">{healthStatus.mongodb.version}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Environment</p>
                      <p className="font-mono text-sm">{healthStatus.environment}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <Alert variant="destructive">
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>Failed to fetch MongoDB status</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="collections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>MongoDB Collections</CardTitle>
              <CardDescription>Available collections and document counts</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-6">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : collections.length === 0 ? (
                <div className="rounded-md border border-dashed p-8 text-center">
                  <h3 className="text-lg font-semibold">No Collections Found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your database does not have any collections yet.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Collection Name</TableHead>
                        <TableHead className="text-right">Documents</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {collections.map((collection) => (
                        <TableRow key={collection.name}>
                          <TableCell className="font-mono">{collection.name}</TableCell>
                          <TableCell className="text-right">{collection.count.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="query" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>MongoDB Query Tool</CardTitle>
              <CardDescription>Run simple queries against your database</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Collection</label>
                    <select
                      className="w-full rounded-md border bg-background px-3 py-2"
                      value={queryCollection}
                      onChange={(e) => setQueryCollection(e.target.value)}
                      disabled={loading || collections.length === 0}
                    >
                      {collections.map((collection) => (
                        <option key={collection.name} value={collection.name}>
                          {collection.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Operation</label>
                    <select
                      className="w-full rounded-md border bg-background px-3 py-2"
                      value={queryOperation}
                      onChange={(e) => setQueryOperation(e.target.value)}
                    >
                      <option value="find">find</option>
                      <option value="findOne">findOne</option>
                      <option value="count">count</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Query (JSON)</label>
                  <Textarea
                    placeholder='{ "field": "value" }'
                    value={queryString}
                    onChange={(e) => setQueryString(e.target.value)}
                    className="font-mono"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Limit</label>
                  <Input
                    type="number"
                    value={queryLimit}
                    onChange={(e) => setQueryLimit(e.target.value)}
                    min="1"
                    max="1000"
                  />
                </div>
                
                <Button
                  onClick={executeQuery}
                  disabled={queryLoading || loading || collections.length === 0}
                  className="w-full"
                >
                  {queryLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      Execute Query <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                
                {queryError && (
                  <Alert variant="destructive">
                    <InfoIcon className="h-4 w-4" />
                    <AlertTitle>Query Error</AlertTitle>
                    <AlertDescription>{queryError}</AlertDescription>
                  </Alert>
                )}
                
                {queryResults.length > 0 && (
                  <div className="rounded-md border p-4">
                    <h3 className="mb-2 text-sm font-semibold">Results ({queryResults.length})</h3>
                    <pre className="max-h-80 overflow-auto rounded-md bg-secondary/50 p-4 text-xs">
                      {JSON.stringify(queryResults, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 