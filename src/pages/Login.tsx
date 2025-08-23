import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuthContext } from '@/contexts/AuthContext';
import { LoginRequest } from '@/types/entities';
import { Eye, EyeOff, LogIn } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email invalide').min(1, 'Email requis'),
  password: z.string().min(1, 'Mot de passe requis'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
  const { isAuthenticated, login, isLoggingIn } = useAuthContext();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  // Rediriger si déjà authentifié
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (data: LoginForm) => {
    try {
      const credentials: LoginRequest = {
        email: data.email,
        password: data.password,
      };
      
      await login(credentials);
    } catch (error: any) {
      setError('root', {
        message: error.response?.data?.message || 'Erreur de connexion'
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
            <span className="text-white font-bold text-lg">EP</span>
          </div>
          <CardTitle className="text-2xl font-bold">EasyPOS</CardTitle>
          <CardDescription>
            Connectez-vous à votre compte pour accéder au système
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Entrez votre email"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
                disabled={isLoggingIn}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Entrez votre mot de passe"
                  {...register('password')}
                  className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                  disabled={isLoggingIn}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoggingIn}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {errors.root && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{errors.root.message}</p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Se connecter
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Version 1.0.0 - EasyPOS Management System
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Login;