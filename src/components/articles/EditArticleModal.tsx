import React, { useState, useEffect, useRef } from 'react';
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
import { ArticleDTO, UpdateArticleRequest } from '@/types/entities';
import { useArticles } from '@/hooks/useArticles';
import { articlesAPI } from '@/services/api/articles.api';
import { toast } from 'react-hot-toast';
import { Loader2, Upload, X, ImageIcon, RefreshCw } from 'lucide-react';

interface EditArticleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: ArticleDTO | null;
}

export function EditArticleModal({ open, onOpenChange, article }: EditArticleModalProps) {
  const { updateArticle, isUpdating } = useArticles();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<ArticleDTO>>({
    nom: '',
    prix: '',
    description: '',
    quantite: 0,
    disponible: true,
    status: true,
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [imageAction, setImageAction] = useState<'keep' | 'update' | 'remove'>('keep');

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

      // Gérer l'image existante
      const imageUrl = articlesAPI.getImageUrl(article.imageUrl);
      setCurrentImageUrl(imageUrl);
      setImagePreview(null);
      setSelectedImage(null);
      setImageAction('keep');
      
      // Réinitialiser le file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [article]);

  const handleInputChange = (field: keyof ArticleDTO, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation du fichier
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (file.size > maxSize) {
      toast.error('L\'image ne doit pas dépasser 5MB');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error('Format d\'image non supporté. Utilisez JPG, PNG, GIF ou WebP');
      return;
    }

    setSelectedImage(file);
    setImageAction('update');

    // Créer une preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeCurrentImage = () => {
    setImageAction('remove');
    setImagePreview(null);
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const keepCurrentImage = () => {
    setImageAction('keep');
    setImagePreview(null);
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!article?.id || !formData.nom || !formData.prix) {
      toast.error('Données invalides');
      return;
    }
 
    try {
      const updateRequest: UpdateArticleRequest = {
        article: { 
          ...formData as ArticleDTO,
          id: article.id,
          // Si on supprime l'image, on met imageUrl à null
          imageUrl: imageAction === 'remove' ? null : formData.imageUrl
        },
        image: imageAction === 'update' && selectedImage ? selectedImage : undefined
      };

      await updateArticle({ id: article.id, data: updateRequest });
      toast.success('Article mis à jour avec succès !');
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour de l\'article');
    }
  };

  if (!article) return null;

  const renderImageSection = () => {
    // Si on a sélectionné une nouvelle image
    if (imageAction === 'update' && imagePreview) {
      return (
        <div className="relative">
          <img
            src={imagePreview}
            alt="Nouvelle image"
            className="w-full h-48 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={keepCurrentImage}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="absolute bottom-2 left-2">
            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
              Nouvelle image
            </span>
          </div>
        </div>
      );
    }

    // Si on garde l'image actuelle
    if (imageAction === 'keep' && currentImageUrl) {
      return (
        <div className="relative">
          <img
            src={currentImageUrl}
            alt="Image actuelle"
            className="w-full h-48 object-cover rounded-lg border"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={removeCurrentImage}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <div className="absolute bottom-2 left-2">
            <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">
              Image actuelle
            </span>
          </div>
        </div>
      );
    }

    // Si on a supprimé l'image ou s'il n'y en a pas
    return (
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-sm text-gray-600 mb-2">
          {imageAction === 'remove' ? 'Image supprimée - Cliquez pour en ajouter une nouvelle' : 'Cliquez pour ajouter une image'}
        </p>
        <p className="text-xs text-gray-500">
          JPG, PNG, GIF, WebP - Max 5MB
        </p>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l'article</DialogTitle>
          <DialogDescription>
            Modifiez les informations de l'article "{article.nom}".
          </DialogDescription>
        </DialogHeader> 

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section Image */}
          <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              <Label className="font-medium">Image de l'article</Label>
            </div>
            
            {renderImageSection()}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleImageSelect}
              className="hidden"
            />

            {currentImageUrl && imageAction !== 'remove' && (
              <div className="flex gap-2 text-xs">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Changer l'image
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removeCurrentImage}
                >
                  Supprimer l'image
                </Button>
              </div>
            )}
          </div>

          {/* Informations de base */}
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