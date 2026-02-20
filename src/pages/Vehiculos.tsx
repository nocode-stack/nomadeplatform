import React, { useState } from 'react';
import { Plus, Car, Search } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent } from '../components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import NewVehicleCard from '../components/vehicles/NewVehicleCard';
import NewVehicleFormDialog from '../components/vehicles/NewVehicleFormDialog';
import NewVehiclePreviewDialog from '../components/vehicles/NewVehiclePreviewDialog';
import AssignVehicleDialog from '../components/vehicles/AssignVehicleDialog';
import CSVVehicleUpload from '../components/vehicles/CSVVehicleUpload';
import { useNewVehicles, useAssignNewVehicleToProject, useCreateNewVehicle, useUpdateNewVehicle, useDeleteNewVehicle } from '../hooks/useNewVehicles';
import { NewVehicle, NewVehicleFormData, NewVehicleFilters } from '../types/vehicles';
import { toast } from 'sonner';

const Vehiculos = () => {
  const [filters, setFilters] = useState<NewVehicleFilters>({
    search: '',
    assigned: 'all'
  });
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isUnassignDialogOpen, setIsUnassignDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<NewVehicle | null>(null);
  const [assigningVehicleId, setAssigningVehicleId] = useState<string>('');
  const [unassigningVehicle, setUnassigningVehicle] = useState<NewVehicle | null>(null);
  const [deletingVehicleId, setDeletingVehicleId] = useState<string>('');

  const {
    data: vehicles,
    isLoading
  } = useNewVehicles();

  const createVehicle = useCreateNewVehicle();
  const updateVehicle = useUpdateNewVehicle();
  const deleteVehicle = useDeleteNewVehicle();
  const assignVehicle = useAssignNewVehicleToProject();

  // Filtrar y ordenar vehículos
  const filteredVehicles = vehicles?.filter(vehicle => {
    const matchesSearch = !filters.search ||
      vehicle.numero_bastidor.toLowerCase().includes(filters.search.toLowerCase()) ||
      vehicle.matricula?.toLowerCase().includes(filters.search.toLowerCase()) ||
      vehicle.vehicle_code.toLowerCase().includes(filters.search.toLowerCase()) ||
      vehicle.proveedor?.toLowerCase().includes(filters.search.toLowerCase());

    const matchesAssignment = filters.assigned === 'all' ||
      (filters.assigned === 'assigned' && vehicle.project_id) ||
      (filters.assigned === 'unassigned' && !vehicle.project_id);

    const matchesLocation = !filters.location || vehicle.location === filters.location;
    const matchesEstadoPago = !filters.estado_pago || vehicle.estado_pago === filters.estado_pago;

    return matchesSearch && matchesAssignment && matchesLocation && matchesEstadoPago;
  })?.sort((a, b) => {
    // Ordenar: disponibles primero (sin project_id), asignados al final
    if (!a.project_id && b.project_id) return -1; // a va primero (disponible)
    if (a.project_id && !b.project_id) return 1;  // b va primero (disponible)
    return 0; // mantener orden original si ambos tienen el mismo estado
  }) || [];

  const handleCreateVehicle = (data: NewVehicleFormData) => {
    createVehicle.mutate(data, {
      onSuccess: () => {
        setIsFormDialogOpen(false);
      }
    });
  };

  const handleEditVehicle = (vehicle: NewVehicle) => {
    setSelectedVehicle(vehicle);
    setIsFormDialogOpen(true);
  };

  const handleUpdateVehicle = (data: NewVehicleFormData) => {
    if (!selectedVehicle) return;

    updateVehicle.mutate({
      id: selectedVehicle.id,
      data: data as Partial<NewVehicleFormData>
    }, {
      onSuccess: () => {
        setIsFormDialogOpen(false);
        setSelectedVehicle(null);
      }
    });
  };


  const handleDeleteVehicle = (vehicleId: string) => {
    setDeletingVehicleId(vehicleId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingVehicleId) {
      deleteVehicle.mutate(deletingVehicleId, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setDeletingVehicleId('');
        }
      });
    }
  };

  const handleViewDetail = (vehicle: NewVehicle) => {
    setSelectedVehicle(vehicle);
    setIsPreviewDialogOpen(true);
  };

  const handleAssignVehicle = (vehicleId: string) => {
    const vehicle = vehicles?.find(v => v.id === vehicleId);

    // Si el vehículo está asignado, mostrar confirmación directa para desasignar
    if (vehicle?.project_id) {
      setUnassigningVehicle(vehicle);
      setIsUnassignDialogOpen(true);
    } else {
      // Si no está asignado, abrir el dialog de selección
      setAssigningVehicleId(vehicleId);
      setIsAssignDialogOpen(true);
    }
  };

  const handleConfirmUnassign = () => {
    if (unassigningVehicle) {
      assignVehicle.mutate({
        vehicleId: unassigningVehicle.id,
        projectId: undefined // Desasignar
      }, {
        onSuccess: () => {
          setIsUnassignDialogOpen(false);
          setUnassigningVehicle(null);
        }
      });
    }
  };

  const handleConfirmAssignment = (projectId?: string) => {
    assignVehicle.mutate({
      vehicleId: assigningVehicleId,
      projectId
    }, {
      onSuccess: () => {
        setIsAssignDialogOpen(false);
        setAssigningVehicleId('');
      }
    });
  };

  const openNewVehicleDialog = () => {
    setSelectedVehicle(null);
    setIsFormDialogOpen(true);
  };

  const currentVehicle = vehicles?.find(v => v.id === assigningVehicleId);

  return (
    <Layout title="Vehículos" subtitle="Gestión del inventario de vehículos">
      <div className="pt-0 space-y-6 animate-blur-in">
        {/* Header */}
        <div className="sticky top-[var(--header-h)] bg-background z-10 flex items-center justify-between !mt-0 py-4 border-b border-border shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center">
              <div className="p-3 bg-primary rounded-2xl text-primary-foreground mr-4 shadow-xl shadow-primary/20">
                <Car className="h-8 w-8" />
              </div>
              Flota de Vehículos
            </h1>
            <p className="text-muted-foreground mt-1 text-xs font-bold uppercase tracking-wider ml-[72px]">
              Gestión centralizada del inventario nomad
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <CSVVehicleUpload />
            <Button onClick={openNewVehicleDialog} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20 h-12 px-6">
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Vehículo
            </Button>
          </div>
        </div>

        <Card className="bg-card border-border shadow-md overflow-hidden animate-fade-in-up [animation-delay:200ms]">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="lg:col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Búsqueda Global</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Bastidor, matrícula, color..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10 bg-background border-border rounded-xl focus:ring-primary/10 focus:border-primary h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Asignación</label>
                <Select
                  value={filters.assigned}
                  onValueChange={(value) => setFilters({ ...filters, assigned: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="assigned">Asignados</SelectItem>
                    <SelectItem value="unassigned">Sin asignar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Motor</label>
                <Select
                  value={filters.engine || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, engine: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Ubicación</label>
                <Select
                  value={filters.location || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, location: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="nomade">Nómade</SelectItem>
                    <SelectItem value="concesionario">Concesionario</SelectItem>
                    <SelectItem value="taller">Taller</SelectItem>
                    <SelectItem value="cliente">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <div className="px-5 py-3 rounded-2xl border bg-primary/5 border-primary/20 shadow-sm flex-1">
                  <div className="text-2xl font-bold text-primary">
                    {filteredVehicles.length}
                  </div>
                  <div className="text-[10px] font-bold text-primary/60 uppercase tracking-wider">
                    Vehículos Disponibles
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Cargando vehículos...</p>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {vehicles?.length === 0 ? 'No hay vehículos registrados' : 'No hay vehículos que coincidan con los filtros'}
            </h3>
            <p className="text-gray-600 mb-4">
              {vehicles?.length === 0 ? 'Comienza agregando tu primer vehículo al inventario' : 'Intenta ajustar los filtros para ver más resultados'}
            </p>
            {vehicles?.length === 0 && (
              <div className="flex gap-3 justify-center">
                <CSVVehicleUpload />
                <Button onClick={openNewVehicleDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Primer Vehículo
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in-up [animation-delay:400ms]">
            {filteredVehicles.map((vehicle, idx) => (
              <div key={vehicle.id} style={{ animationDelay: `${idx * 30}ms` }} className="animate-fade-in-up">
                <NewVehicleCard
                  vehicle={vehicle}
                  onAssign={handleAssignVehicle}
                  onEdit={handleEditVehicle}
                  onDelete={handleDeleteVehicle}
                  onViewDetail={handleViewDetail}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <NewVehicleFormDialog
        open={isFormDialogOpen}
        onOpenChange={(open) => {
          setIsFormDialogOpen(open);
          if (!open) setSelectedVehicle(null);
        }}
        onSubmit={selectedVehicle ? handleUpdateVehicle : handleCreateVehicle}
        isLoading={createVehicle.isPending || updateVehicle.isPending}
        vehicle={selectedVehicle}
      />

      <NewVehiclePreviewDialog
        vehicle={selectedVehicle}
        open={isPreviewDialogOpen}
        onOpenChange={setIsPreviewDialogOpen}
      />

      <AssignVehicleDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        onAssign={handleConfirmAssignment}
        vehicleId={assigningVehicleId}
        currentProjectId={currentVehicle?.project_id}
        isLoading={assignVehicle.isPending}
        useNewTable={true}
      />

      <AlertDialog open={isUnassignDialogOpen} onOpenChange={setIsUnassignDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desasignar vehículo</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres desasignar el vehículo {unassigningVehicle?.vehicle_code} del proyecto {unassigningVehicle?.projects?.code || 'proyecto'}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmUnassign} disabled={assignVehicle.isPending}>
              {assignVehicle.isPending ? 'Desasignando...' : 'Desasignar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar vehículo</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar permanentemente el vehículo {vehicles?.find(v => v.id === deletingVehicleId)?.vehicle_code}? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={deleteVehicle.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteVehicle.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Vehiculos;
