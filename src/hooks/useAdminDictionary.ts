'use client';

import { useState, useEffect } from 'react';

// Type definitions for admin dictionary
export interface AdminDictionary {
  adminLayout: {
    dashboard: string;
    products: string;
    allProducts: string;
    drafts: string;
    articles: string;
    attributes: string;
    categories: string;
    materials: string;
    scents: string;
    sales: string;
    clients: string;
    marketing: string;
    reports: string;
    finances: string;
    discounts: string;
    content: string;
    settings: string;
    management: string;
    logs: string;
    sessions: string;
    support: string;
    supportDashboard: string;
    supportTickets: string;
    createTicket: string;
    logout: string;
    loggedInAs: string;
    role: string;
    adminPanelTitle: string;
    mobileMenuTitle: string;
    toggleSidebarExpand: string;
    toggleSidebarCollapse: string;
    themeToggleLight: string;
    themeToggleDark: string;
    selectLanguage: string;
    langEn: string;
    langRu: string;
  };
  adminDashboardPage: {
    title: string;
    welcomeMessage: string;
    totalRevenue: string;
    fromLastMonth: string;
    totalPayments: string;
    successfulPayments: string;
    activeProducts: string;
    newThisWeek: string;
    totalTransactions: string;
    [key: string]: string;
  };
  supportDashboard: {
    title: string;
    overview: string;
    totalTickets: string;
    openTickets: string;
    inProgressTickets: string;
    resolvedTickets: string;
    criticalTickets: string;
    averageResolutionTime: string;
    hours: string;
    recentActivity: string;
    ticketsByType: string;
    ticketsByPriority: string;
    ticketsByStatus: string;
    assigneeWorkload: string;
    noData: string;
    viewAllTickets: string;
    createNewTicket: string;
    [key: string]: string;
  };
  createTicket: {
    title: string;
    ticketTitle: string;
    titlePlaceholder: string;
    description: string;
    descriptionPlaceholder: string;
    type: string;
    selectType: string;
    priority: string;
    selectPriority: string;
    productArea: string;
    selectArea: string;
    assignTo: string;
    selectAssignee: string;
    tags: string;
    tagsPlaceholder: string;
    estimatedHours: string;
    dueDate: string;
    attachments: string;
    dragDropFiles: string;
    maxFileSize: string;
    supportedFormats: string;
    createTicket: string;
    cancel: string;
    creating: string;
    ticketCreated: string;
    createError: string;
    [key: string]: string;
  };
  supportTickets: {
    title: string;
    createTicket: string;
    searchPlaceholder: string;
    filterAll: string;
    filterOpen: string;
    filterInProgress: string;
    filterResolved: string;
    filterClosed: string;
    sortNewest: string;
    sortOldest: string;
    sortPriority: string;
    sortStatus: string;
    noTickets: string;
    ticketNumber: string;
    title: string;
    status: string;
    priority: string;
    assignee: string;
    created: string;
    updated: string;
    actions: string;
    view: string;
    edit: string;
    delete: string;
    [key: string]: string;
  };
  ticketDetails: {
    backToTickets: string;
    ticketDetails: string;
    editTicket: string;
    deleteTicket: string;
    status: string;
    priority: string;
    type: string;
    productArea: string;
    assignedTo: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    resolvedAt: string;
    description: string;
    attachments: string;
    messages: string;
    history: string;
    addMessage: string;
    messagePlaceholder: string;
    attachFiles: string;
    sendMessage: string;
    internalNote: string;
    publicReply: string;
    [key: string]: string;
  };
  ticketTypes: {
    BUG: string;
    FEATURE: string;
    SUPPORT: string;
    COMPLAINT: string;
    QUESTION: string;
    [key: string]: string;
  };
  ticketPriorities: {
    LOW: string;
    MEDIUM: string;
    HIGH: string;
    CRITICAL: string;
    [key: string]: string;
  };
  ticketStatuses: {
    OPEN: string;
    IN_PROGRESS: string;
    PENDING: string;
    RESOLVED: string;
    CLOSED: string;
    REOPENED: string;
    [key: string]: string;
  };
  productAreas: {
    FRONTEND: string;
    BACKEND: string;
    ADMIN_PANEL: string;
    DATABASE: string;
    API: string;
    MOBILE: string;
    PAYMENT: string;
    INVENTORY: string;
    USERS: string;
    ORDERS: string;
    ANALYTICS: string;
    SECURITY: string;
    MARKETING: string;
    SUPPORT: string;
    OTHER: string;
    [key: string]: string;
  };
  [key: string]: any;
}

