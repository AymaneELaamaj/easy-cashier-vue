import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster as HotToaster } from 'react-hot-toast';
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import CategorieEmployes from "./pages/CategorieEmployes";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <HotToaster 
            position="top-right"
            toastOptions={{
              className: 'bg-background text-foreground border border-border',
              duration: 4000,
            }}
          />
          <BrowserRouter>
            <Routes>
              {/* Route publique */}
              <Route path="/login" element={<Login />} />
              
              {/* Routes protégées avec layout */}
              <Route path="/" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Navigate to="/dashboard" replace />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              } />

              {/* Placeholder pour les autres pages */}
              <Route path="/articles" element={
                <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN', 'EMPLOYE']}>
                  <AppLayout>
                    <div className="text-center py-8">
                      <h1 className="text-2xl font-bold mb-4">Articles</h1>
                      <p className="text-muted-foreground">Page en cours de développement</p>
                    </div>
                  </AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/categories" element={
                <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <AppLayout>
                    <div className="text-center py-8">
                      <h1 className="text-2xl font-bold mb-4">Catégories</h1>
                      <p className="text-muted-foreground">Page en cours de développement</p>
                    </div>
                  </AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/users" element={
                <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <AppLayout>
                    <Users />
                  </AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/badges" element={
                <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <AppLayout>
                    <div className="text-center py-8">
                      <h1 className="text-2xl font-bold mb-4">Badges</h1>
                      <p className="text-muted-foreground">Page en cours de développement</p>
                    </div>
                  </AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/transactions" element={
                <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN', 'EMPLOYE']}>
                  <AppLayout>
                    <div className="text-center py-8">
                      <h1 className="text-2xl font-bold mb-4">Transactions</h1>
                      <p className="text-muted-foreground">Page en cours de développement</p>
                    </div>
                  </AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/remboursements" element={
                <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN', 'EMPLOYE']}>
                  <AppLayout>
                    <div className="text-center py-8">
                      <h1 className="text-2xl font-bold mb-4">Remboursements</h1>
                      <p className="text-muted-foreground">Page en cours de développement</p>
                    </div>
                  </AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/subventions" element={
                <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <AppLayout>
                    <div className="text-center py-8">
                      <h1 className="text-2xl font-bold mb-4">Subventions</h1>
                      <p className="text-muted-foreground">Page en cours de développement</p>
                    </div>
                  </AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/rapports" element={
                <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <AppLayout>
                    <div className="text-center py-8">
                      <h1 className="text-2xl font-bold mb-4">Rapports</h1>
                      <p className="text-muted-foreground">Page en cours de développement</p>
                    </div>
                  </AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/config" element={
                <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <AppLayout>
                    <div className="text-center py-8">
                      <h1 className="text-2xl font-bold mb-4">Configuration</h1>
                      <p className="text-muted-foreground">Page en cours de développement</p>
                    </div>
                  </AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/terminals" element={
                <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <AppLayout>
                    <div className="text-center py-8">
                      <h1 className="text-2xl font-bold mb-4">Terminaux POS</h1>
                      <p className="text-muted-foreground">Page en cours de développement</p>
                    </div>
                  </AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/feedback" element={
                <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN', 'EMPLOYE']}>
                  <AppLayout>
                    <div className="text-center py-8">
                      <h1 className="text-2xl font-bold mb-4">Feedback</h1>
                      <p className="text-muted-foreground">Page en cours de développement</p>
                    </div>
                  </AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/categorie-employes" element={
                <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <AppLayout>
                    <CategorieEmployes />
                  </AppLayout>
                </ProtectedRoute>
              } />

              {/* Pages d'erreur */}
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
