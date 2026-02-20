
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { User, Camera, Lock, Eye, EyeOff, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUserProfile, useUpdateProfile } from '../../hooks/useUserProfile';
import { useAvatarUpload } from '../../hooks/useAvatarUpload';
import { useToast } from '../../hooks/use-toast';

interface ProfileDialogProps {
  children: React.ReactNode;
  onProfileUpdate?: () => void;
}

const ProfileDialog = ({ children, onProfileUpdate }: ProfileDialogProps) => {
  const { user, updateUserProfile, changePassword, logout } = useAuth();
  const { data: profile, refetch } = useUserProfile(user?.id);
  const updateProfile = useUpdateProfile();
  const { uploadAvatar, isUploading } = useAvatarUpload();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    phone: '',
    avatar_url: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (import.meta.env.DEV) console.log('👤 ProfileDialog - Datos disponibles:', {
      user,
      profile,
      formData
    });

    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        department: profile.department || '',
        phone: profile.phone || '',
        avatar_url: profile.avatar_url || ''
      });
    } else if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        department: user.department || ''
      }));
    }
  }, [profile, user]);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "El archivo debe ser una imagen",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "El archivo es demasiado grande (máximo 5MB)",
        variant: "destructive",
      });
      return;
    }

    const avatarUrl = await uploadAvatar(file, user.id);
    if (avatarUrl) {
      setFormData(prev => ({ ...prev, avatar_url: avatarUrl }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (import.meta.env.DEV) console.log('💾 Enviando datos del perfil:', formData);

    try {
      await updateProfile.mutateAsync({
        user_id: user.id,
        ...formData
      });

      updateUserProfile({
        name: formData.name,
        email: formData.email,
        department: formData.department,
        avatar: formData.avatar_url
      });

      await refetch();

      if (onProfileUpdate) {
        onProfileUpdate();
      }

      setOpen(false);
    } catch (error) {
      console.error('❌ Error al actualizar perfil:', error);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas nuevas no coinciden",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const success = await changePassword(passwordData.newPassword);

      if (success) {
        toast({
          title: "Contraseña actualizada",
          description: "Tu contraseña se ha cambiado correctamente",
        });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setActiveTab('profile');
      } else {
        toast({
          title: "Error",
          description: "No se pudo cambiar la contraseña",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cambiar la contraseña",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordInputChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-4">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'profile'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Perfil
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'password'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <Lock className="w-4 h-4 inline mr-2" />
            Contraseña
          </button>
        </div>

        {activeTab === 'profile' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={formData.avatar_url} />
                  <AvatarFallback className="bg-primary/20 text-primary text-lg">
                    {formData.name ? formData.name.charAt(0).toUpperCase() : <User className="h-8 w-8" />}
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  onClick={handleFileSelect}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Tu nombre completo"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="tu@example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="department">Departamento</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  placeholder="Tu departamento"
                />
              </div>

              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Tu número de teléfono"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateProfile.isPending || isUploading}
              >
                {updateProfile.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Contraseña actual</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                  placeholder="Tu contraseña actual"
                  required
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="newPassword">Nueva contraseña</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  required
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setActiveTab('profile');
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
              </Button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-2">
          <Button
            type="button"
            variant="ghost"
            className="w-full flex justify-start items-center text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-medium"
            onClick={() => {
              setOpen(false);
              logout();
            }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>

          <div className="text-[10px] text-gray-400 text-center uppercase tracking-widest mt-2">
            Nomade Nation &copy; {new Date().getFullYear()}
          </div>
        </div>
      </DialogContent>
    </Dialog >
  );
};

export default ProfileDialog;