type AdminLanguage = 'en' | 'ru';

const defaultLanguage: AdminLanguage = 'en';

// Default dictionary fallback
const defaultDictionary: Partial<AdminDictionary> = {
  adminLayout: {
    dashboard: 'Dashboard',
    products: 'Products',
    allProducts: 'All Products',
    drafts: 'Drafts',
    articles: 'Articles',
    attributes: 'Attributes',
    categories: 'Categories',
    materials: 'Materials',
    scents: 'Scents',
    sales: 'Sales',
    clients: 'Clients',
    marketing: 'Marketing',
    reports: 'Reports',
    finances: 'Finances',
    discounts: 'Discounts',
    content: 'Content',
    settings: 'Settings',
    management: 'User Management',
    logs: 'Logs',
    sessions: 'Sessions',
    support: 'Support',
    supportDashboard: 'Support Dashboard',
    supportTickets: 'Tickets',
    createTicket: 'Create Ticket',
    logout: 'Logout',
    loggedInAs: 'Logged in as: {role}',
    role: 'Role: {role}',
    adminPanelTitle: 'Admin Panel',
    mobileMenuTitle: 'Admin Menu',
    toggleSidebarExpand: 'Expand sidebar',
    toggleSidebarCollapse: 'Collapse sidebar',
    themeToggleLight: 'Switch to Light Theme',
    themeToggleDark: 'Switch to Dark Theme',
    selectLanguage: 'Select Language',
    langEn: 'English',
    langRu: 'Russian'
  },
  supportDashboard: {
    title: 'Support Dashboard',
    overview: 'Overview',
    totalTickets: 'Total Tickets',
    openTickets: 'Open Tickets',
    inProgressTickets: 'In Progress',
    resolvedTickets: 'Resolved',
    criticalTickets: 'Critical',
    averageResolutionTime: 'Avg Resolution Time',
    hours: 'hours',
    recentActivity: 'Recent Activity',
    ticketsByType: 'Tickets by Type',
    ticketsByPriority: 'Tickets by Priority',
    ticketsByStatus: 'Tickets by Status',
    assigneeWorkload: 'Assignee Workload',
    noData: 'No data available',
    viewAllTickets: 'View All Tickets',
    createNewTicket: 'Create New Ticket'
  },
  createTicket: {
    title: 'Create New Ticket',
    ticketTitle: 'Ticket Title',
    titlePlaceholder: 'Enter ticket title...',
    description: 'Description',
    descriptionPlaceholder: 'Describe the issue or request...',
    type: 'Type',
    selectType: 'Select ticket type',
    priority: 'Priority',
    selectPriority: 'Select priority',
    productArea: 'Product Area',
    selectArea: 'Select product area',
    assignTo: 'Assign To',
    selectAssignee: 'Select assignee',
    tags: 'Tags',
    tagsPlaceholder: 'Add tags (comma separated)',
    estimatedHours: 'Estimated Hours',
    dueDate: 'Due Date',
    attachments: 'Attachments',
    dragDropFiles: 'Drag and drop files here or click to browse',
    maxFileSize: 'Max file size: 10MB',
    supportedFormats: 'Supported formats: PDF, DOC, DOCX, TXT, PNG, JPG, JPEG',
    createTicket: 'Create Ticket',
    cancel: 'Cancel',
    creating: 'Creating...',
    ticketCreated: 'Ticket created successfully!',
    createError: 'Failed to create ticket. Please try again.'
  },
  supportTickets: {
    title: 'Support Tickets',
    createTicket: 'Create Ticket',
    searchPlaceholder: 'Search tickets...',
    filterAll: 'All',
    filterOpen: 'Open',
    filterInProgress: 'In Progress',
    filterResolved: 'Resolved',
    filterClosed: 'Closed',
    sortNewest: 'Newest First',
    sortOldest: 'Oldest First',
    sortPriority: 'Priority',
    sortStatus: 'Status',
    noTickets: 'No tickets found',
    ticketNumber: 'Ticket #',
    title: 'Title',
    status: 'Status',
    priority: 'Priority',
    assignee: 'Assignee',
    created: 'Created',
    updated: 'Updated',
    actions: 'Actions',
    view: 'View',
    edit: 'Edit',
    delete: 'Delete'
  },
  ticketDetails: {
    backToTickets: 'Back to Tickets',
    ticketDetails: 'Ticket Details',
    editTicket: 'Edit Ticket',
    deleteTicket: 'Delete Ticket',
    status: 'Status',
    priority: 'Priority',
    type: 'Type',
    productArea: 'Product Area',
    assignedTo: 'Assigned To',
    createdBy: 'Created By',
    createdAt: 'Created At',
    updatedAt: 'Updated At',
    resolvedAt: 'Resolved At',
    description: 'Description',
    attachments: 'Attachments',
    messages: 'Messages',
    history: 'History',
    addMessage: 'Add Message',
    messagePlaceholder: 'Type your message...',
    attachFiles: 'Attach Files',
    sendMessage: 'Send Message',
    internalNote: 'Internal Note',
    publicReply: 'Public Reply'
  },
  ticketTypes: {
    BUG: 'Bug',
    FEATURE: 'Feature Request',
    SUPPORT: 'Support',
    COMPLAINT: 'Complaint',
    QUESTION: 'Question'
  },
  ticketPriorities: {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    CRITICAL: 'Critical'
  },
  ticketStatuses: {
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    PENDING: 'Pending',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
    REOPENED: 'Reopened'
  },
  productAreas: {
    FRONTEND: 'Frontend',
    BACKEND: 'Backend',
    ADMIN_PANEL: 'Admin Panel',
    DATABASE: 'Database',
    API: 'API',
    MOBILE: 'Mobile App',
    PAYMENT: 'Payment System',
    INVENTORY: 'Inventory Management',
    USERS: 'User Management',
    ORDERS: 'Order Management',
    ANALYTICS: 'Analytics',
    SECURITY: 'Security',
    MARKETING: 'Marketing',
    SUPPORT: 'Support',
    OTHER: 'Other'
  }
};

export function useAdminDictionary() {
  const [dictionary, setDictionary] = useState<AdminDictionary>(defaultDictionary as AdminDictionary);
  const [language, setLanguage] = useState<AdminLanguage>(defaultLanguage);
  const [isLoading, setIsLoading] = useState(false);

  // Load language from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('adminLanguage') as AdminLanguage;
      if (savedLanguage && ['en', 'ru'].includes(savedLanguage)) {
        setLanguage(savedLanguage);
      }
    }
  }, []);

  // Load dictionary when language changes
  useEffect(() => {
    const loadDictionary = async () => {
      setIsLoading(true);
      try {
        const response = await import(`@/admin/dictionaries/${language}.json`);
        setDictionary({ ...defaultDictionary, ...response.default } as AdminDictionary);
      } catch (error) {
        console.warn(`Failed to load dictionary for language: ${language}`, error);
        setDictionary(defaultDictionary as AdminDictionary);
      } finally {
        setIsLoading(false);
      }
    };

    loadDictionary();
  }, [language]);

  // Change language function
  const changeLanguage = (newLanguage: AdminLanguage) => {
    setLanguage(newLanguage);
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminLanguage', newLanguage);
    }
  };

  // Helper function to get nested dictionary values
  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = dictionary;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key; // Return the key itself if translation not found
      }
    }
    
    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string: ${key}`);
      return key;
    }
    
    // Replace parameters in the translation
    if (params) {
      return Object.entries(params).reduce((str, [paramKey, paramValue]) => {
        return str.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
      }, value);
    }
    
    return value;
  };

  return {
    dictionary,
    language,
    changeLanguage,
    isLoading,
    t
  };
}

export default useAdminDictionary;