// src/components/pos/ConnectionStatus.tsx
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  isOnline: boolean;
  className?: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isOnline, className = '' }) => {
  return (
    <Badge 
      variant={isOnline ? "default" : "destructive"} 
      className={`flex items-center gap-1 ${className}`}
    >
      {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
      {isOnline ? 'EN LIGNE' : 'HORS LIGNE'}
    </Badge>
  );
};

export default ConnectionStatus;