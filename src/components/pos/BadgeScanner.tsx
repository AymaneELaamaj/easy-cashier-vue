// src/components/pos/BadgeScanner.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Scan, CheckCircle2, User, RefreshCw } from 'lucide-react';
import { UtilisateurResponse } from '@/types/entities';
import toast from 'react-hot-toast';

interface BadgeScannerProps {
  currentUser: UtilisateurResponse | null;
  onUserChange: (user: UtilisateurResponse | null) => void;
  onBadgeValidation: (badgeCode: string) => Promise<{success: boolean, user?: UtilisateurResponse, error?: string}>;
  isLoading: boolean;
}

const BadgeScanner: React.FC<BadgeScannerProps> = ({
  currentUser,
  onUserChange,
  onBadgeValidation,
  isLoading
}) => {
  const [badgeCode, setBadgeCode] = useState('');
  const badgeInputRef = useRef<HTMLInputElement>(null);

  // Focus automatique sur l'input quand pas de user
  useEffect(() => {
    if (!currentUser && badgeInputRef.current) {
      badgeInputRef.current.focus();
    }
  }, [currentUser]);

  const handleBadgeValidation = async () => {
    if (!badgeCode.trim()) {
      toast.error('Code badge requis');
      return;
    }

    const result = await onBadgeValidation(badgeCode);
    if (result.success && result.user) {
      setBadgeCode('');
      toast.success(`Bienvenue ${result.user.prenom} ${result.user.nom}`);
    } else {
      toast.error(result.error || 'Badge invalide');
      setBadgeCode('');
      setTimeout(() => badgeInputRef.current?.focus(), 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBadgeValidation();
    }
  };

  if (currentUser) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <User className="w-5 h-5 mr-2 text-green-600" />
            Client Connecté
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-green-800 text-lg">
                    {currentUser.prenom} {currentUser.nom}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      {currentUser.cadre || 'Employé'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      #{currentUser.codeBadge}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{currentUser.email}</p>
                  <p className="text-sm mt-1">
                    Solde: 
                    <span className={`ml-1 font-bold text-base ${
                      currentUser.solde >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {currentUser.solde.toFixed(2)} €
                    </span>
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => onUserChange(null)}
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                Changer client
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          <Scan className="w-5 h-5 mr-2 text-blue-600" />
          Scanner Badge Client
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Input
                ref={badgeInputRef}
                type="text"
                placeholder="Scanner ou saisir le code badge du client..."
                value={badgeCode}
                onChange={(e) => setBadgeCode(e.target.value)}
                onKeyPress={handleKeyPress}
                className="text-lg py-3 pl-4 pr-12"
                disabled={isLoading}
                autoComplete="off"
                autoFocus
              />
              <Scan className="w-5 h-5 absolute right-3 top-3.5 text-gray-400" />
            </div>
            <Button 
              onClick={handleBadgeValidation}
              disabled={isLoading || !badgeCode.trim()}
              className="px-8 py-3"
              size="lg"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Valider
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 flex items-center">
            <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
            Prêt pour le scan • F1 pour focus
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BadgeScanner;