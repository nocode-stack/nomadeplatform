import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Mail, Shield, Briefcase, Clock, CheckCircle2, Users, AlertCircle, Plus, Search, Filter, X, MoreVertical, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InviteUserModal } from './InviteUserModal';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AuthorizedUser {
    id: string;
    email: string;
    name: string;
    department: string;
    role: string;
    status: 'pending' | 'active' | 'inactive';
    created_at: string;
}

export const UserInvitationManager = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

    const { data: allUsers, isLoading, error: queryError } = useQuery({
        queryKey: ['user-profiles-list'],
        queryFn: async (): Promise<AuthorizedUser[]> => {
            if (import.meta.env.DEV) console.log('📡 Fetching user profiles...');
            const { data, error } = await (supabase as any)
                .from('user_profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ Error in queryFn:', error);
                throw error;
            }
            if (import.meta.env.DEV) console.log('✅ Users fetched:', data?.length);
            return data || [];
        },
    });

    const deactivateUser = useMutation({
        mutationFn: async (userId: string) => {
            const { error } = await supabase
                .from('user_profiles')
                .update({ status: 'inactive' } as any)
                .eq('id', userId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-profiles-list'] });
            toast({
                title: "Usuario desactivado",
                description: "El usuario ha sido dado de baja correctamente.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "No se pudo desactivar el usuario.",
                variant: "destructive",
            });
        }
    });

    // Extract unique values for filters
    const departments = Array.from(new Set(allUsers?.map(u => u.department).filter(Boolean) || []));
    const roles = Array.from(new Set(allUsers?.map(u => u.role).filter(Boolean) || []));
    const statuses = ['active', 'pending', 'inactive'];

    const filteredUsers = allUsers?.filter(user => {
        const matchesSearch = !searchTerm ||
            user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(user.status);
        const matchesDept = selectedDepartments.length === 0 || selectedDepartments.includes(user.department);
        const matchesRole = selectedRoles.length === 0 || selectedRoles.includes(user.role);

        return matchesSearch && matchesStatus && matchesDept && matchesRole;
    });

    const isFiltered = searchTerm !== '' || selectedStatuses.length > 0 || selectedDepartments.length > 0 || selectedRoles.length > 0;

    const resetFilters = () => {
        setSearchTerm('');
        setSelectedStatuses([]);
        setSelectedDepartments([]);
        setSelectedRoles([]);
    };

    if (isLoading) {
        if (import.meta.env.DEV) console.log('⏳ Loading users...');
        return (
            <div className="flex items-center justify-center p-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (queryError) {
        console.error('❌ Query error:', queryError);
        return (
            <Card className="p-8 border-destructive/20 bg-destructive/5 capitalize">
                <div className="flex flex-col items-center text-center space-y-3">
                    <AlertCircle className="w-10 h-10 text-destructive" />
                    <div className="space-y-1">
                        <h3 className="font-semibold text-destructive">Error al cargar usuarios</h3>
                        <p className="text-sm text-destructive/80">
                            Es posible que la tabla de la base de datos no esté creada.
                            Por favor, aplica la migración SQL proporcionada.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['user-profiles-list'] })}
                        className="border-destructive/20 text-destructive hover:bg-destructive/10"
                    >
                        Reintentar
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto flex-1">
                    <h2 className="text-xl font-semibold tracking-tight">Usuarios</h2>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar usuarios..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm text-foreground placeholder:text-muted-foreground"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="rounded-xl border-border h-10 flex items-center justify-center gap-2 bg-card hover:bg-muted/50 transition-all">
                                    <Filter className="w-4 h-4 text-muted-foreground" />
                                    <span>Filtros</span>
                                    {isFiltered && (
                                        <span className="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] rounded-full font-bold">
                                            {(selectedStatuses.length > 0 ? 1 : 0) + (selectedDepartments.length > 0 ? 1 : 0) + (selectedRoles.length > 0 ? 1 : 0)}
                                        </span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-6 rounded-2xl border-border shadow-2xl bg-card" align="start">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-border pb-3">
                                        <h4 className="font-bold text-foreground flex items-center gap-2">
                                            <Filter className="w-4 h-4" />
                                            Filtros de Usuarios
                                        </h4>
                                        {isFiltered && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={resetFilters}
                                                className="h-8 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary"
                                            >
                                                Limpiar
                                            </Button>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Estado</p>
                                            <div className="space-y-2">
                                                {statuses.map(status => (
                                                    <div key={status} className="flex items-center space-x-3 group cursor-pointer" onClick={() => {
                                                        setSelectedStatuses(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
                                                    }}>
                                                        <Checkbox id={`status-${status}`} checked={selectedStatuses.includes(status)} />
                                                        <Label htmlFor={`status-${status}`} className="text-sm font-medium capitalize cursor-pointer">
                                                            {status === 'active' ? 'Activo' : status === 'pending' ? 'Pendiente' : 'Inactivo'}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Departamento</p>
                                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 no-scrollbar">
                                                {departments.map(dept => (
                                                    <div key={dept} className="flex items-center space-x-3 group cursor-pointer" onClick={() => {
                                                        setSelectedDepartments(prev => prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]);
                                                    }}>
                                                        <Checkbox id={`dept-${dept}`} checked={selectedDepartments.includes(dept)} />
                                                        <Label htmlFor={`dept-${dept}`} className="text-sm font-medium cursor-pointer">{dept}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Rol</p>
                                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 no-scrollbar">
                                                {roles.map(role => (
                                                    <div key={role} className="flex items-center space-x-3 group cursor-pointer" onClick={() => {
                                                        setSelectedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
                                                    }}>
                                                        <Checkbox id={`role-${role}`} checked={selectedRoles.includes(role)} />
                                                        <Label htmlFor={`role-${role}`} className="text-sm font-medium capitalize cursor-pointer">{role.replace('_', ' ')}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>

                        {isFiltered && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetFilters}
                                className="h-10 px-4 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/20 rounded-xl"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Limpiar
                            </Button>
                        )}
                    </div>
                </div>

                <Button
                    onClick={() => setIsModalOpen(true)}
                    className="flex-1 sm:flex-none justify-center rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 animate-pulse-subtle"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Dar de Alta
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers?.map((user) => (
                    <Card key={user.id} className="overflow-hidden border-border/40 hover:border-primary/50 transition-all duration-300 group">
                        <CardHeader className="pb-4 bg-muted/30">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-semibold">{user.name || 'Usuario'}</CardTitle>
                                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                                            <Mail className="w-3 h-3 mr-1" />
                                            {user.email}
                                        </div>
                                    </div>
                                </div>
                                <Badge
                                    variant={(user.status as string) === 'active' ? 'default' : 'secondary'}
                                    className={(user.status as string) === 'active' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'}
                                >
                                    {user.status === 'active' ? (
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                    ) : (
                                        <Clock className="w-3 h-3 mr-1" />
                                    )}
                                    {user.status === 'active' ? 'Activo' : user.status === 'pending' ? 'Pendiente' : 'Inactivo'}
                                </Badge>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted rounded-full">
                                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 rounded-xl border-border shadow-xl bg-card">
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer font-medium"
                                            onClick={() => deactivateUser.mutate(user.id)}
                                            disabled={user.status === 'inactive' || deactivateUser.isPending}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Dar de baja
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Departamento</p>
                                    <div className="flex items-center text-sm font-medium">
                                        <Briefcase className="w-3 h-3 mr-2 text-primary/60" />
                                        {user.department || 'Sin asignar'}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Rol</p>
                                    <div className="flex items-center text-sm font-medium capitalize">
                                        <Shield className="w-3 h-3 mr-2 text-primary/60" />
                                        {user.role ? user.role.replace('_', ' ') : 'Sin rol'}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {allUsers?.length === 0 && (
                <Card className="p-12 border-dashed">
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                            <Users className="w-8 h-8" />
                        </div>
                        <div className="max-w-xs mx-auto">
                            <h3 className="text-lg font-semibold">No hay usuarios</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Comienza invitando a los miembros de tu equipo para que puedan acceder a la plataforma.
                            </p>
                        </div>
                        <Button onClick={() => setIsModalOpen(true)} variant="outline">
                            Invitar Primer Usuario
                        </Button>
                    </div>
                </Card>
            )}

            {allUsers && allUsers.length > 0 && filteredUsers?.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No se encontraron usuarios con los filtros seleccionados.</p>
                    <Button variant="link" onClick={resetFilters} className="mt-2 text-primary font-bold">
                        Limpiar filtros
                    </Button>
                </div>
            )}

            <InviteUserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
};
