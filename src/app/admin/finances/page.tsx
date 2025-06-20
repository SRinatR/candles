
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, TrendingUpIcon, TrendingDownIcon, DollarSignIcon, CreditCardIcon, FilterIcon, DownloadIcon, PlusIcon, Wallet, ShoppingCart, BarChart3, PieChart, Receipt, Download } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  status: string;
  type: 'INCOME' | 'EXPENSE';
  category: {
    name: string;
    type: string;
  };
  createdBy: {
    name: string;
    email: string;
  };
  order?: {
    orderNumber: string;
  };
}

interface FinanceData {
  transactions: Transaction[];
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    transactionCount: number;
  };
  categories: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  transactionTypes: Array<{
    id: string;
    name: string;
  }>;
  categoryStats: Array<{
    categoryId: string;
    categoryName: string;
    _sum: { amount: number };
    _count: { id: number };
  }>;
}

// Mock financial data
const mockTransactions: Transaction[] = [
  {
    id: '1',
    date: '2024-01-15',
    type: 'INCOME',
    category: { name: 'Продажи', type: 'INCOME' },
    description: 'Заказ #1001 - Корпоративный набор свечей',
    amount: 2500000,
    status: 'COMPLETED',
    createdBy: { name: 'Admin', email: 'admin@example.com' },
    order: { orderNumber: '1001' }
  },
  {
    id: '2',
    date: '2024-01-14',
    type: 'EXPENSE',
    category: { name: 'Материалы', type: 'EXPENSE' },
    description: 'Закупка соевого воска',
    amount: -450000,
    status: 'COMPLETED',
    createdBy: { name: 'Admin', email: 'admin@example.com' }
  },
  {
    id: '3',
    date: '2024-01-14',
    type: 'INCOME',
    category: { name: 'Продажи', type: 'INCOME' },
    description: 'Заказ #1002 - Ароматические свечи',
    amount: 890000,
    status: 'COMPLETED',
    createdBy: { name: 'Admin', email: 'admin@example.com' },
    order: { orderNumber: '1002' }
  },
  {
    id: '4',
    date: '2024-01-13',
    type: 'EXPENSE',
    category: { name: 'Логистика', type: 'EXPENSE' },
    description: 'Доставка товаров клиентам',
    amount: -120000,
    status: 'COMPLETED',
    createdBy: { name: 'Admin', email: 'admin@example.com' }
  },
  {
    id: '5',
    date: '2024-01-13',
    type: 'EXPENSE',
    category: { name: 'Маркетинг', type: 'EXPENSE' },
    description: 'Реклама в социальных сетях',
    amount: -300000,
    status: 'PENDING',
    createdBy: { name: 'Admin', email: 'admin@example.com' }
  },
  {
    id: '6',
    date: '2024-01-12',
    type: 'INCOME',
    category: { name: 'Продажи', type: 'INCOME' },
    description: 'Заказ #1003 - Свадебные комплименты',
    amount: 1200000,
    status: 'COMPLETED',
    createdBy: { name: 'Admin', email: 'admin@example.com' },
    order: { orderNumber: '1003' }
  }
];

const mockSummary = {
  totalIncome: 125780500,
  totalExpenses: 30120750,
  netProfit: 95659750,
  transactionCount: 6
};

