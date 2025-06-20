'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2,
  AlertTriangle,
  MessageSquare,
  Paperclip,
  X
} from 'lucide-react';
import Link from 'next/link';
import { SupportTicket, TicketFilters } from '@/lib/types';
import { useAdminDictionary } from '@/hooks/useAdminDictionary';

interface TicketsResponse {
  tickets: SupportTicket[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const PRIORITY_COLORS = {
  LOW: 'secondary',
  MEDIUM: 'default',
  HIGH: 'destructive',
  CRITICAL: 'destructive'
} as const;

const STATUS_COLORS = {
  OPEN: 'default',
  IN_PROGRESS: 'secondary',
  PENDING: 'outline',
  RESOLVED: 'secondary',
  CLOSED: 'outline',
  REOPENED: 'destructive'
} as const;

export default function SupportTicketsPage() {
  const { dictionary: dict, isLoading: dictLoading } = useAdminDictionary();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [pagination, setPagination] = useState<TicketsResponse['pagination'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TicketFilters>({
    search: '',
    status: undefined,
    priority: undefined,
    type: undefined,
    productArea: undefined,
    assignedToId: undefined,
    page: 1,
    limit: 20,
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  });

  useEffect(() => {
    fetchTickets();
  }, [filters]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/support/tickets?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }
      
      const data: TicketsResponse = await response.json();
      setTickets(data.tickets);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof TicketFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset to page 1 when changing filters
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: undefined,
      priority: undefined,
      type: undefined,
      productArea: undefined,
      assignedToId: undefined,
      page: 1,
      limit: 20,
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    });
  };

  const hasActiveFilters = filters.search || filters.status || filters.priority || 
    filters.type || filters.productArea || filters.assignedToId;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (dictLoading || !dict?.supportTickets) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {dict.supportTickets.title}
          </h1>
          <p className="text-muted-foreground">
            Manage and track support tickets
          </p>
        </div>
        <Link href="/admin/support/tickets/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {dict.supportTickets.createTicket}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={dict.supportTickets.searchPlaceholder}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={dict.supportTickets.filterByStatus} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{dict.supportTickets.filterByStatus}</SelectItem>
                {Object.entries(dict.ticketStatuses).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select
              value={filters.priority || 'all'}
              onValueChange={(value) => handleFilterChange('priority', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={dict.supportTickets.filterByPriority} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{dict.supportTickets.filterByPriority}</SelectItem>
                {Object.entries(dict.ticketPriorities).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select
              value={filters.type || 'all'}
              onValueChange={(value) => handleFilterChange('type', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={dict.supportTickets.filterByType} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{dict.supportTickets.filterByType}</SelectItem>
                {Object.entries(dict.ticketTypes).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <div className="mt-4">
              <Button variant="outline" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                {dict.supportTickets.clearFilters}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-muted-foreground">{dict.supportTickets.noTickets}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dict.supportTickets.ticketNumber}</TableHead>
                  <TableHead>{dict.supportTickets.title}</TableHead>
                  <TableHead>{dict.supportTickets.type}</TableHead>
                  <TableHead>{dict.supportTickets.priority}</TableHead>
                  <TableHead>{dict.supportTickets.status}</TableHead>
                  <TableHead>{dict.supportTickets.assignedTo}</TableHead>
                  <TableHead>{dict.supportTickets.createdAt}</TableHead>
                  <TableHead>{dict.supportTickets.lastActivity}</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">
                      <Link 
                        href={`/admin/support/tickets/${ticket.id}`}
                        className="hover:underline"
                      >
                        {ticket.ticketNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate">
                        {ticket.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {ticket._count?.messages > 0 && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {ticket._count.messages}
                          </div>
                        )}
                        {ticket._count?.attachments > 0 && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Paperclip className="h-3 w-3 mr-1" />
                            {ticket._count.attachments}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {dict.ticketTypes[ticket.type as keyof typeof dict.ticketTypes]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={PRIORITY_COLORS[ticket.priority]}>
                        {dict.ticketPriorities[ticket.priority as keyof typeof dict.ticketPriorities]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_COLORS[ticket.status]}>
                        {dict.ticketStatuses[ticket.status as keyof typeof dict.ticketStatuses]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {ticket.assignedTo ? (
                        <div className="text-sm">
                          <div>{ticket.assignedTo.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {ticket.assignedTo.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {ticket.createdBy.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(ticket.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/support/tickets/${ticket.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              {dict.supportTickets.viewDetails}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/support/tickets/${ticket.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              {dict.supportTickets.editTicket}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            {dict.supportTickets.deleteTicket}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
            {pagination.totalCount} tickets
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFilterChange('page', pagination.page - 1)}
              disabled={!pagination.hasPrev}
            >
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={pagination.page === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterChange('page', page)}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFilterChange('page', pagination.page + 1)}
              disabled={!pagination.hasNext}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}