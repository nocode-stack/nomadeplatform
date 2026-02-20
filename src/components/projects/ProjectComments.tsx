import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, User, Clock, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface ProjectCommentsProps {
  projectId: string;
}

interface Comment {
  id: string;
  message: string;
  is_important: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  user_profiles: {
    name: string;
    email: string;
    avatar_url: string | null;
  } | null;
}

const ProjectComments = ({ projectId }: ProjectCommentsProps) => {
  const [newComment, setNewComment] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string>('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['project-comments', projectId],
    queryFn: async () => {
      if (import.meta.env.DEV) console.log('🔍 Fetching comments for project:', projectId);
      
      const { data, error } = await supabase
        .from('NEW_Comments')
        .select(`
          id,
          message,
          is_important,
          created_at,
          updated_at,
          user_id,
          user_profiles!NEW_Comments_user_id_fkey (
            name,
            email,
            avatar_url
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching comments:', error);
        throw error;
      }

      if (import.meta.env.DEV) console.log('✅ Comments fetched:', data?.length || 0);
      return data as Comment[];
    },
    enabled: !!projectId,
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async (commentData: { message: string; is_important: boolean }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('NEW_Comments')
        .insert({
          project_id: projectId,
          user_id: user.id,
          message: commentData.message,
          is_important: commentData.is_important,
        })
        .select(`
          id,
          message,
          is_important,
          created_at,
          updated_at,
          user_id,
          user_profiles!NEW_Comments_user_id_fkey (
            name,
            email,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-comments', projectId] });
      queryClient.invalidateQueries({ queryKey: ['new-comments-total-count', projectId] });
      setNewComment('');
      setIsImportant(false);
      toast.success('Comentario agregado correctamente');
    },
    onError: (error) => {
      console.error('Error creating comment:', error);
      toast.error('Error al agregar el comentario');
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('NEW_Comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-comments', projectId] });
      queryClient.invalidateQueries({ queryKey: ['new-comments-total-count', projectId] });
      setIsDeleteDialogOpen(false);
      setDeletingCommentId('');
      toast.success('Comentario eliminado correctamente');
    },
    onError: (error) => {
      console.error('Error deleting comment:', error);
      toast.error('Error al eliminar el comentario');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    createCommentMutation.mutate({
      message: newComment.trim(),
      is_important: isImportant,
    });
  };

  const handleDeleteComment = (commentId: string) => {
    setDeletingCommentId(commentId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingCommentId) {
      deleteCommentMutation.mutate(deletingCommentId);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comentarios del Proyecto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>Cargando comentarios...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comentarios del Proyecto ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* New comment form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="Escribe un comentario sobre este proyecto..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isImportant}
                  onChange={(e) => setIsImportant(e.target.checked)}
                  className="rounded"
                />
                Marcar como importante
              </label>
              <Button 
                type="submit" 
                disabled={!newComment.trim() || createCommentMutation.isPending}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {createCommentMutation.isPending ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
          </form>

          {/* Comments list */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No hay comentarios aún</p>
                <p className="text-sm">Sé el primero en comentar sobre este proyecto</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={comment.user_profiles?.avatar_url || undefined} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                      {comment.user_profiles?.name ? getInitials(comment.user_profiles.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {comment.user_profiles?.name || 'Usuario desconocido'}
                        </span>
                        {comment.is_important && (
                          <Badge variant="destructive" className="text-xs">
                            Importante
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(comment.created_at), { 
                            addSuffix: true, 
                            locale: es 
                          })}
                        </div>
                        {user?.id === comment.user_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {comment.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar comentario</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar este comentario? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete} 
              disabled={deleteCommentMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCommentMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProjectComments;