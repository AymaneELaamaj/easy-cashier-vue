import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FeedbackDTO } from '@/types/entities';
import { MessageSquare, Edit3, Trash2, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface FeedbackCardProps {
  feedback: FeedbackDTO;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (feedback: FeedbackDTO) => void;
  onDelete?: (feedback: FeedbackDTO) => void;
}

export const FeedbackCard = ({ 
  feedback, 
  canEdit = false, 
  canDelete = false, 
  onEdit, 
  onDelete 
}: FeedbackCardProps) => {
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Date non définie';
    try {
      return format(new Date(dateString), 'dd MMM yyyy à HH:mm', { locale: fr });
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <Badge variant="secondary" className="text-xs">
              Feedback #{feedback.id}
            </Badge>
          </div>
          <div className="flex gap-1">
            {canEdit && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(feedback)}
                className="h-8 w-8 p-0"
                title="Modifier"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
            {canDelete && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(feedback)}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-3">
          <div className="text-sm text-gray-700 leading-relaxed">
            "{feedback.commentaire}"
          </div>
          
          {feedback.utilisateur && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <User className="h-3 w-3" />
              <span>
                {feedback.utilisateur.prenom} {feedback.utilisateur.nom}
              </span>
              <Badge variant="outline" className="text-xs">
                {feedback.utilisateur.role}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar className="h-3 w-3" />
          <span>Créé le {formatDate(feedback.id ? new Date().toISOString() : undefined)}</span>
        </div>
      </CardFooter>
    </Card>
  );
};
