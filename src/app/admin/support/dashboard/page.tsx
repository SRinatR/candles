'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Ticket, 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Plus,
  TrendingUp,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { SupportStats, SupportTicket } from '@/lib/types';
import { useAdminDictionary } from '@/hooks/useAdminDictionary';

const PRIORITY_COLORS = {
  LOW: '#6B7280',
  MEDIUM: '#EAB308',
  HIGH: '#F97316',
  CRITICAL: '#EF4444'
};

const STATUS_COLORS = {
  OPEN: '#3B82F6',
  IN_PROGRESS: '#F59E0B',
  PENDING: '#8B5CF6',
  RESOLVED: '#10B981',
  CLOSED: '#6B7280',
  REOPENED: '#EF4444'
};

export default function SupportDashboard() {
  const dict = useAdminDictionary();
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/support/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!stats) return null;

  const priorityData = stats.ticketsByPriority.map(item => ({
    name: dict.ticketPriorities[item.priority as keyof typeof dict.ticketPriorities],
    value: item.count,
    color: PRIORITY_COLORS[item.priority as keyof typeof PRIORITY_COLORS]
  }));

  const statusData = stats.ticketsByStatus.map(item => ({
    name: dict.ticketStatuses[item.status as keyof typeof dict.ticketStatuses],
    value: item.count,
    color: STATUS_COLORS[item.status as keyof typeof STATUS_COLORS]
  }));

  const typeData = stats.ticketsByType.map(item => ({
    name: dict.ticketTypes[item.type as keyof typeof dict.ticketTypes],
    value: item.count
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {dict.supportDashboard.title}
          </h1>
          <p className="text-muted-foreground">
            Overview of support tickets and system performance
          </p>
        </div>
        <Link href="/admin/support/tickets/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {dict.supportDashboard.createNewTicket}
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {dict.supportDashboard.totalTickets}
            </CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTickets}</div>
            <p className="text-xs text-muted-foreground">
              All time tickets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {dict.supportDashboard.openTickets}
            </CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.openTickets}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {dict.supportDashboard.inProgressTickets}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.inProgressTickets}</div>
            <p className="text-xs text-muted-foreground">
              Being worked on
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {dict.supportDashboard.criticalTickets}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.criticalTickets}</div>
            <p className="text-xs text-muted-foreground">
              Needs immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {dict.supportDashboard.averageResolutionTime}
            </CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.averageResolutionTime.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              {dict.supportDashboard.hours}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{dict.supportDashboard.ticketsByType}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{dict.supportDashboard.ticketsByPriority}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{dict.supportDashboard.recentActivity}</CardTitle>
            <CardDescription>
              Latest ticket updates and changes
            </CardDescription>
          </div>
          <Link href="/admin/support/tickets">
            <Button variant="outline">
              {dict.supportDashboard.viewAllTickets}
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {dict.supportDashboard.noRecentActivity}
            </p>
          ) : (
            <div className="space-y-4">
              {stats.recentActivity.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <Link 
                        href={`/admin/support/tickets/${ticket.id}`}
                        className="font-medium hover:underline"
                      >
                        {ticket.ticketNumber}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {ticket.title}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={ticket.priority === 'CRITICAL' ? 'destructive' : 'secondary'}
                    >
                      {dict.ticketPriorities[ticket.priority as keyof typeof dict.ticketPriorities]}
                    </Badge>
                    <Badge variant="outline">
                      {dict.ticketStatuses[ticket.status as keyof typeof dict.ticketStatuses]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(ticket.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}