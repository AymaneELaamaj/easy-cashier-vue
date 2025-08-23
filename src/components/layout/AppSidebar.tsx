import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  Users,
  CreditCard,
  Receipt,
  Undo2,
  Percent,
  FileText,
  Settings,
  MessageSquare,
  Monitor,
  UserCheck,
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const menuItems = [
  {
    title: 'Tableau de bord',
    url: '/dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'SUPER_ADMIN', 'EMPLOYE', 'CAISSIER']
  },
  {
    title: 'Articles',
    url: '/articles',
    icon: Package,
    roles: ['ADMIN', 'SUPER_ADMIN', 'EMPLOYE']
  },
  {
    title: 'Catégories',
    url: '/categories',
    icon: FolderOpen,
    roles: ['ADMIN', 'SUPER_ADMIN']
  },
  {
    title: 'Utilisateurs',
    url: '/users',
    icon: Users,
    roles: ['ADMIN', 'SUPER_ADMIN']
  },
  {
    title: 'Badges',
    url: '/badges',
    icon: CreditCard,
    roles: ['ADMIN', 'SUPER_ADMIN']
  },
  {
    title: 'Transactions',
    url: '/transactions',
    icon: Receipt,
    roles: ['ADMIN', 'SUPER_ADMIN', 'EMPLOYE']
  },
  {
    title: 'Remboursements',
    url: '/remboursements',
    icon: Undo2,
    roles: ['ADMIN', 'SUPER_ADMIN', 'EMPLOYE']
  },
  {
    title: 'Subventions',
    url: '/subventions',
    icon: Percent,
    roles: ['ADMIN', 'SUPER_ADMIN']
  },
  {
    title: 'Rapports',
    url: '/rapports',
    icon: FileText,
    roles: ['ADMIN', 'SUPER_ADMIN']
  },
  {
    title: 'Configuration',
    url: '/config',
    icon: Settings,
    roles: ['ADMIN', 'SUPER_ADMIN']
  },
  {
    title: 'Terminaux POS',
    url: '/terminals',
    icon: Monitor,
    roles: ['ADMIN', 'SUPER_ADMIN']
  },
  {
    title: 'Feedback',
    url: '/feedback',
    icon: MessageSquare,
    roles: ['ADMIN', 'SUPER_ADMIN', 'EMPLOYE']
  },
  {
    title: 'Catégories Employés',
    url: '/categorie-employes',
    icon: UserCheck,
    roles: ['ADMIN', 'SUPER_ADMIN']
  }
];

export function AppSidebar() {
  const location = useLocation();
  const { hasAnyRole } = useAuthContext();
  
  const currentPath = location.pathname;

  // Filtrer les éléments du menu selon les rôles
  const filteredMenuItems = menuItems.filter(item => hasAnyRole(item.roles));

  const isActive = (path: string) => currentPath === path;

  const getNavClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center w-full px-3 py-2 rounded-lg transition-all duration-200',
      isActive 
        ? 'bg-primary text-primary-foreground shadow-primary' 
        : 'hover:bg-muted/80 text-muted-foreground hover:text-foreground'
    );

  return (
    <div className="w-60 border-r border-border/50 bg-sidebar h-full flex flex-col">
      {/* Logo */}
      <div className="flex items-center p-4 border-b border-border/50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">EP</span>
          </div>
          <span className="font-semibold text-sidebar-foreground">EasyPOS</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground mb-2 px-3">
            Navigation
          </p>
          
          <nav className="space-y-1">
            {filteredMenuItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                end
                className={getNavClasses}
                title={item.title}
              >
                <item.icon className="h-4 w-4 flex-shrink-0 mr-3" />
                <span className="truncate">{item.title}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}