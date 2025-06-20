
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileSpreadsheet, 
  BarChartHorizontalBig, 
  Users2, 
  PackageSearch, 
  Download, 
  FileText, 
  FileX, 
  Calendar,
  Filter,
  RefreshCw,
  TrendingUp,
  DollarSign,
  ShoppingCart
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { useState, useEffect } from 'react';

// TODO: Localize texts when admin i18n is fully implemented
const reportTexts = {
  orderId: "Order ID",
  customer: "Customer",
  date: "Date",
  total: "Total",
  status: "Status",
  noOrdersFound: "No orders found in this report.",
  exportCSV: "Export CSV",
  exportExcel: "Export Excel",
  exportPDF: "Export PDF",
  filterByStatus: "Filter by Status",
  filterByDate: "Filter by Date",
  allStatuses: "All Statuses",
  refresh: "Refresh Data",
  totalRevenue: "Total Revenue",
  totalOrders: "Total Orders",
  avgOrderValue: "Avg. Order Value",
  searchPlaceholder: "Search orders...",
  dateFrom: "From Date",
  dateTo: "To Date",
  applyFilters: "Apply Filters",
  clearFilters: "Clear Filters"
};

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customerName: string;
  date: string; // Consider using Date type and formatting it
  totalAmount: number;
  status: string;
  items: OrderItem[];
}

interface SalesReportData {
  totalSales: number;
  numberOfOrders: number;
  averageOrderValue: number;
  orders: Order[];
}

