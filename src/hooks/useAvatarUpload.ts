
import { useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useToast } from './use-toast';
import { logger } from '@/utils/logger';

export const useAvatarUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const uploadAvatar = async (file: File, userId: string): Promise<string | null> => {
    setIsUploading(true);

    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      // Upload the file
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        logger.error('Error uploading avatar', { component: 'useAvatarUpload', action: 'upload', data: error });
        toast({
          title: "Error al subir imagen",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      logger.info('Avatar subido exitosamente', { component: 'useAvatarUpload', action: 'upload', data: { publicUrl } });

      toast({
        title: "Imagen subida",
        description: "Tu foto de perfil se ha actualizado correctamente.",
      });

      return publicUrl;
    } catch (error) {
      logger.error('Error uploading avatar', { component: 'useAvatarUpload', action: 'upload', data: error });
      toast({
        title: "Error al subir imagen",
        description: "Hubo un problema al subir la imagen.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadAvatar, isUploading };
};
