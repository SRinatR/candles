"use client";

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/icons/Logo';
import {
  LayoutDashboard,
  Package,
  FileText,
  Tags,
  ShoppingCart,
  Users,
  Megaphone,
  FileOutput,
  Landmark,
  Percent,
  Settings,
  ShieldCheck,
  UserCog,
  History,
  HeadphonesIcon,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  managerOrAdmin?: boolean;
}

const navItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Панель управления', icon: LayoutDashboard, managerOrAdmin: true },
  { href: '/admin/products', label: 'Товары', icon: Package, managerOrAdmin: true },
  { href: '/admin/articles', label: 'Статьи', icon: FileText, managerOrAdmin: true },
  { href: '/admin/attributes/categories', label: 'Категории', icon: Tags, adminOnly: true },
  { href: '/admin/sales', label: 'Продажи', icon: ShoppingCart, managerOrAdmin: true },
  { href: '/admin/clients', label: 'Клиенты', icon: Users, managerOrAdmin: true },
  { href: '/admin/support/tickets', label: 'Поддержка', icon: HeadphonesIcon, managerOrAdmin: true },
  { href: '/admin/marketing', label: 'Маркетинг', icon: Megaphone, managerOrAdmin: true },
  { href: '/admin/reports', label: 'Отчеты', icon: FileOutput, managerOrAdmin: true },
  { href: '/admin/finances', label: 'Финансы', icon: Landmark, managerOrAdmin: true },
  { href: '/admin/discounts', label: 'Скидки', icon: Percent, managerOrAdmin: true },
  { href: '/admin/users', label: 'Пользователи', icon: UserCog, adminOnly: true },
  { href: '/admin/logs', label: 'Логи', icon: History, adminOnly: true },
  { href: '/admin/settings', label: 'Настройки', icon: Settings, adminOnly: true },
];

export function AdminSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const isAdmin = session?.user?.role === 'ADMIN';
  const isManager = session?.user?.role === 'MANAGER';

  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly) return isAdmin;
    if (item.managerOrAdmin) return isManager || isAdmin;
    return true;
  });

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-6 pb-4">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center">
          <Link href="/admin/dashboard" className="flex items-center space-x-2">
            <Logo className="h-8 w-8" />
            <span className="text-xl font-bold text-gray-900">Admin</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {filteredNavItems.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
                  
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors',
                          isActive
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        )}
                      >
                        <item.icon
                          className={cn(
                            'h-6 w-6 shrink-0',
                            isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'
                          )}
                        />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>

            {/* User Info */}
            <li className="mt-auto">
              <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 text-gray-900">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {session?.user?.name || 'Пользователь'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {session?.user?.role === 'ADMIN' ? 'Администратор' : 'Менеджер'}
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}