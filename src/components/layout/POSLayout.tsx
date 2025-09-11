import React, { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthContext } from '@/contexts/AuthContext';
import { LogOut, HelpCircle, Clock, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface POSLayoutProps {
  children: ReactNode;
}

/** Logo vidéo sans aucun bord visible */
function VideoLogo({ size = 40, rounded = 12 }: { size?: number; rounded?: number }) {
  const [hasError, setHasError] = React.useState(false);
  const s = `${size}px`;

  if (hasError) {
    // Fallback propre si la vidéo ne charge pas
    return (
      <div
        className="grid place-items-center bg-blue-600 text-white font-bold"
        style={{ width: s, height: s, borderRadius: rounded }}
        aria-label="Logo EasyPOS"
      >
        P
      </div>
    );
  }

  return (
    <div
      // ✅ Aucun ring/border, on clippe strictement le contenu
      className="overflow-hidden select-none pointer-events-none"
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
        // ✅ Aucun bord : cover + léger zoom + clip par overflow-hidden
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scale(1.04)',           // repousse toute ligne de bord hors clip
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

const POSLayout: React.FC<POSLayoutProps> = ({ children }) => {
  const { currentUser, logout } = useAuthContext();
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const { isOnline, shouldShowOfflineWarning } = useNetworkStatus();

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => logout();

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      <header className="bg-white shadow-sm border-b px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Gauche : logo + badges */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {/* ⬇️ Logo vidéo sans bord */}
              <VideoLogo size={44} rounded={10} />
              <h2 className="text-xl font-bold text-gray-800">  EasyPOS Cantine</h2>
            </div>

            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Terminal POS
            </Badge>

            <Badge variant={isOnline ? 'default' : 'destructive'} className="flex items-center gap-1">
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? 'EN LIGNE' : 'HORS LIGNE'}
            </Badge>
          </div>

          {/* Droite : heure + user + actions */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              {currentTime.toLocaleTimeString('fr-FR')}
            </div>

            <div className="text-sm text-gray-600">
              <span className="font-medium">Caissier:</span> {currentUser?.prenom} {currentUser?.nom}
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <HelpCircle className="w-4 h-4 mr-2" />
                Aide (F1)
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer la déconnexion</AlertDialogTitle>
                    <AlertDialogDescription>
                      Êtes-vous sûr de vouloir vous déconnecter de l&apos;interface POS ?
                      <br />
                      <span className="font-medium">
                        Utilisateur : {currentUser?.prenom} {currentUser?.nom}
                      </span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
                      Se déconnecter
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </header>

      {shouldShowOfflineWarning && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <span className="font-medium">Mode dégradé activé</span> — Serveur inaccessible. Les
                transactions seront sauvées localement et synchronisées dès le retour de la connexion.
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="h-[calc(100vh-73px)]">{children}</main>
    </div>
  );
};

export default POSLayout;
