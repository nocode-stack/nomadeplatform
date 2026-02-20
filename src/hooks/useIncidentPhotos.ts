
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useIncidentPhotos = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadPhoto = async (file: File, incidentId: string): Promise<string | null> => {
    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${incidentId}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('incident-photos')
        .upload(fileName, file);

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('incident-photos')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: unknown) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Error al subir foto",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const uploadMultiplePhotos = async (files: File[], incidentId: string): Promise<string[]> => {
    const uploadPromises = files.map(file => uploadPhoto(file, incidentId));
    const results = await Promise.all(uploadPromises);
    return results.filter(url => url !== null) as string[];
  };

  return {
    uploadPhoto,
    uploadMultiplePhotos,
    uploading
  };
};