export default function AdminReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [salesReportData, setSalesReportData] = useState<SalesReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);

  const fetchSalesReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/reports/sales');
      if (!response.ok) {
        throw new Error(`Failed to fetch sales report: ${response.statusText}`);
      }
      const data: SalesReportData = await response.json();
      setSalesReportData(data);
    } catch (err: any) {
      setError(err.message);
      setSalesReportData(null);
    }
    setIsLoading(false);
  };

  // Filter orders based on search term, status, and date range
  useEffect(() => {
    if (!salesReportData?.orders) {
      setFilteredOrders([]);
      return;
    }

    let filtered = salesReportData.orders;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(order => new Date(order.date) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(order => new Date(order.date) <= new Date(dateTo));
    }

    setFilteredOrders(filtered);
  }, [salesReportData, searchTerm, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (selectedReport === 'sales') {
      fetchSalesReport();
    }
  }, [selectedReport]);

  // Export functions
  const exportToCSV = () => {
    if (!filteredOrders.length) return;
    
    const headers = [reportTexts.orderId, reportTexts.customer, reportTexts.date, reportTexts.total, reportTexts.status];
    const csvContent = [
      headers.join(','),
      ...filteredOrders.map(order => [
        order.id,
        `"${order.customerName}"`,
        new Date(order.date).toLocaleDateString(),
        order.totalAmount,
        order.status
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    // For now, export as CSV with .xlsx extension
    // In a real application, you would use a library like xlsx
    exportToCSV();
  };

  const exportToPDF = () => {
    // For now, open print dialog
    // In a real application, you would use a library like jsPDF
    window.print();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'processing': return 'outline';
      default: return 'secondary';
    }
  };
  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
         <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive business intelligence and data export tools for enterprise-level reporting.
            </p>
        </div>
        {selectedReport === 'sales' && salesReportData && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchSalesReport()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {reportTexts.refresh}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
          <CardDescription>Select a report type to view or generate.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Button 
            variant="outline" 
            className={`flex flex-col items-start h-auto p-4 space-y-1 text-left whitespace-normal ${selectedReport === 'sales' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setSelectedReport(prev => prev === 'sales' ? null : 'sales')}
          >
            <div className="flex items-center space-x-2 mb-1">
                <BarChartHorizontalBig className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Sales Report</h3>
            </div>
            <p className="text-xs text-muted-foreground break-words whitespace-normal word-wrap">Analyze sales trends, revenue by period, best-selling products.</p>
          </Button>
           <Button variant="outline" className="flex flex-col items-start h-auto p-4 space-y-1 text-left whitespace-normal" disabled>
            <div className="flex items-center space-x-2 mb-1">
                <Users2 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Customer Report</h3>
            </div>
            <p className="text-xs text-muted-foreground break-words whitespace-normal word-wrap">Understand customer demographics, purchase history, and lifetime value.</p>
          </Button>
           <Button variant="outline" className="flex flex-col items-start h-auto p-4 space-y-1 text-left whitespace-normal" disabled>
            <div className="flex items-center space-x-2 mb-1">
                <PackageSearch className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Inventory Report</h3>
            </div>
            <p className="text-xs text-muted-foreground break-words whitespace-normal word-wrap">Track stock levels, identify low-stock items, and manage inventory value.</p>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated Reports Area</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mt-4 p-6 border rounded-md min-h-[200px]">
            {isLoading && <p className="text-center text-muted-foreground">Loading report data...</p>}
            {error && <p className="text-center text-destructive">Error: {error}</p>}
            {!isLoading && !error && selectedReport === 'sales' && salesReportData && (
              <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-muted-foreground break-words">{reportTexts.totalRevenue}</p>
                          <p className="text-2xl font-bold text-green-600 break-words" title={new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' }).format(salesReportData.totalSales)}>
                            {new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' }).format(salesReportData.totalSales)}
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                          <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-muted-foreground break-words">{reportTexts.totalOrders}</p>
                          <p className="text-2xl font-bold text-blue-600 break-words">{salesReportData.numberOfOrders}</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <ShoppingCart className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-muted-foreground break-words">{reportTexts.avgOrderValue}</p>
                          <p className="text-2xl font-bold text-purple-600 break-words" title={new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' }).format(salesReportData.averageOrderValue)}>
                            {new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' }).format(salesReportData.averageOrderValue)}
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                          <TrendingUp className="h-6 w-6 text-purple-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                {/* Export and Filter Controls */}
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between min-w-0">
                  <div className="flex flex-wrap gap-2 min-w-0 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={exportToCSV} disabled={!filteredOrders.length}>
                      <FileText className="h-4 w-4 mr-2" />
                      {reportTexts.exportCSV}
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportToExcel} disabled={!filteredOrders.length}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      {reportTexts.exportExcel}
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportToPDF} disabled={!filteredOrders.length}>
                      <FileX className="h-4 w-4 mr-2" />
                      {reportTexts.exportPDF}
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 items-center min-w-0 flex-shrink">
                    <Input
                      placeholder={reportTexts.searchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-48 min-w-0 flex-shrink-0"
                    />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40 min-w-0 flex-shrink-0">
                        <SelectValue placeholder={reportTexts.filterByStatus} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{reportTexts.allStatuses}</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-40 min-w-0 flex-shrink-0"
                      placeholder={reportTexts.dateFrom}
                    />
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-40 min-w-0 flex-shrink-0"
                      placeholder={reportTexts.dateTo}
                    />
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      <Filter className="h-4 w-4 mr-2" />
                      {reportTexts.clearFilters}
                    </Button>
                  </div>
                </div>
                
                {/* Orders Table */}
                {filteredOrders.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChartHorizontalBig className="h-5 w-5" />
                        Order Details ({filteredOrders.length} orders)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[120px] max-w-[150px]">{reportTexts.orderId}</TableHead>
                              <TableHead className="min-w-[150px] max-w-[200px]">{reportTexts.customer}</TableHead>
                              <TableHead className="min-w-[120px] max-w-[150px]">{reportTexts.date}</TableHead>
                              <TableHead className="text-right min-w-[120px] max-w-[150px]">{reportTexts.total}</TableHead>
                              <TableHead className="min-w-[100px] max-w-[120px]">{reportTexts.status}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredOrders.map((order) => (
                              <TableRow key={order.id} className="hover:bg-muted/50">
                                <TableCell className="font-mono text-sm max-w-[150px] break-words" title={order.id}>{order.id}</TableCell>
                                <TableCell className="font-medium max-w-[200px] break-words" title={order.customerName}>{order.customerName}</TableCell>
                                <TableCell className="text-muted-foreground max-w-[150px] break-words">
                                  {new Date(order.date).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })}
                                </TableCell>
                                <TableCell className="text-right font-semibold max-w-[150px] break-words" title={new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' }).format(order.totalAmount)}>
                                  {new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' }).format(order.totalAmount)}
                                </TableCell>
                                <TableCell className="max-w-[120px]">
                                  <Badge variant={getStatusBadgeVariant(order.status)} className="capitalize break-words">
                                    {order.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Orders Found</h3>
                      <p className="text-muted-foreground mb-4">{reportTexts.noOrdersFound}</p>
                      <Button variant="outline" onClick={clearFilters}>
                        {reportTexts.clearFilters}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
            {!isLoading && !error && selectedReport !== 'sales' && (
              <div className="text-center text-muted-foreground py-10">
                <FileSpreadsheet className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-lg font-semibold">Report Display Area</h3>
                <p className="text-sm">
                  Select a report type above to view details or generate a new report.
                </p>
              </div>
            )}
            {!isLoading && !error && selectedReport === 'sales' && !salesReportData && (
                 <p className="text-center text-muted-foreground">No data available for sales report.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
