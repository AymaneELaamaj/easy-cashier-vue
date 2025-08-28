import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArticleDTO } from '@/types/entities';
import { useArticles } from '@/hooks/useArticles';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface EditArticleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: ArticleDTO | null;
}

export function EditArticleModal({ open, onOpenChange, article }: EditArticleModalProps) {
  const { updateArticle, isUpdating } = useArticles();
  
  const [formData, setFormData] = useState<Partial<ArticleDTO>>({
    nom: '',
    prix: '',
    description: '',
    quantite: 0,
    disponible: true,
    status: true,
  });

  // Mettre à jour le formulaire quand l'article change
  useEffect(() => {
    if (article) {
      setFormData({
        nom: article.nom || '',
        prix: article.prix || '',
        description: article.description || '',
        quantite: article.quantite || 0,
        disponible: article.disponible ?? true,
        status: article.status ?? true,
        codeOdoo: article.codeOdoo,
        productId: article.productId,
      });
    }
  }, [article]);

  const handleInputChange = (field: keyof ArticleDTO, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!article?.id || !formData.nom || !formData.prix) {
      toast.error('Données invalides');
      return;
    }
 
    try {
      await updateArticle({ id: article.id, data: formData as ArticleDTO });
      toast.success('Article mis à jour avec succès !');
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour de l\'article');
    }
  };

  if (!article) return null;
  console.log('DEBUG/article prop =>', article);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifier l'article</DialogTitle>
          <DialogDescription>
            Modifiez les informations de l'article "{article.nom}".
          </DialogDescription>
        </DialogHeader> 

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => handleInputChange('nom', e.target.value)}
                placeholder="Nom de l'article"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prix">Prix *</Label>
              <Input
                id="prix"
                type="number"
                step="0.01"
                min="0"
                value={formData.prix}
                onChange={(e) => handleInputChange('prix', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Description de l'article"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantite">Quantité</Label>
              <Input
                id="quantite"
                type="number"
                min="0"
                value={formData.quantite}
                onChange={(e) => handleInputChange('quantite', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>

            {/* Champ Code Odoo supprimé de l'édition */}
          </div>

          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="disponible"
                checked={formData.disponible}
                onCheckedChange={(checked) => handleInputChange('disponible', checked)}
              />
              <Label htmlFor="disponible">Disponible</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="status"
                checked={formData.status}
                onCheckedChange={(checked) => handleInputChange('status', checked)}
              />
              <Label htmlFor="status">Actif</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                'Mettre à jour'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
