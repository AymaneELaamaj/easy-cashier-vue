import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
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
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

/** Logo vidéo sans bord, clipé dans un conteneur arrondi */
function VideoLogo({ size = 32, rounded = 8 }: { size?: number; rounded?: number }) {
  const [hasError, setHasError] = React.useState(false);
  const s = `${size}px`;

  if (hasError) {
    // Fallback propre si la vidéo ne charge pas
    return (
      <div
        className="grid place-items-center bg-blue-600 text-white font-bold text-sm"
        style={{ width: s, height: s, borderRadius: rounded }}
        aria-label="Logo EasyPOS"
      >
        EP
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden select-none"
      style={{ width: s, height: s, borderRadius: rounded, backgroundColor: 'transparent' }}
      aria-label="Logo EasyPOS animé"
    >
      <video
        src="/video/Negative-mask-effect.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        width={size}
        height={size}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scale(1.04)', // petit zoom pour éviter toute ligne de bord
          transformOrigin: 'center',
          display: 'block',
          backgroundColor: 'transparent',
          border: 'none',
          outline: 'none',
        }}
        onError={() => setHasError(true)}
      />
    </div>
  );
}

const menuItems = [
  {
    title: 'Tableau de bord',
    url: '/dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'SUPER_ADMIN', 'EMPLOYE', 'CAISSIER'],
  },
  { title: 'Articles', url: '/articles', icon: Package, roles: ['ADMIN', 'SUPER_ADMIN', 'EMPLOYE'] },
  { title: 'Utilisateurs', url: '/users', icon: Users, roles: ['ADMIN', 'SUPER_ADMIN'] },
  { title: 'Badges', url: '/badges', icon: CreditCard, roles: ['ADMIN', 'SUPER_ADMIN'] },
  {
    title: 'Transactions',
    url: '/transactions',
    icon: Receipt,
    roles: ['ADMIN', 'SUPER_ADMIN', 'EMPLOYE'],
  },
  {
    title: 'Remboursements',
    url: '/remboursements',
    icon: Undo2,
    roles: ['ADMIN', 'SUPER_ADMIN', 'EMPLOYE'],
  },
  { title: 'Subventions', url: '/subventions', icon: Percent, roles: ['ADMIN', 'SUPER_ADMIN'] },
  { title: 'Rapports', url: '/rapports', icon: FileText, roles: ['ADMIN', 'SUPER_ADMIN'] },
  { title: 'Configuration', url: '/config', icon: Settings, roles: ['ADMIN', 'SUPER_ADMIN'] },
  { title: 'Terminaux POS', url: '/terminals', icon: Monitor, roles: ['ADMIN', 'SUPER_ADMIN'] },
  { title: 'Feedback', url: '/feedback', icon: MessageSquare, roles: ['ADMIN', 'SUPER_ADMIN', 'EMPLOYE'] },
  { title: 'Catégories Employés', url: '/categorie-employes', icon: UserCheck, roles: ['ADMIN', 'SUPER_ADMIN'] },
];

// Nouvelle section sécurité
const securityMenuItems = [
  { title: 'Dashboard Sécurité', url: '/security/dashboard', icon: Shield, roles: ['ADMIN', 'SUPER_ADMIN'] },
  { title: 'Alertes', url: '/security/alerts', icon: AlertTriangle, roles: ['ADMIN', 'SUPER_ADMIN'] },
];

export function AppSidebar() {
  const location = useLocation();
  const { hasAnyRole } = useAuthContext();

  const currentPath = location.pathname;

  // Filtrer selon les rôles
  const filteredMenuItems = menuItems.filter((item) => {
    try {
      return hasAnyRole(item.roles);
    } catch (_) {
      return process.env.NODE_ENV === 'development';
    }
  });

  const filteredSecurityItems = securityMenuItems.filter((item) => {
    try {
      return hasAnyRole(item.roles);
    } catch (_) {
      return process.env.NODE_ENV === 'development';
    }
  });

  const getNavClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center w-full px-3 py-2 rounded-lg transition-all duration-200',
      isActive ? 'bg-primary text-primary-foreground shadow-primary' : 'hover:bg-muted/80 text-muted-foreground hover:text-foreground'
    );

  return (
    <div className="w-60 border-r border-border/50 bg-sidebar h-screen flex flex-col">
      {/* Logo (remplacé par la vidéo) */}
      <div className="flex items-center p-4 border-b border-border/50 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <VideoLogo size={40} rounded={99999} />
          <span className="font-semibold text-sidebar-foreground">EasyPOS</span>
        </div>
      </div>

      {/* Navigation scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        <div className="space-y-6">
          {/* Section principale */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground mb-2 px-3">Navigation</p>
            <nav className="space-y-1">
              {filteredMenuItems.map((item) => (
                <NavLink key={item.title} to={item.url} end className={getNavClasses} title={item.title}>
                  <item.icon className="h-4 w-4 flex-shrink-0 mr-3" />
                  <span className="truncate">{item.title}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Section sécurité */}
          {filteredSecurityItems.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground mb-2 px-3">Sécurité</p>
              <nav className="space-y-1">
                {filteredSecurityItems.map((item) => (
                  <NavLink key={item.title} to={item.url} end className={getNavClasses} title={item.title}>
                    <item.icon className="h-4 w-4 flex-shrink-0 mr-3" />
                    <span className="truncate">{item.title}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
