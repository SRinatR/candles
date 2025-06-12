"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MoreVertical, ArrowUpDown, FilterX, Eye, UserX, UserCheck, Edit3, Trash2 } from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import { mockAdminClients, type MockAdminClient } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { AdminLocale } from '@/admin/lib/i18n-config-admin';
import { i18nAdmin } from '@/admin/lib/i18n-config-admin';
import { getAdminDictionary } from '@/admin/lib/getAdminDictionary';
import type enAdminMessages from '@/admin/dictionaries/en.json';
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type AdminClientsPageDict = typeof enAdminMessages.adminClientsPage;
type SortableClientKeys = keyof Pick<MockAdminClient, 'name' | 'email' | 'registrationDate' | 'totalOrders' | 'totalSpent'>;


const ITEMS_PER_PAGE = 5;

const clientEditSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
});
type ClientEditFormValues = z.infer<typeof clientEditSchema>;

export default function AdminClientsPage() {
  const [clients, setClients] = useState<MockAdminClient[]>(mockAdminClients);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [dict, setDict] = useState<AdminClientsPageDict | null>(null);
  const [isClient, setIsClient] = useState(false);

  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'blocked'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortableClientKeys; direction: 'ascending' | 'descending' }>({ key: 'name', direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedClient, setSelectedClient] = useState<MockAdminClient | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  
  const editForm = useForm<ClientEditFormValues>({
    resolver: zodResolver(clientEditSchema),
    defaultValues: { name: "", email: "" },
  });

  useEffect(() => {
    setIsClient(true);
    const storedLocale = localStorage.getItem('admin-lang') as AdminLocale | null;
    const localeToLoad = storedLocale && i18nAdmin.locales.includes(storedLocale) ? storedLocale : i18nAdmin.defaultLocale;
    
    async function loadDictionary() {
      const fullDict = await getAdminDictionary(localeToLoad);
      setDict(fullDict.adminClientsPage);
    }
    loadDictionary();
  }, []);

  const processedClients = useMemo(() => {
    let filtered = clients.filter(client =>
      (client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (filterStatus === 'active') {
      filtered = filtered.filter(client => !client.isBlocked);
    } else if (filterStatus === 'blocked') {
      filtered = filtered.filter(client => client.isBlocked);
    }
    return filtered;
  }, [clients, searchTerm, filterStatus]);

  const sortedClients = useMemo(() => {
    let sortableItems = [...processedClients];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key!];
        const valB = b[sortConfig.key!];
        let comparison = 0;

        if (sortConfig.key === 'registrationDate') {
          comparison = new Date(valA as string).getTime() - new Date(valB as string).getTime();
        } else if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA - valB;
        } else if (typeof valA === 'string' && typeof valB === 'string') {
          comparison = valA.localeCompare(valB);
        }

        return sortConfig.direction === 'ascending' ? comparison : comparison * -1;
      });
    }
    return sortableItems;
  }, [processedClients, sortConfig]);

  const totalPages = Math.ceil(sortedClients.length / ITEMS_PER_PAGE);
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedClients.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedClients, currentPage]);

  const requestSort = (key: SortableClientKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const getSortIndicator = (columnKey: SortableClientKeys) => {
    if (sortConfig.key === columnKey) {
      return sortConfig.direction === 'ascending' ? <ArrowUpDown className="ml-1 h-3 w-3 inline" /> : <ArrowUpDown className="ml-1 h-3 w-3 inline transform rotate-180" />;
    }
    return <ArrowUpDown className="ml-1 h-3 w-3 inline opacity-30" />;
  };

  const toggleBlockClient = (clientId: string) => {
    if (!dict) return;
    setClients(prevClients =>
      prevClients.map(client =>
        client.id === clientId ? { ...client, isBlocked: !client.isBlocked } : client
      )
    );
    const client = clients.find(c => c.id === clientId);
    toast({
      title: client?.isBlocked ? (dict.clientUnblockedToastTitle || "Client Unblocked (Simulated)") : (dict.clientBlockedToastTitle || "Client Blocked (Simulated)"),
      description: `${client?.name} ${dict.clientStatusUpdatedToastDesc || "status has been updated locally."}`,
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  
  const clearAllFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setCurrentPage(1);
  };

  const openViewModal = (client: MockAdminClient) => {
    setSelectedClient(client);
    setIsViewModalOpen(true);
  };

  const openEditModal = (client: MockAdminClient) => {
    setSelectedClient(client);
    editForm.reset({ name: client.name, email: client.email });
    setIsEditModalOpen(true);
  };

  const openDeleteAlert = (client: MockAdminClient) => {
    setSelectedClient(client);
    setIsDeleteAlertOpen(true);
  };

  const handleEditSubmit = (data: ClientEditFormValues) => {
    if (!selectedClient || !dict) return;
    setClients(prevClients => 
      prevClients.map(c => c.id === selectedClient.id ? { ...c, name: data.name, email: data.email } : c)
    );
    toast({
      title: dict.editClientSuccessTitle || "Client Updated (Simulated)",
      description: (dict.editClientSuccessDesc || "Client '{name}' details have been updated locally.").replace('{name}', data.name),
    });
    setIsEditModalOpen(false);
    setSelectedClient(null);
  };

  const handleDeleteConfirm = () => {
    if (!selectedClient || !dict) return;
    setClients(prevClients => prevClients.filter(c => c.id !== selectedClient.id));
    toast({
      title: dict.deleteClientSuccessTitle || "Client Deleted (Simulated)",
      description: (dict.deleteClientSuccessDesc || "Client '{name}' has been deleted locally.").replace('{name}', selectedClient.name),
    });
    setIsDeleteAlertOpen(false);
    setSelectedClient(null);
  };

  if (!isClient || !dict) {
    return <div>Loading clients...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{dict.title}</h1>
        <p className="text-muted-foreground">{dict.description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{dict.listTitle}</CardTitle>
          <CardDescription>
            {dict.listDescription.replace('{count}', String(paginatedClients.length)).replace('{total}', String(sortedClients.length))}
          </CardDescription>
          <div className="flex flex-col sm:flex-row gap-4 mt-4 items-center">
            <div className="relative w-full sm:w-auto flex-grow sm:flex-grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={dict.searchPlaceholder}
                  className="pl-10 h-9 w-full sm:min-w-[250px]"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1);}}
                />
            </div>
            <div className="w-full sm:w-auto">
              <Select value={filterStatus} onValueChange={(value) => {setFilterStatus(value as 'all' | 'active' | 'blocked'); setCurrentPage(1);}}>
                <SelectTrigger className="h-9 w-full sm:w-[180px]">
                  <SelectValue placeholder={dict.filterByStatusLabel} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{dict.statusAll}</SelectItem>
                  <SelectItem value="active">{dict.statusActive}</SelectItem>
                  <SelectItem value="blocked">{dict.statusBlocked}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(searchTerm || filterStatus !== 'all') && (
              <Button variant="ghost" onClick={clearAllFilters} size="sm" className="text-xs w-full sm:w-auto">
                <FilterX className="mr-1 h-3 w-3" /> {dict.clearFiltersButton}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {paginatedClients.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer hover:bg-muted/50 px-2 py-2.5" onClick={() => requestSort('name')}>{dict.nameHeader} {getSortIndicator('name')}</TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50 px-2 py-2.5" onClick={() => requestSort('email')}>{dict.emailHeader} {getSortIndicator('email')}</TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50 px-2 py-2.5" onClick={() => requestSort('registrationDate')}>{dict.regDateHeader} {getSortIndicator('registrationDate')}</TableHead>
                      <TableHead className="text-right cursor-pointer hover:bg-muted/50 px-2 py-2.5" onClick={() => requestSort('totalOrders')}>{dict.totalOrdersHeader} {getSortIndicator('totalOrders')}</TableHead>
                      <TableHead className="text-right cursor-pointer hover:bg-muted/50 px-2 py-2.5" onClick={() => requestSort('totalSpent')}>{dict.totalSpentHeader} {getSortIndicator('totalSpent')}</TableHead>
                      <TableHead className="text-center px-2 py-2.5">{dict.statusHeader}</TableHead>
                      <TableHead className="text-right px-2 py-2.5">{dict.actionsHeader}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium px-2 py-3">{client.name}</TableCell>
                        <TableCell className="px-2 py-3">{client.email}</TableCell>
                        <TableCell className="px-2 py-3">{new Date(client.registrationDate).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right px-2 py-3">{client.totalOrders}</TableCell>
                        <TableCell className="text-right px-2 py-3">{client.totalSpent.toLocaleString('en-US')}</TableCell>
                        <TableCell className="text-center px-2 py-3">
                          <Badge variant={client.isBlocked ? "destructive" : "secondary"}>
                            {client.isBlocked ? dict.statusBlockedBadge : dict.statusActiveBadge}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-2 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{dict.actionsHeader}</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openViewModal(client)}>
                                <Eye className="mr-2 h-4 w-4" />
                                {dict.viewDetailsAction}
                              </DropdownMenuItem>
                               <DropdownMenuItem onClick={() => openEditModal(client)}>
                                <Edit3 className="mr-2 h-4 w-4" />
                                {dict.editClientAction}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleBlockClient(client.id)}>
                                {client.isBlocked ? (
                                  <UserCheck className="mr-2 h-4 w-4" />
                                ) : (
                                  <UserX className="mr-2 h-4 w-4" />
                                )}
                                {client.isBlocked ? dict.unblockClientAction : dict.blockClientAction}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openDeleteAlert(client)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                <Trash2 className="mr-2 h-4 w-4" />
                                {dict.deleteClientAction}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between space-x-2 py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    {dict.paginationPrevious}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {dict.paginationPageInfo.replace('{currentPage}', String(currentPage)).replace('{totalPages}', String(totalPages))}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    {dict.paginationNext}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-center py-8">{dict.noClientsFound}</p>
          )}
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground text-center">
        {dict.simulationNote}
      </p>

      {/* View Client Modal */}
      {selectedClient && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dict.viewClientModalTitle.replace('{name}', selectedClient.name)}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-4 text-sm">
              <p><strong>{dict.nameHeader}:</strong> {selectedClient.name}</p>
              <p><strong>{dict.emailHeader}:</strong> {selectedClient.email}</p>
              <p><strong>{dict.regDateHeader}:</strong> {new Date(selectedClient.registrationDate).toLocaleString()}</p>
              <p><strong>{dict.totalOrdersHeader}:</strong> {selectedClient.totalOrders}</p>
              <p><strong>{dict.totalSpentHeader}:</strong> {selectedClient.totalSpent.toLocaleString('en-US')} UZS</p>
              <div className="flex items-center space-x-2">
                <strong>{dict.statusHeader}:</strong>
                <Badge variant={selectedClient.isBlocked ? "destructive" : "secondary"}>
                  {selectedClient.isBlocked ? dict.statusBlockedBadge : dict.statusActiveBadge}
                </Badge>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">{dict.modalCloseButton}</Button></DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Client Modal */}
      {selectedClient && (
        <Dialog open={isEditModalOpen} onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) setSelectedClient(null);
        }}>
          <DialogContent>
            <FormProvider {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditSubmit)}>
                <DialogHeader>
                  <DialogTitle>{dict.editClientModalTitle.replace('{name}', selectedClient.name)}</DialogTitle>
                  <DialogDescription>{dict.editClientModalDesc}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{dict.nameLabel}</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{dict.emailLabel}</FormLabel>
                        <FormControl><Input type="email" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="outline">{dict.modalCancelButton}</Button></DialogClose>
                  <Button type="submit" disabled={editForm.formState.isSubmitting}>{dict.modalSaveChangesButton}</Button>
                </DialogFooter>
              </form>
            </FormProvider>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Client Alert */}
      {selectedClient && (
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={(open) => {
          setIsDeleteAlertOpen(open);
          if (!open) setSelectedClient(null);
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{dict.deleteClientAlertTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                {(dict.deleteClientAlertDesc || "Are you sure you want to delete client '{name}'? This action cannot be undone and is simulated.").replace('{name}', selectedClient.name)}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{dict.modalCancelButton}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {dict.modalDeleteButton}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
