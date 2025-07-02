"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Mail, Clock, Search, Calendar, User } from "lucide-react"
import { pitchSupabase } from "@/lib/pitch-supabase-client"

interface EmailHistoryDialogProps {
  isOpen: boolean
  onClose: () => void
}

interface EmailRecord {
  id: string
  email: string
  pin: string
  expires_at: string
  created_at: string
  updated_at: string
}

export function EmailHistoryDialog({ isOpen, onClose }: EmailHistoryDialogProps) {
  const [emailRecords, setEmailRecords] = useState<EmailRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState("")

  const fetchEmailHistory = async () => {
    setIsLoading(true)
    setError("")

    try {
      const { data, error } = await pitchSupabase
        .from('investors_pin')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching email history:', error)
        setError('Failed to load email history')
        return
      }

      setEmailRecords(data || [])
    } catch (error) {
      console.error('Error fetching email history:', error)
      setError('Failed to load email history')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchEmailHistory()
    }
  }, [isOpen])

  const filteredRecords = emailRecords.filter(record =>
    record.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatus = (expiresAt: string) => {
    const expires = new Date(expiresAt)
    const now = new Date()
    return expires > now ? 'active' : 'expired'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeRemaining = (expiresAt: string) => {
    const expires = new Date(expiresAt)
    const now = new Date()
    const diff = expires.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days} day${days > 1 ? 's' : ''} remaining`
    }
    
    return `${hours}h ${minutes}m remaining`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-headline flex items-center">
            <Mail className="mr-2 h-5 w-5" />
            Email History & PIN Status
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Emails Sent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{emailRecords.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active PINs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {emailRecords.filter(r => getStatus(r.expires_at) === 'active').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Expired PINs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {emailRecords.filter(r => getStatus(r.expires_at) === 'expired').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Email History Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Email Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading email history...</div>
              ) : error ? (
                <div className="text-center py-8 text-red-600">{error}</div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No emails found matching your search' : 'No emails sent yet'}
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>PIN</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sent Date</TableHead>
                        <TableHead>Expires</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <User className="mr-2 h-4 w-4 text-muted-foreground" />
                              {record.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                              {record.pin}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatus(record.expires_at) === 'active' ? 'default' : 'secondary'}>
                              {getStatus(record.expires_at) === 'active' ? 'Active' : 'Expired'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                              {formatDate(record.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                              {getTimeRemaining(record.expires_at)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={fetchEmailHistory} disabled={isLoading}>
            Refresh
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 