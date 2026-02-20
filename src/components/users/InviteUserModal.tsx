import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types/auth';
import { Loader2, Mail } from 'lucide-react';

interface InviteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DEPARTMENTS = [
    'CEO',
    'CFO',
    'Dir. Producción',
    'Dir. Customer',
    'Dir. Marketing',
    'Comercial',
    'Administrador',
    'Operario',
    'Control de Calidad',
    'Atención al Cliente'
];

const ROLES: { label: string; value: UserRole }[] = [
    { label: 'CEO', value: 'ceo' },
    { label: 'CFO', value: 'cfo' },
    { label: 'Director de Producción', value: 'production_director' },
    { label: 'Director de Customer', value: 'customer_director' },
    { label: 'Director de Marketing', value: 'marketing_director' },
    { label: 'Comercial', value: 'commercial' },
    { label: 'Operario', value: 'operator' },
    { label: 'Calidad', value: 'quality' },
];

export const InviteUserModal = ({ isOpen, onClose }: InviteUserModalProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        department: '',
        role: '' as UserRole | '',
    });

    const inviteMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            if (import.meta.env.DEV) console.log('📨 Calling invite-user Edge Function for:', data.email);

            const { data: response, error } = await supabase.functions.invoke('invite-user', {
                body: data,
            });

            if (error) {
                console.error('❌ Edge Function error:', error);
                throw error;
            }
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-profiles-list'] });
            toast({
                title: "Invitación enviada",
                description: `Se ha enviado un email de invitación a ${formData.email}`,
            });
            setFormData({ email: '', name: '', department: '', role: '' });
            onClose();
        },
        onError: async (error: any) => {
            console.error('❌ Error inviting user:', error);

            let errorMessage = "Hubo un error al procesar la invitación.";

            // Try to extract detailed error from Edge Function response
            if (error.context) {
                try {
                    const body = await error.context.json();
                    if (body && body.details) {
                        errorMessage = body.details;
                    } else if (body && body.error) {
                        errorMessage = body.error;
                    }
                } catch (e) {
                    console.error('Could not parse error body:', e);
                }
            }

            toast({
                title: "Error al invitar",
                description: errorMessage,
                variant: "destructive",
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        inviteMutation.mutate(formData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-primary" />
                        Enviar Invitación
                    </DialogTitle>
                    <DialogDescription>
                        Introduce los detalles del nuevo usuario para enviarle una invitación de acceso.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4" noValidate>
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre Completo</Label>
                        <Input
                            id="name"
                            placeholder="Ej. Juan Pérez"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="juan@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="department">Departamento</Label>
                            <Select
                                value={formData.department}
                                onValueChange={(val) => setFormData({ ...formData, department: val })}
                                required
                            >
                                <SelectTrigger id="department">
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DEPARTMENTS.map((dept) => (
                                        <SelectItem key={dept} value={dept}>
                                            {dept}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Rol</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(val) => setFormData({ ...formData, role: val as UserRole })}
                                required
                            >
                                <SelectTrigger id="role">
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROLES.map((role) => (
                                        <SelectItem key={role.value} value={role.value}>
                                            {role.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            disabled={inviteMutation.isPending}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={inviteMutation.isPending}>
                            {inviteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Enviar Invitación
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
