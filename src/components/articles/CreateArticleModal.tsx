import React, { useState } from 'react';
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

interface CreateArticleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateArticleModal({ open, onOpenChange }: CreateArticleModalProps) {
  const { createArticle, isCreating } = useArticles();
  
  const [formData, setFormData] = useState<Partial<ArticleDTO>>({
    nom: '',
    prix: '',
    description: '',
    quantite: 0,
    disponible: true,
    status: true,
  });

  const handleInputChange = (field: keyof ArticleDTO, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom || !formData.prix) {
      toast.error('Le nom et le prix sont obligatoires');
      return;
    }

    try {
      await createArticle(formData as ArticleDTO);
      toast.success('Article créé avec succès !');
      onOpenChange(false);
      // Réinitialiser le formulaire
      setFormData({
        nom: '',
        prix: '',
        description: '',
        quantite: 0,
        disponible: true,
        status: true,
      });
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast.error('Erreur lors de la création de l\'article');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer un nouvel article</DialogTitle>
          <DialogDescription>
            Remplissez les informations pour créer un nouvel article dans votre système.
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
              disabled={isCreating}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer l\'article'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
