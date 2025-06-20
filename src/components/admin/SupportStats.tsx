'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Ticket, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Users,
  Timer
} from 'lucide-react';
import { SupportStats as SupportStatsType } from '@/lib/types';
import { useAdminDictionary } from '@/hooks/useAdminDictionary';

interface SupportStatsProps {
  stats: SupportStatsType | null;
  loading?: boolean;
}

const StatCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  trendValue, 
  color = 'default' 
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'default' | 'success' | 'warning' | 'danger';
}) => {
  const colorClasses = {
    default: 'text-blue-600 bg-blue-100',
    success: 'text-green-600 bg-green-100',
    warning: 'text-yellow-600 bg-yellow-100',
    danger: 'text-red-600 bg-red-100'
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-full ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && trendValue && TrendIcon && (
          <div className={`flex items-center mt-2 text-xs ${trendColor}`}>
            <TrendIcon className="h-3 w-3 mr-1" />
            <span>{trendValue}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const StatCardSkeleton = () => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-8 rounded-full" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-32" />
    </CardContent>
  </Card>
);

export default function SupportStats({ stats, loading }: SupportStatsProps) {
  const dict = useAdminDictionary();

  if (loading || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const resolvedPercentage = stats.totalTickets > 0 
    ? ((stats.resolvedTickets / stats.totalTickets) * 100).toFixed(1)
    : '0';

  const avgResponseHours = stats.averageResponseTime 
    ? (stats.averageResponseTime / (1000 * 60 * 60)).toFixed(1)
    : '0';

  const avgResolutionHours = stats.averageResolutionTime 
    ? (stats.averageResolutionTime / (1000 * 60 * 60)).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={dict.supportDashboard.totalTickets}
          value={stats.totalTickets}
          description="All time tickets"
          icon={Ticket}
          color="default"
        />
        
        <StatCard
          title={dict.supportDashboard.openTickets}
          value={stats.openTickets}
          description="Currently open"
          icon={Clock}
          color="warning"
        />
        
        <StatCard
          title={dict.supportDashboard.resolvedTickets}
          value={stats.resolvedTickets}
          description={`${resolvedPercentage}% resolution rate`}
          icon={CheckCircle}
          color="success"
        />
        
        <StatCard
          title={dict.supportDashboard.criticalTickets}
          value={stats.criticalTickets}
          description="Needs immediate attention"
          icon={AlertTriangle}
          color="danger"
        />
      </div>

      {/* Performance Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Avg Response Time"
          value={`${avgResponseHours}h`}
          description="Time to first response"
          icon={Timer}
          color="default"
        />
        
        <StatCard
          title="Avg Resolution Time"
          value={`${avgResolutionHours}h`}
          description="Time to resolve"
          icon={CheckCircle}
          color="default"
        />
        
        <StatCard
          title="Active Assignees"
          value={stats.activeAssignees}
          description="Staff handling tickets"
          icon={Users}
          color="default"
        />
        
        <StatCard
          title="Unassigned"
          value={stats.unassignedTickets}
          description="Tickets without assignee"
          icon={AlertTriangle}
          color={stats.unassignedTickets > 0 ? 'warning' : 'success'}
        />
      </div>

      {/* Priority Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Breakdown</CardTitle>
          <CardDescription>
            Distribution of tickets by priority level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.priorityBreakdown.CRITICAL}
              </div>
              <div className="text-sm text-muted-foreground">
                {dict.ticketPriorities.CRITICAL}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.priorityBreakdown.HIGH}
              </div>
              <div className="text-sm text-muted-foreground">
                {dict.ticketPriorities.HIGH}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.priorityBreakdown.MEDIUM}
              </div>
              <div className="text-sm text-muted-foreground">
                {dict.ticketPriorities.MEDIUM}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {stats.priorityBreakdown.LOW}
              </div>
              <div className="text-sm text-muted-foreground">
                {dict.ticketPriorities.LOW}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Status Breakdown</CardTitle>
          <CardDescription>
            Current status distribution of all tickets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {Object.entries(stats.statusBreakdown).map(([status, count]) => (
              <div key={status} className="text-center">
                <div className="text-xl font-bold">{count}</div>
                <div className="text-sm text-muted-foreground">
                  {dict.ticketStatuses[status as keyof typeof dict.ticketStatuses]}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Type Breakdown</CardTitle>
          <CardDescription>
            Distribution of tickets by type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {Object.entries(stats.typeBreakdown).map(([type, count]) => (
              <div key={type} className="text-center">
                <div className="text-xl font-bold">{count}</div>
                <div className="text-sm text-muted-foreground">
                  {dict.ticketTypes[type as keyof typeof dict.ticketTypes]}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}