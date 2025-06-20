'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { 
  Filter, 
  X, 
  Calendar as CalendarIcon,
  Search,
  RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';
import { TicketFilters as TicketFiltersType, TicketStatus, TicketPriority, TicketType, ProductArea } from '@/lib/types';
import { useAdminDictionary } from '@/hooks/useAdminDictionary';

interface TicketFiltersProps {
  filters: TicketFiltersType;
  onFiltersChange: (filters: TicketFiltersType) => void;
  onReset: () => void;
}

export default function TicketFilters({ filters, onFiltersChange, onReset }: TicketFiltersProps) {
  const dict = useAdminDictionary();
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: keyof TicketFiltersType, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const removeFilter = (key: keyof TicketFiltersType) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const getActiveFiltersCount = () => {
    return Object.keys(filters).filter(key => {
      const value = filters[key as keyof TicketFiltersType];
      return value !== undefined && value !== null && value !== '';
    }).length;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-4">
      {/* Search and Filter Toggle */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={dict.ticketFilters.searchPlaceholder}
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="mr-2 h-4 w-4" />
              {dict.ticketFilters.filters}
              {activeFiltersCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{dict.ticketFilters.filters}</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    onReset();
                    setIsOpen(false);
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  {dict.ticketFilters.reset}
                </Button>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label>{dict.ticketFilters.status}</Label>
                <Select
                  value={filters.status || ''}
                  onValueChange={(value) => updateFilter('status', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={dict.ticketFilters.allStatuses} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{dict.ticketFilters.allStatuses}</SelectItem>
                    {Object.entries(dict.ticketStatuses).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Filter */}
              <div className="space-y-2">
                <Label>{dict.ticketFilters.priority}</Label>
                <Select
                  value={filters.priority || ''}
                  onValueChange={(value) => updateFilter('priority', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={dict.ticketFilters.allPriorities} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{dict.ticketFilters.allPriorities}</SelectItem>
                    {Object.entries(dict.ticketPriorities).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div className="space-y-2">
                <Label>{dict.ticketFilters.type}</Label>
                <Select
                  value={filters.type || ''}
                  onValueChange={(value) => updateFilter('type', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={dict.ticketFilters.allTypes} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{dict.ticketFilters.allTypes}</SelectItem>
                    {Object.entries(dict.ticketTypes).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Product Area Filter */}
              <div className="space-y-2">
                <Label>{dict.ticketFilters.productArea}</Label>
                <Select
                  value={filters.productArea || ''}
                  onValueChange={(value) => updateFilter('productArea', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={dict.ticketFilters.allAreas} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{dict.ticketFilters.allAreas}</SelectItem>
                    {Object.entries(dict.productAreas).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assignee Filter */}
              <div className="space-y-2">
                <Label>{dict.ticketFilters.assignee}</Label>
                <Select
                  value={filters.assignedToId || ''}
                  onValueChange={(value) => updateFilter('assignedToId', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={dict.ticketFilters.allAssignees} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{dict.ticketFilters.allAssignees}</SelectItem>
                    <SelectItem value="unassigned">{dict.ticketFilters.unassigned}</SelectItem>
                    {/* Note: In a real implementation, you'd fetch and display actual users */}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filters */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>{dict.ticketFilters.createdFrom}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.createdFrom ? format(new Date(filters.createdFrom), 'MMM dd') : 'From'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.createdFrom ? new Date(filters.createdFrom) : undefined}
                        onSelect={(date) => updateFilter('createdFrom', date?.toISOString())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label>{dict.ticketFilters.createdTo}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.createdTo ? format(new Date(filters.createdTo), 'MMM dd') : 'To'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.createdTo ? new Date(filters.createdTo) : undefined}
                        onSelect={(date) => updateFilter('createdTo', date?.toISOString())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.status && (
            <Badge variant="secondary" className="gap-1">
              Status: {dict.ticketStatuses[filters.status as keyof typeof dict.ticketStatuses]}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('status')}
              />
            </Badge>
          )}
          
          {filters.priority && (
            <Badge variant="secondary" className="gap-1">
              Priority: {dict.ticketPriorities[filters.priority as keyof typeof dict.ticketPriorities]}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('priority')}
              />
            </Badge>
          )}
          
          {filters.type && (
            <Badge variant="secondary" className="gap-1">
              Type: {dict.ticketTypes[filters.type as keyof typeof dict.ticketTypes]}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('type')}
              />
            </Badge>
          )}
          
          {filters.productArea && (
            <Badge variant="secondary" className="gap-1">
              Area: {dict.productAreas[filters.productArea as keyof typeof dict.productAreas]}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('productArea')}
              />
            </Badge>
          )}
          
          {filters.assignedToId && (
            <Badge variant="secondary" className="gap-1">
              Assignee: {filters.assignedToId === 'unassigned' ? 'Unassigned' : 'Assigned'}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('assignedToId')}
              />
            </Badge>
          )}
          
          {filters.createdFrom && (
            <Badge variant="secondary" className="gap-1">
              From: {format(new Date(filters.createdFrom), 'MMM dd, yyyy')}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('createdFrom')}
              />
            </Badge>
          )}
          
          {filters.createdTo && (
            <Badge variant="secondary" className="gap-1">
              To: {format(new Date(filters.createdTo), 'MMM dd, yyyy')}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('createdTo')}
              />
            </Badge>
          )}
          
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: "{filters.search}"
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('search')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}