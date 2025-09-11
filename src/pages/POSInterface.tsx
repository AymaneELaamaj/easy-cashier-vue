// src/pages/POSInterface.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingCart, Scan, Trash2, Plus, Minus, User, CreditCard, CheckCircle2, AlertCircle, Search, RefreshCw, Receipt, Loader2, ImageOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePOSArticles } from '@/hooks/usePOSArticles';
import { usePOS } from '@/hooks/usePOS';
import { ArticleDTO } from '@/types/entities';
import { articlesAPI } from '@/services/api/articles.api';
import useNetworkStatus from '@/hooks/useNetworkStatus';
import POS_FLAGS from '@/config/posFlags';
import type { CustomPaymentResponse } from '@/services/api/pos.api';
import { usePaymentMode } from '@/hooks/usePaymentMode';

/** Ticket HTML avec filet de sécurité:
 * - si tx.partPatronale == 0, on somme les subventions des lignes
 * - calcule partSalariale ligne si manquante
 */
function printTicket(txIn: CustomPaymentResponse | any) {
  const tx: any = txIn?.data ? txIn.data : txIn;

  const articles = Array.isArray(tx?.articles) ? tx.articles : [];
  const sumLineSub = articles.reduce((s: number, a: any) => s + Number(a?.subventionTotale ?? 0), 0);
  const subventionEntreprise = Number(tx?.partPatronale) > 0 ? Number(tx.partPatronale) : sumLineSub;

  const montantTotal = Number(tx?.montantTotal) || 0;
  const montantDebite = Number(tx?.partSalariale) || Math.max(0, montantTotal - subventionEntreprise);
  const nouveauSolde = Number(tx?.nouveauSolde) || 0;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ticket - ${tx.numeroTicket}</title>
  <style>@page{size:80mm auto;margin:5mm}@media print{body{margin:0;-webkit-print-color-adjust:exact}.no-print{display:none}}
  body{font-family:'Courier New',monospace;font-size:12px;line-height:1.4;margin:0;padding:5mm}.center{text-align:center}.bold{font-weight:700}
  .separator{border-top:1px dashed #000;margin:8px 0}table{width:100%;border-collapse:collapse}td{padding:2px 0;vertical-align:top}.right{text-align:right}.total-line{border-top:1px solid #000;font-weight:700}</style></head>
  <body><div class="center bold">===============================<br>🍽️ CANTINE ENTREPRISE 🍽️<br>===============================</div>
  <div class="separator"></div><div><strong>Ticket N°:</strong> ${tx.numeroTicket}<br><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}<br><strong>Heure:</strong> ${new Date().toLocaleTimeString('fr-FR')}<br><strong>Client:</strong> ${tx.utilisateurNomComplet || ''}<br><strong>Terminal:</strong> POS-001</div>
  <div class="separator"></div><div class="bold">DÉTAIL DES ARTICLES:</div><table>${
    articles.map((a: any) => `
      <tr><td>${a.nom} x${a.quantite}</td><td class="right">${(Number(a.montantTotal) || 0).toFixed(2)} MAD</td></tr>
      <tr><td style="font-size:10px;color:#666;">Prix unit: ${(Number(a.prixUnitaire) || 0).toFixed(2)} MAD | Subv: ${(Number(a.subventionTotale) || 0).toFixed(2)} MAD</td>
      <td class="right" style="font-size:10px;color:#666;">Votre part: ${(Number(a.partSalariale) || Math.max(0, (Number(a.montantTotal) || 0) - (Number(a.subventionTotale) || 0))).toFixed(2)} MAD</td></tr>`).join('')
  }</table>
  <div class="separator"></div><table>
    <tr><td>Sous-total:</td><td class="right">${montantTotal.toFixed(2)} MAD</td></tr>
    <tr><td>Subvention entreprise:</td><td class="right">-${Number(subventionEntreprise || 0).toFixed(2)} MAD</td></tr>
    <tr class="total-line"><td><strong>MONTANT DÉBITÉ:</strong></td><td class="right"><strong>${montantDebite.toFixed(2)} MAD</strong></td></tr>
    <tr><td>Nouveau solde:</td><td class="right">${nouveauSolde.toFixed(2)} MAD</td></tr>
  </table>
  <div class="separator"></div><div class="center">✅ Montant débité de votre badge<br>${
    Number(subventionEntreprise) > 0 ? `🎯 Vous avez économisé ${Number(subventionEntreprise).toFixed(2)} MAD !` : ''
  }<br><br>Merci et bon appétit !<br>💚 EasyPOS Cantine 💚</div><div class="center">===============================</div>
  <div class="no-print center" style="margin-top:20px;"><button onclick="window.print()" style="background:#3b82f6;color:#fff;padding:10px 20px;border:none;border-radius:5px;cursor:pointer;">🖨️ Imprimer</button>
  <button onclick="window.close()" style="background:#6b7280;color:#fff;padding:10px 20px;border:none;border-radius:5px;cursor:pointer;margin-left:10px;">Fermer</button></div>
  </body></html>`;
  const w = window.open('', '_blank', 'width=400,height=600');
  if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
}

const POSInterface: React.FC = () => {
  const networkStatus = useNetworkStatus();
  const { mode: paymentMode } = usePaymentMode();
  const isPRE = paymentMode === 'PRE';
  const isPOST = paymentMode === 'POST';

  const { toast: uiToast } = useToast();
  const { articles, isLoading: articlesLoading, refetch: refetchArticles } = usePOSArticles();

  const { currentUser, cart, isLoading, cartTotal, estimatedSubvention, estimatedToPay,
    validateBadge, validateTransaction, addToCart, updateQuantity, removeFromCart, clearCart, setCurrentUser } = usePOS({
      onTransactionSuccess: (tx: CustomPaymentResponse) => {
        if (POS_FLAGS.autoPrintTicket) setTimeout(() => printTicket(tx), POS_FLAGS.printDelayMs ?? 0);
      }
    });

  const [filteredArticles, setFilteredArticles] = useState<ArticleDTO[]>([]);
  const [badgeCode, setBadgeCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [validationError, setValidationError] = useState<string | null>(null);
  const badgeInputRef = useRef<HTMLInputElement>(null);

  const renderArticleImage = (article: ArticleDTO) => {
    const imageUrl = articlesAPI.getImageUrl(article.imageUrl);
    if (!imageUrl) return null;
    return (
      <img
        src={imageUrl}
        alt={article.nom}
        className="w-full h-full object-cover"
        onError={(e) => {
          const t = e.target as HTMLImageElement;
          t.style.display = 'none';
          const fb = t.parentElement?.querySelector('.image-fallback') as HTMLElement;
          if (fb) fb.classList.remove('hidden');
        }}
      />
    );
  };
  const renderImageFallback = (article: ArticleDTO) => (
    <div className={`image-fallback w-full h-full flex flex-col items-center justify-center text-gray-400 ${article.imageUrl ? 'hidden' : ''}`}>
      <ImageOff className="w-8 h-8 mb-2" />
      <span className="text-xs text-center px-2">Aucune image</span>
    </div>
  );

  useEffect(() => { if (!currentUser) badgeInputRef.current?.focus(); }, [currentUser]);
  useEffect(() => { setFilteredArticles(Array.isArray(articles) ? articles.filter(a => a.disponible && a.status && a.nom.toLowerCase().includes(searchTerm.toLowerCase())) : []); }, [articles, searchTerm]);
  useEffect(() => { if (articles.length > 0) setLastSync(new Date()); }, [articles]);

  const handleBadgeValidation = async () => {
    if (!badgeCode.trim()) {
      uiToast({ title: 'Code badge requis', description: 'Veuillez saisir un code badge', variant: 'destructive' });
      return;
    }
    const result = await validateBadge(badgeCode);
    if (result.success) {
      setBadgeCode('');
      uiToast({ title: 'Badge validé', description: `Bienvenue ${result.user?.prenom} ${result.user?.nom}` });
    } else {
      uiToast({ title: 'Badge invalide', description: result.error, variant: 'destructive' });
      setBadgeCode('');
      setTimeout(() => badgeInputRef.current?.focus(), 100);
    }
  };

  const handleTransactionValidation = async () => {
    setValidationError(null);
    if (isPRE && currentUser && estimatedToPay > currentUser.solde) {
      const manque = (estimatedToPay - currentUser.solde).toFixed(2);
      setValidationError(`Solde insuffisant !\nIl manque ${manque} MAD sur le badge.`);
      uiToast({ title: 'Solde insuffisant (mode PRE)', description: `Il manque ${manque} MAD`, variant: 'destructive' });
      return;
    }

    const result = await validateTransaction();
    if (result.success) {
      setIsValidationModalOpen(false);
      if (!POS_FLAGS.autoPrintTicket) printTicket(result.data as CustomPaymentResponse);
      uiToast({ title: 'Transaction réussie', description: `Ticket: ${result.data?.numeroTicket}` });
      setTimeout(() => { setBadgeCode(''); setSearchTerm(''); badgeInputRef.current?.focus(); }, 500);
    } else {
      const msg = result.error || 'Transaction refusée';
      setValidationError(msg);
      uiToast({ title: 'Transaction échouée', description: msg, variant: 'destructive' });
    }
  };

  const hideValidateButton = POS_FLAGS.hideManualValidateButton && POS_FLAGS.autoValidateAfterBadge;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      switch (e.key) {
        case 'F1': e.preventDefault(); badgeInputRef.current?.focus(); break;
        case 'F2': e.preventDefault(); if (cart.length > 0) clearCart(); break;
        case 'F3':
          e.preventDefault();
          if (!hideValidateButton && cart.length > 0 && currentUser && !isValidationModalOpen) {
            setValidationError(null);
            setIsValidationModalOpen(true);
          }
          break;
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [cart.length, currentUser, isValidationModalOpen, hideValidateButton, clearCart]);

  const hasInsufficientFunds = !!currentUser && estimatedToPay > currentUser.solde;
  const hasNegativeBalance = !!currentUser && currentUser.solde < 0;

  return (
    <div className="flex h-full">
      {/* Zone principale */}
      <div className="flex-1 p-4 space-y-4 overflow-auto">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Scan className="w-5 h-5 mr-2 text-blue-600" />
              Scanner Badge Client
              <span className="ml-3">
                <Badge variant="outline">{isPRE ? 'Mode PRE (pré-paiement)' : 'Mode POST (post-paiement)'}</Badge>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentUser ? (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                      <User className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-bold text-green-800 text-lg">{currentUser.prenom} {currentUser.nom}</p>
                      <p className="text-sm text-green-600 font-medium">{currentUser.cadre} • Badge: {currentUser.codeBadge}</p>
                      <p className="text-sm text-gray-600">{currentUser.email}</p>
                      <p className="text-sm mt-1">Solde:
                        <span className={`ml-1 font-bold text-base ${currentUser.solde >= 0 ? 'text-green-600' : 'text-red-600'}`}>{currentUser.solde.toFixed(2)} MAD</span>
                      </p>
                      {isPRE && hasInsufficientFunds && <p className="text-sm text-red-600 mt-1">⚠️ Solde insuffisant pour ce panier (mode PRE).</p>}
                      {isPOST && hasInsufficientFunds && <p className="text-sm text-amber-600 mt-1">ℹ️ Solde insuffisant (mode POST) : la transaction restera autorisée.</p>}
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setCurrentUser(null)} className="border-green-300 text-green-700 hover:bg-green-50">Changer client</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <Input
                      ref={badgeInputRef}
                      type="text"
                      placeholder="Scanner ou saisir le code badge du client..."
                      value={badgeCode}
                      onChange={(e) => setBadgeCode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleBadgeValidation()}
                      className="text-lg py-3 pl-4 pr-12"
                      disabled={isLoading}
                    />
                    <Scan className="w-5 h-5 absolute right-3 top-3.5 text-gray-400" />
                  </div>
                  <Button onClick={handleBadgeValidation} disabled={isLoading || !badgeCode.trim()} className="px-8 py-3" size="lg">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><CheckCircle2 className="w-4 h-4 mr-2" />Valider</>)}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                  Prêt pour le scan • F1 pour focus
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recherche */}
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input type="text" placeholder="Rechercher un article..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          <Button variant="outline" onClick={() => refetchArticles()} disabled={articlesLoading}>
            <RefreshCw className={`w-4 h-4 ${articlesLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Badge variant="secondary" className="px-3 py-1">{filteredArticles.length} articles</Badge>
        </div>

        {/* Grille produits */}
        <div className="grid grid-cols-4 xl:grid-cols-5 gap-4">
          {articlesLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : filteredArticles.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 mb-4"><Search className="w-12 h-12 mx-auto mb-4" /></div>
              <p className="text-gray-500">Aucun article trouvé</p>
              <p className="text-sm text-gray-400">{searchTerm ? 'Essayez un autre terme de recherche' : 'Chargez les articles'}</p>
            </div>
          ) : (
            filteredArticles.map((article) => (
              <Card
                key={article.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:scale-105 border-0 shadow-sm"
                onClick={() => addToCart(article)}
              >
                <CardContent className="p-4">
                  <div className="aspect-square bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg mb-3 relative overflow-hidden">
                    <div className="absolute inset-0">{renderArticleImage(article)}{renderImageFallback(article)}</div>
                    <div className="absolute top-2 right-2 z-10"><Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-white/80 backdrop-blur-sm">#{article.id}</Badge></div>
                    {(!article.disponible || !article.status) && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                        <Badge variant="destructive" className="text-xs">{!article.status ? 'Inactif' : 'Indisponible'}</Badge>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm mb-1 truncate" title={article.nom}>{article.nom}</h3>
                  <p className="text-lg font-bold text-blue-600 mb-2">{parseFloat(article.prix).toFixed(2)} MAD</p>
                  {article.description && <p className="text-xs text-gray-500 mb-2 line-clamp-2">{article.description}</p>}
                  <Button className="w-full" size="sm" onClick={(e) => { e.stopPropagation(); addToCart(article); }}>
                    <Plus className="w-4 h-4 mr-1" />Ajouter
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Sidebar panier */}
      <div className="w-96 bg-white border-l shadow-lg flex flex-col">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold flex items-center justify-between">
            <span className="flex items-center"><ShoppingCart className="w-5 h-5 mr-2" />Panier</span>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">{cart.length} article{cart.length !== 1 ? 's' : ''}</Badge>
          </h2>
        </div>

        <ScrollArea className="flex-1 p-4">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-2">Panier vide</p>
              <p className="text-sm text-gray-400">Cliquez sur les articles pour les ajouter</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.article.id} className="bg-gray-50 rounded-lg p-3 border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm" title={item.article.nom}>{item.article.nom}</h4>
                      <p className="text-sm text-gray-600">{parseFloat(item.article.prix).toFixed(2)} MAD l'unité</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.article.id!)} className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-2">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => updateQuantity(item.article.id!, item.quantite - 1)} className="h-8 w-8 p-0"><Minus className="w-3 h-3" /></Button>
                      <span className="w-8 text-center font-semibold">{item.quantite}</span>
                      <Button variant="outline" size="sm" onClick={() => updateQuantity(item.article.id!, item.quantite + 1)} className="h-8 w-8 p-0"><Plus className="w-3 h-3" /></Button>
                    </div>
                    <span className="font-bold text-blue-600">{item.sousTotal.toFixed(2)} MAD</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {cart.length > 0 && (
          <div className="p-4 border-t bg-gray-50 space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Sous-total:</span><span className="font-semibold">{cartTotal.toFixed(2)} MAD</span></div>
            </div>

            <div className="space-y-2">
              <Button variant="outline" className="w-full" onClick={() => clearCart()} disabled={isLoading}>
                <Trash2 className="w-4 h-4 mr-2" />Vider le panier (F2)
              </Button>

              {!hideValidateButton && (
                <Button className="w-full" onClick={() => { setValidationError(null); setIsValidationModalOpen(true); }} disabled={!currentUser || cart.length === 0} size="lg">
                  <CreditCard className="w-4 h-4 mr-2" />Valider l'achat (F3)
                </Button>
              )}

              {!currentUser && <p className="text-xs text-amber-600 text-center bg-amber-50 p-2 rounded">Scanner un badge client pour continuer</p>}
              {hideValidateButton && <p className="text-[11px] text-center text-blue-600 bg-blue-50 p-2 rounded">Mode auto-validation activé : validation après le badge.</p>}
            </div>
          </div>
        )}
      </div>

      {/* Modal de validation */}
      <Dialog open={isValidationModalOpen} onOpenChange={(open) => { setIsValidationModalOpen(open); if (open) setValidationError(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center"><Receipt className="w-5 h-5 mr-2" />Confirmer la transaction</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {currentUser && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center">
                  <User className="w-5 h-5 text-blue-600 mr-2" />
                  <div>
                    <p className="font-semibold text-blue-800">{currentUser.prenom} {currentUser.nom}</p>
                    <p className="text-sm text-blue-600">{currentUser.email}</p>
                    <p className="text-sm">Solde actuel:
                      <span className={`ml-1 font-semibold ${currentUser.solde >= 0 ? 'text-green-600' : 'text-red-600'}`}>{currentUser.solde.toFixed(2)} MAD</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h4 className="font-semibold mb-2">Articles ({cart.length}):</h4>
              <div className="max-h-32 overflow-y-auto space-y-1 bg-gray-50 p-2 rounded">
                {cart.map((item) => (
                  <div key={item.article.id} className="flex justify-between text-sm">
                    <span>{item.article.nom} x{item.quantite}</span>
                    <span className="font-medium">{item.sousTotal.toFixed(2)} MAD</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between"><span>Total articles:</span><span className="font-semibold">{cartTotal.toFixed(2)} MAD</span></div>
              <div className="flex justify-between text-green-600"><span>Subvention estimée:</span><span className="font-medium">-{estimatedSubvention.toFixed(2)} MAD</span></div>
              <div className="flex justify-between text-lg font-bold border-t pt-2"><span>À débiter du badge:</span><span className="text-blue-600">{estimatedToPay.toFixed(2)} MAD</span></div>
            </div>

            {isPRE && hasInsufficientFunds && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  <span className="font-semibold">Solde insuffisant !</span><br />
                  Il manque {(estimatedToPay - (currentUser?.solde ?? 0)).toFixed(2)} MAD sur le badge.
                </AlertDescription>
              </Alert>
            )}

            {!isPRE && hasInsufficientFunds && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                  Solde insuffisant (mode POST). La transaction sera acceptée et le ticket sera imprimé.
                </AlertDescription>
              </Alert>
            )}

            {!hasInsufficientFunds && !!currentUser && currentUser.solde < 0 && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                  Attention : Le solde du badge est déjà négatif.
                </AlertDescription>
              </Alert>
            )}

            {validationError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 whitespace-pre-line">{validationError}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsValidationModalOpen(false)} disabled={isLoading}>Annuler</Button>
            <Button onClick={handleTransactionValidation} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Confirmer le paiement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-white border-t px-4 py-2 text-xs text-gray-500 absolute bottom-0 left-0 right-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span>Dernière sync: {lastSync.toLocaleTimeString('fr-FR')}</span>
            <span>Articles: {articles.length}</span>
            <span>Panier: {cart.length}</span>
            <Badge variant={networkStatus.isOnline ? 'default' : 'destructive'} className="text-xs">
              {networkStatus.isOnline ? 'EN LIGNE' : 'HORS LIGNE'}
            </Badge>
          </div>
          <div className="flex items-center space-x-6">
            <Badge variant="outline">Mode {isPRE ? 'PRE' : 'POST'}</Badge>
            <span>F1: Focus badge</span><span>F2: Vider panier</span>{!hideValidateButton && <span>F3: Valider</span>}
            <Badge variant="outline" className="ml-2">EasyPOS v1.0</Badge>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default POSInterface;
