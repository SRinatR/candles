'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  MessageSquare
} from 'lucide-react';
import { SupportTicket, TicketSortOptions } from '@/lib/types';
import { useAdminDictionary } from '@/hooks/useAdminDictionary';

interface TicketsTableProps {
  tickets: SupportTicket[];
  loading?: boolean;
  selectedTickets: string[];
  onSelectionChange: (ticketIds: string[]) => void;
  sortOptions: TicketSortOptions;
  onSortChange: (sort: TicketSortOptions) => void;
  onTicketAction: (action: 'view' | 'edit' | 'delete', ticketId: string) => void;
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

const PRIORITY_ICONS = {
  LOW: Clock,
  MEDIUM: Clock,
  HIGH: AlertTriangle,
  CRITICAL: AlertTriangle
};

const STATUS_ICONS = {
  OPEN: Clock,
  IN_PROGRESS: Clock,
  PENDING: Clock,
  RESOLVED: CheckCircle,
  CLOSED: CheckCircle,
  REOPENED: AlertTriangle
};

interface SortableHeaderProps {
  children: React.ReactNode;
  sortKey: keyof TicketSortOptions;
  currentSort: TicketSortOptions;
  onSortChange: (sort: TicketSortOptions) => void;
}

const SortableHeader = ({ children, sortKey, currentSort, onSortChange }: SortableHeaderProps) => {
  const isActive = currentSort.field === sortKey;
  const direction = currentSort.direction;

  const handleSort = () => {
    if (isActive) {
      // Toggle direction if already sorting by this field
      onSortChange({
        field: sortKey,
        direction: direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      // Set new sort field with default direction
      onSortChange({
        field: sortKey,
        direction: 'desc'
      });
    }
  };

  const SortIcon = isActive 
    ? (direction === 'asc' ? ArrowUp : ArrowDown)
    : ArrowUpDown;

  return (
    <Button 
      variant="ghost" 
      className="h-auto p-0 font-medium hover:bg-transparent"
      onClick={handleSort}
    >
      {children}
      <SortIcon className={`ml-2 h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
    </Button>
  );
};

export default function TicketsTable({
  tickets,
  loading,
  selectedTickets,
  onSelectionChange,
  sortOptions,
  onSortChange,
  onTicketAction
}: TicketsTableProps) {
  const dict = useAdminDictionary();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(tickets.map(ticket => ticket.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectTicket = (ticketId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedTickets, ticketId]);
    } else {
      onSelectionChange(selectedTickets.filter(id => id !== ticketId));
    }
  };

  const isAllSelected = tickets.length > 0 && selectedTickets.length === tickets.length;
  const isPartiallySelected = selectedTickets.length > 0 && selectedTickets.length < tickets.length;

  if (loading) {
    return (
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Ticket</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><div className="h-4 w-4 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="h-4 w-48 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="h-6 w-20 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="h-6 w-16 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="h-6 w-16 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="h-4 w-24 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="h-4 w-20 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="h-8 w-8 bg-muted rounded animate-pulse" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="border rounded-md p-8 text-center">
        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">{dict.ticketsList.noTickets}</h3>
        <p className="text-muted-foreground mb-4">
          {dict.ticketsList.noTicketsDescription}
        </p>
        <Link href="/admin/support/tickets/new">
          <Button>{dict.ticketsList.createFirst}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                ref={(el) => {
                  if (el) el.indeterminate = isPartiallySelected;
                }}
                onCheckedChange={handleSelectAll}
                aria-label="Select all tickets"
              />
            </TableHead>
            <TableHead>
              <SortableHeader 
                sortKey="ticketNumber" 
                currentSort={sortOptions} 
                onSortChange={onSortChange}
              >
                {dict.ticketsList.ticket}
              </SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader 
                sortKey="status" 
                currentSort={sortOptions} 
                onSortChange={onSortChange}
              >
                {dict.ticketsList.status}
              </SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader 
                sortKey="priority" 
                currentSort={sortOptions} 
                onSortChange={onSortChange}
              >
                {dict.ticketsList.priority}
              </SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader 
                sortKey="type" 
                currentSort={sortOptions} 
                onSortChange={onSortChange}
              >
                {dict.ticketsList.type}
              </SortableHeader>
            </TableHead>
            <TableHead>{dict.ticketsList.assignee}</TableHead>
            <TableHead>
              <SortableHeader 
                sortKey="createdAt" 
                currentSort={sortOptions} 
                onSortChange={onSortChange}
              >
                {dict.ticketsList.created}
              </SortableHeader>
            </TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => {
            const PriorityIcon = PRIORITY_ICONS[ticket.priority];
            const StatusIcon = STATUS_ICONS[ticket.status];
            const isSelected = selectedTickets.includes(ticket.id);

            return (
              <TableRow key={ticket.id} className={isSelected ? 'bg-muted/50' : ''}>
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handleSelectTicket(ticket.id, checked as boolean)}
                    aria-label={`Select ticket ${ticket.ticketNumber}`}
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <Link 
                      href={`/admin/support/tickets/${ticket.id}`}
                      className="font-medium hover:underline"
                    >
                      {ticket.ticketNumber}
                    </Link>
                    <p className="text-sm text-muted-foreground truncate max-w-xs">
                      {ticket.title}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_COLORS[ticket.status]} className="gap-1">
                    <StatusIcon className="h-3 w-3" />
                    {dict.ticketStatuses[ticket.status as keyof typeof dict.ticketStatuses]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={PRIORITY_COLORS[ticket.priority]} className="gap-1">
                    <PriorityIcon className="h-3 w-3" />
                    {dict.ticketPriorities[ticket.priority as keyof typeof dict.ticketPriorities]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {dict.ticketTypes[ticket.type as keyof typeof dict.ticketTypes]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {ticket.assignedTo ? (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{ticket.assignedTo.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {dict.ticketsList.unassigned}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{new Date(ticket.createdAt).toLocaleDateString()}</div>
                    <div className="text-muted-foreground">
                      {new Date(ticket.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{dict.ticketsList.actions}</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onTicketAction('view', ticket.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        {dict.ticketsList.view}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onTicketAction('edit', ticket.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        {dict.ticketsList.edit}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onTicketAction('delete', ticket.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {dict.ticketsList.delete}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}