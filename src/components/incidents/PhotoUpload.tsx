
import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Image, Check, Trash2 } from 'lucide-react';
import { useIncidentPhotos } from '@/hooks/useIncidentPhotos';

interface PhotoUploadProps {
  // For existing incidents
  onPhotosUploaded?: (urls: string[]) => void;
  incidentId?: string;
  existingPhotos?: string[];
  
  // For new incident forms
  files?: File[];
  onFilesChange?: (files: File[]) => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ 
  onPhotosUploaded, 
  incidentId, 
  existingPhotos = [],
  files = [],
  onFilesChange 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [currentExistingPhotos, setCurrentExistingPhotos] = useState<string[]>(existingPhotos);
  const { uploadMultiplePhotos, uploading } = useIncidentPhotos();

  // Use external files for form mode, internal state for existing incident mode
  const currentFiles = onFilesChange ? files : selectedFiles;
  const currentPreviews = onFilesChange ? files.map(f => URL.createObjectURL(f)) : previewUrls;

  // Update existing photos when prop changes
  useEffect(() => {
    setCurrentExistingPhotos(existingPhotos);
  }, [existingPhotos]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []);
    if (newFiles.length === 0) return;

    if (onFilesChange) {
      // Form mode - update external state
      onFilesChange([...files, ...newFiles]);
    } else if (incidentId && onPhotosUploaded) {
      // Existing incident mode - auto upload
      const uploadedUrls = await uploadMultiplePhotos(newFiles, incidentId);
      if (uploadedUrls.length > 0) {
        const newExistingPhotos = [...currentExistingPhotos, ...uploadedUrls];
        setCurrentExistingPhotos(newExistingPhotos);
        onPhotosUploaded(newExistingPhotos);
        setUploadedFiles([...uploadedFiles, ...uploadedUrls]);
      }
    } else {
      // Preview mode for new incidents
      setSelectedFiles([...selectedFiles, ...newFiles]);
      const urls = newFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls([...previewUrls, ...urls]);
    }

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    if (onFilesChange) {
      // Form mode
      const newFiles = files.filter((_, i) => i !== index);
      onFilesChange(newFiles);
    } else {
      // Existing incident mode
      const newFiles = selectedFiles.filter((_, i) => i !== index);
      const newPreviews = previewUrls.filter((_, i) => i !== index);
      setSelectedFiles(newFiles);
      setPreviewUrls(newPreviews);
      URL.revokeObjectURL(previewUrls[index]);
    }
  };

  const removeExistingPhoto = (photoUrl: string) => {
    const newExistingPhotos = currentExistingPhotos.filter(url => url !== photoUrl);
    setCurrentExistingPhotos(newExistingPhotos);
    if (onPhotosUploaded) {
      onPhotosUploaded(newExistingPhotos);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 mb-3">
          {incidentId ? 'Las fotos se guardan automáticamente al seleccionarlas' : 'Selecciona fotos para la incidencia'}
        </p>
        <Button 
          type="button" 
          variant="outline" 
          onClick={triggerFileSelect}
          disabled={uploading}
        >
          <Image className="h-4 w-4 mr-2" />
          {uploading ? 'Subiendo...' : 'Seleccionar Fotos'}
        </Button>
      </div>

      {/* Show existing photos first */}
      {currentExistingPhotos.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Fotos de la incidencia:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {currentExistingPhotos.map((url, index) => (
              <div key={`existing-${index}`} className="relative">
                <img
                  src={url}
                  alt={`Foto ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border cursor-pointer hover:opacity-75 transition-opacity"
                  onClick={() => window.open(url, '_blank')}
                />
                {incidentId && (
                  <button
                    type="button"
                    onClick={() => removeExistingPhoto(url)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    title="Eliminar foto"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Show preview photos for new uploads */}
      {currentPreviews.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Nuevas fotos:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {currentPreviews.map((url, index) => (
              <div key={`preview-${index}`} className="relative">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
                {incidentId && uploadedFiles.includes(url) && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white rounded-full p-1">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
