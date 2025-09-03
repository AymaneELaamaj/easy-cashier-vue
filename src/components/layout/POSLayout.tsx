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

const POSLayout: React.FC<POSLayoutProps> = ({ children }) => {
 const { currentUser, logout } = useAuthContext();
 const [currentTime, setCurrentTime] = React.useState(new Date());
 
 const { 
   isOnline,
   shouldShowOfflineWarning
 } = useNetworkStatus();

 React.useEffect(() => {
   const timer = setInterval(() => setCurrentTime(new Date()), 1000);
   return () => clearInterval(timer);
 }, []);

 const handleLogout = () => {
   logout();
 };

 return (
   <div className="h-screen bg-gray-50 overflow-hidden">
     <header className="bg-white shadow-sm border-b px-4 py-3">
       <div className="flex items-center justify-between">
         <div className="flex items-center space-x-4">
           <div className="flex items-center space-x-2">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
               <span className="text-white font-bold text-sm">P</span>
             </div>
             <h1 className="text-xl font-bold text-gray-800">EasyPOS Cantine</h1>
           </div>
           <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
             Terminal POS
           </Badge>
           
           <Badge variant={isOnline ? "default" : "destructive"} className="flex items-center gap-1">
             {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
             {isOnline ? 'EN LIGNE' : 'HORS LIGNE'}
           </Badge>
         </div>
         
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
                     Êtes-vous sûr de vouloir vous déconnecter de l'interface POS ?
                     <br />
                     <span className="font-medium">Utilisateur : {currentUser?.prenom} {currentUser?.nom}</span>
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
               <span className="font-medium">Mode dégradé activé</span>
               - Serveur inaccessible. Les transactions seront sauvées localement et synchronisées dès le retour de la connexion.
             </p>
           </div>
         </div>
       </div>
     )}

     <main className="h-[calc(100vh-73px)]">
       {children}
     </main>
   </div>
 );
};

export default POSLayout;