export default function AdminFinancesPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [activeTab, setActiveTab] = useState('transactions');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [financeData, setFinanceData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Загрузка данных из API
  const fetchFinanceData = async (isInitialLoad = false) => {
    try {
      // Используем разные состояния для первоначальной загрузки и обновлений
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setIsUpdating(true);
      }
      
      const params = new URLSearchParams({
        period: selectedPeriod,
        ...(selectedType !== 'all' && { type: selectedType }),
        ...(selectedCategory !== 'all' && { category: selectedCategory })
      });
      
      const response = await fetch(`/api/admin/finances?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setFinanceData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Ошибка при загрузке данных');
      }
    } catch (err) {
      console.error('Ошибка при загрузке финансовых данных:', err);
      setError('Ошибка при загрузке данных');
      // Используем мок данные в случае ошибки
      setFinanceData({
        transactions: mockTransactions,
        summary: mockSummary,
        categories: [
          { id: '1', name: 'Продажи', type: 'INCOME' },
          { id: '2', name: 'Материалы', type: 'EXPENSE' },
          { id: '3', name: 'Маркетинг', type: 'EXPENSE' },
          { id: '4', name: 'Логистика', type: 'EXPENSE' }
        ],
        transactionTypes: [
          { id: '1', name: 'Продажа' },
          { id: '2', name: 'Закупка' },
          { id: '3', name: 'Реклама' }
        ],
        categoryStats: []
      });
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setIsUpdating(false);
      }
    }
  };

  // Первоначальная загрузка данных
  useEffect(() => {
    fetchFinanceData(true);
  }, []);

  // Обновление данных при изменении фильтров
  useEffect(() => {
    if (financeData) { // Только если данные уже загружены
      const timeoutId = setTimeout(() => {
        fetchFinanceData(false);
      }, 150); // Увеличиваем задержку для более плавного перехода

      return () => clearTimeout(timeoutId);
    }
  }, [selectedPeriod, selectedCategory, selectedType]);

  const transactions = financeData?.transactions || mockTransactions;
  const summary = financeData?.summary || mockSummary;

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    // Filter by search term
    if (searchTerm && !(
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.name.toLowerCase().includes(searchTerm.toLowerCase())
    )) {
      return false;
    }

    // Filter by type
    if (typeFilter !== 'all') {
      const isIncome = transaction.amount > 0;
      if (typeFilter === 'income' && !isIncome) return false;
      if (typeFilter === 'expense' && isIncome) return false;
    }

    // Filter by category
    if (categoryFilter !== 'all' && transaction.category.name !== categoryFilter) {
      return false;
    }

    // Filter by status
    if (statusFilter !== 'all' && transaction.status !== statusFilter) {
      return false;
    }

    // Filter by date range
    if (dateFrom && new Date(transaction.date) < new Date(dateFrom)) {
      return false;
    }
    if (dateTo && new Date(transaction.date) > new Date(dateTo)) {
      return false;
    }

    return true;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getUniqueCategories = () => {
    return Array.from(new Set(transactions.map(t => t.category.name)));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Загрузка финансовых данных...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Внимание</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>{error}. Отображаются тестовые данные.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Финансы</h1>
          <p className="text-muted-foreground">
            Управление финансовыми потоками, анализ доходов и расходов
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchFinanceData}>
            <DownloadIcon className="mr-2 h-4 w-4" />
            Обновить данные
          </Button>
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Добавить транзакцию
          </Button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 transition-opacity duration-300 ${isUpdating ? 'opacity-60' : 'opacity-100'}`}>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общий доход</CardTitle>
            <DollarSignIcon className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              {formatCurrency(summary.totalIncome)}
            </div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUpIcon className="mr-1 h-3 w-3" />
              Всего транзакций: {summary.transactionCount}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общие расходы</CardTitle>
            <CreditCardIcon className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">
              {formatCurrency(summary.totalExpenses)}
            </div>
            <div className="flex items-center text-xs text-red-600">
              <TrendingDownIcon className="mr-1 h-3 w-3" />
              Расходы за период
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Чистая прибыль</CardTitle>
            <DollarSignIcon className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {formatCurrency(summary.netProfit)}
            </div>
            <div className="flex items-center text-xs text-blue-600">
              <TrendingUpIcon className="mr-1 h-3 w-3" />
              Прибыль за период
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Средний чек</CardTitle>
            <Wallet className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
              {formatCurrency(1250000)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ShoppingCart className="mr-1 h-3 w-3" />
              За последний месяц
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Транзакции</TabsTrigger>
          <TabsTrigger value="analytics">Аналитика</TabsTrigger>
          <TabsTrigger value="reports">Отчеты</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FilterIcon className="h-5 w-5" />
                Фильтры
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                <div className="space-y-2">
                  <Label htmlFor="search">Поиск</Label>
                  <Input
                    id="search"
                    placeholder="Поиск по описанию..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Тип</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все типы</SelectItem>
                      <SelectItem value="income">Доходы</SelectItem>
                      <SelectItem value="expense">Расходы</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Категория</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все категории</SelectItem>
                      {getUniqueCategories().map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Статус</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все статусы</SelectItem>
                      <SelectItem value="completed">Завершено</SelectItem>
                      <SelectItem value="pending">В ожидании</SelectItem>
                      <SelectItem value="cancelled">Отменено</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFrom">Дата от</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateTo">Дата до</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Список транзакций</CardTitle>
              <CardDescription>
                Показано {filteredTransactions.length} из {transactions.length} транзакций
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Категория</TableHead>
                    <TableHead>Описание</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(transaction.date).toLocaleDateString('ru-RU')}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={transaction.amount > 0 ? 'default' : 'secondary'}
                          className={transaction.amount > 0 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}
                        >
                          {transaction.amount > 0 ? (
                            <><TrendingUpIcon className="mr-1 h-3 w-3" /> Доход</>
                          ) : (
                            <><TrendingDownIcon className="mr-1 h-3 w-3" /> Расход</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.category.name}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell className={transaction.amount > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={transaction.status === 'completed' ? 'default' : transaction.status === 'pending' ? 'secondary' : 'destructive'}
                        >
                          {transaction.status === 'completed' && 'Завершено'}
                          {transaction.status === 'pending' && 'В ожидании'}
                          {transaction.status === 'cancelled' && 'Отменено'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Period Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Период анализа
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button 
                  variant={selectedPeriod === '7' ? 'default' : 'outline'} 
                  size="sm"
                  disabled={isUpdating}
                  className="transition-all duration-200 ease-in-out"
                  onClick={(e) => {
                    e.preventDefault();
                    if (selectedPeriod !== '7') {
                      setSelectedPeriod('7');
                    }
                  }}
                >
                  {isUpdating && selectedPeriod === '7' ? (
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                      <span>7 дней</span>
                    </div>
                  ) : (
                    '7 дней'
                  )}
                </Button>
                <Button 
                  variant={selectedPeriod === '30' ? 'default' : 'outline'} 
                  size="sm"
                  disabled={isUpdating}
                  className="transition-all duration-200 ease-in-out"
                  onClick={(e) => {
                    e.preventDefault();
                    if (selectedPeriod !== '30') {
                      setSelectedPeriod('30');
                    }
                  }}
                >
                  {isUpdating && selectedPeriod === '30' ? (
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                      <span>30 дней</span>
                    </div>
                  ) : (
                    '30 дней'
                  )}
                </Button>
                <Button 
                  variant={selectedPeriod === '90' ? 'default' : 'outline'} 
                  size="sm"
                  disabled={isUpdating}
                  className="transition-all duration-200 ease-in-out"
                  onClick={(e) => {
                    e.preventDefault();
                    if (selectedPeriod !== '90') {
                      setSelectedPeriod('90');
                    }
                  }}
                >
                  {isUpdating && selectedPeriod === '90' ? (
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                      <span>3 месяца</span>
                    </div>
                  ) : (
                    '3 месяца'
                  )}
                </Button>
                <Button 
                  variant={selectedPeriod === '365' ? 'default' : 'outline'} 
                  size="sm"
                  disabled={isUpdating}
                  className="transition-all duration-200 ease-in-out"
                  onClick={(e) => {
                    e.preventDefault();
                    if (selectedPeriod !== '365') {
                      setSelectedPeriod('365');
                    }
                  }}
                >
                  {isUpdating && selectedPeriod === '365' ? (
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                      <span>Год</span>
                    </div>
                  ) : (
                    'Год'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Charts Row */}
          <div className={`grid gap-4 md:grid-cols-2 transition-opacity duration-300 ${isUpdating ? 'opacity-60' : 'opacity-100'}`}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Динамика доходов и расходов
                </CardTitle>
                <CardDescription>
                  Сравнение доходов и расходов за выбранный период
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 space-y-4">
                  {/* Dynamic Bar Chart Visualization */}
                  <div className="flex items-end justify-between h-40 px-4">
                    {(() => {
                      // Determine number of bars and labels based on selectedPeriod
                      let bars = [];
                      let labels = [];
                      let groupBy = 'day';
                      let dateFormat = 'dd.MM';
                      let period = parseInt(selectedPeriod, 10);
                      if (period === 7) {
                        bars = Array.from({ length: 7 });
                        labels = Array.from({ length: 7 }, (_, i) => {
                          const d = new Date();
                          d.setDate(d.getDate() - (6 - i));
                          return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
                        });
                      } else if (period === 30) {
                        bars = Array.from({ length: 4 });
                        labels = ['1-7', '8-14', '15-21', '22-30'];
                        groupBy = 'week';
                      } else if (period === 90) {
                        bars = Array.from({ length: 3 });
                        labels = ['1-30', '31-60', '61-90'];
                        groupBy = 'monthpart';
                      } else if (period === 365) {
                        bars = Array.from({ length: 12 });
                        labels = Array.from({ length: 12 }, (_, i) => {
                          const d = new Date();
                          d.setMonth(d.getMonth() - (11 - i));
                          return d.toLocaleDateString('ru-RU', { month: 'short' });
                        });
                        groupBy = 'month';
                      }
                      // Prepare data for each bar
                      const now = new Date();
                      const barData = bars.map((_, idx) => {
                        let income = 0;
                        let expense = 0;
                        filteredTransactions.forEach(tr => {
                          const trDate = new Date(tr.date);
                          if (period === 7) {
                            const barDate = new Date();
                            barDate.setDate(now.getDate() - (6 - idx));
                            if (trDate.toDateString() === barDate.toDateString()) {
                              if (tr.amount > 0) income += tr.amount;
                              else expense += Math.abs(tr.amount);
                            }
                          } else if (period === 30) {
                            const weekIdx = Math.floor((trDate.getDate() - 1) / 7);
                            if (weekIdx === idx && trDate.getMonth() === now.getMonth() && trDate.getFullYear() === now.getFullYear()) {
                              if (tr.amount > 0) income += tr.amount;
                              else expense += Math.abs(tr.amount);
                            }
                          } else if (period === 90) {
                            const diffDays = Math.floor((now - trDate) / (1000 * 60 * 60 * 24));
                            if (diffDays >= (90 - (idx + 1) * 30) && diffDays < (90 - idx * 30)) {
                              if (tr.amount > 0) income += tr.amount;
                              else expense += Math.abs(tr.amount);
                            }
                          } else if (period === 365) {
                            const diffMonths = (now.getFullYear() - trDate.getFullYear()) * 12 + (now.getMonth() - trDate.getMonth());
                            if (diffMonths === 11 - idx) {
                              if (tr.amount > 0) income += tr.amount;
                              else expense += Math.abs(tr.amount);
                            }
                          }
                        });
                        return { income, expense };
                      });
                      return bars.map((_, idx) => (
                        <div key={idx} className="flex flex-col items-center space-y-1">
                          <div className="flex flex-col items-center space-y-1">
                            <div 
                              className="w-6 bg-green-500 rounded-t" 
                              style={{ height: `${barData[idx].income / 1000000}px` }}
                              title={`Доход: ${barData[idx].income.toLocaleString()} UZS`}
                            />
                            <div 
                              className="w-6 bg-red-500 rounded-b" 
                              style={{ height: `${barData[idx].expense / 1000000}px` }}
                              title={`Расход: ${barData[idx].expense.toLocaleString()} UZS`}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{labels[idx]}</span>
                        </div>
                      ));
                    })()}
                  </div>
                  <div className="flex justify-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span>Доходы</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span>Расходы</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Структура расходов
                </CardTitle>
                <CardDescription>
                  Распределение расходов по категориям
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  {/* Simplified Pie Chart */}
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {/* Materials - 45% */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="20"
                        strokeDasharray="113 251"
                        strokeDashoffset="0"
                      />
                      {/* Marketing - 30% */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="20"
                        strokeDasharray="75 289"
                        strokeDashoffset="-113"
                      />
                      {/* Logistics - 25% */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="20"
                        strokeDasharray="63 301"
                        strokeDashoffset="-188"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-lg font-bold">{formatCurrency(summary.totalExpenses)}</div>
                        <div className="text-xs text-muted-foreground">Всего</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span className="text-sm">Материалы</span>
                    </div>
                    <span className="text-sm font-medium">45%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span className="text-sm">Маркетинг</span>
                    </div>
                    <span className="text-sm font-medium">30%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-sm">Логистика</span>
                    </div>
                    <span className="text-sm font-medium">25%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Ключевые показатели</CardTitle>
              <CardDescription>
                Основные финансовые метрики за выбранный период
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="text-2xl font-bold text-blue-600">
                    {((summary.netProfit / summary.totalIncome) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Маржинальность</div>
                  <div className="text-xs text-blue-600 mt-1">↗ +2.3% к прошлому месяцу</div>
                </div>
                <div className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="text-2xl font-bold text-green-600">+15.2%</div>
                  <div className="text-sm text-muted-foreground">Рост доходов</div>
                  <div className="text-xs text-green-600 mt-1">За последние 30 дней</div>
                </div>
                <div className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="text-2xl font-bold text-purple-600">
                    {((summary.totalExpenses / summary.totalIncome) * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Доля расходов</div>
                  <div className="text-xs text-purple-600 mt-1">От общего дохода</div>
                </div>
                <div className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(summary.totalIncome / summary.transactionCount)}
                  </div>
                  <div className="text-sm text-muted-foreground">Средний чек</div>
                  <div className="text-xs text-orange-600 mt-1">За транзакцию</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Анализ по категориям
              </CardTitle>
              <CardDescription>
                Детальная разбивка доходов и расходов по категориям
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Income Categories */}
                <div>
                  <h4 className="font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                    <TrendingUpIcon className="h-4 w-4" />
                    Доходы по категориям
                  </h4>
                  <div className="space-y-3">
                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg shadow-md border-l-4 border-green-400 dark:border-green-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-green-900 dark:text-green-100">Продажи свечей</div>
                          <div className="text-sm text-green-700 dark:text-green-300">Основной доход</div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-extrabold text-green-800 dark:text-green-200">{formatCurrency(4590000)}</div>
                          <div className="text-base font-medium text-green-600 dark:text-green-400">73% от общего дохода</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg shadow-md border-l-4 border-blue-400 dark:border-blue-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-blue-900 dark:text-blue-100">Корпоративные заказы</div>
                          <div className="text-sm text-blue-700 dark:text-blue-300">B2B продажи</div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-extrabold text-blue-800 dark:text-blue-200">{formatCurrency(1700000)}</div>
                          <div className="text-base font-medium text-blue-600 dark:text-blue-400">27% от общего дохода</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expense Categories */}
                <div>
                  <h4 className="font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                    <TrendingDownIcon className="h-4 w-4" />
                    Расходы по категориям
                  </h4>
                  <div className="space-y-3">
                    <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900 dark:to-red-800 rounded-lg shadow-md border-l-4 border-red-400 dark:border-red-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-red-900 dark:text-red-100">Материалы и сырье</div>
                          <div className="text-sm text-red-700 dark:text-red-300">Воск, фитили, ароматы</div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-extrabold text-red-800 dark:text-red-200">{formatCurrency(450000)}</div>
                          <div className="text-base font-medium text-red-600 dark:text-red-400">45% от расходов</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800 rounded-lg shadow-md border-l-4 border-yellow-400 dark:border-yellow-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-yellow-900 dark:text-yellow-100">Маркетинг и реклама</div>
                          <div className="text-sm text-yellow-700 dark:text-yellow-300">Продвижение, соцсети</div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-extrabold text-yellow-800 dark:text-yellow-200">{formatCurrency(300000)}</div>
                          <div className="text-base font-medium text-yellow-600 dark:text-yellow-400">30% от расходов</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-md border-l-4 border-red-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-purple-900 dark:text-purple-100">Логистика и доставка</div>
                          <div className="text-sm text-purple-700 dark:text-purple-300">Транспорт, упаковка</div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-extrabold text-purple-800 dark:text-purple-200">{formatCurrency(120000)}</div>
                          <div className="text-base font-medium text-purple-600 dark:text-purple-400">25% от расходов</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Финансовые отчеты</CardTitle>
              <CardDescription>
                Генерация и экспорт детализированных финансовых отчетов
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Receipt className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">Отчет о прибылях и убытках</h3>
                      <p className="text-sm text-muted-foreground">Детальный P&L отчет</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" disabled>
                    <Download className="mr-2 h-4 w-4" />
                    Скачать (скоро)
                  </Button>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <BarChart3 className="h-8 w-8 text-green-600" />
                    <div>
                      <h3 className="font-semibold">Отчет по продажам</h3>
                      <p className="text-sm text-muted-foreground">Анализ продаж по периодам</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" disabled>
                    <Download className="mr-2 h-4 w-4" />
                    Скачать (скоро)
                  </Button>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <PieChart className="h-8 w-8 text-purple-600" />
                    <div>
                      <h3 className="font-semibold">Отчет по расходам</h3>
                      <p className="text-sm text-muted-foreground">Структура затрат</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" disabled>
                    <Download className="mr-2 h-4 w-4" />
                    Скачать (скоро)
                  </Button>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    
