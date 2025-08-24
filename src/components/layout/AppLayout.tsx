import React from 'react';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="h-screen flex w-full bg-background overflow-hidden">
      {/* Sidebar FIXE avec position fixed */}
      <div className="fixed left-0 top-0 h-full z-10">
        <AppSidebar />
      </div>
      
      {/* Contenu principal avec margin pour compenser la sidebar */}
      <div className="flex-1 flex flex-col min-w-0 ml-60">
        {/* Header fixe */}
        <div className="flex-shrink-0 sticky top-0 z-5 bg-background border-b">
          <AppHeader />
        </div>
        
        {/* Zone de contenu scrollable */}
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="p-4">
            <div className="max-w-full">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;