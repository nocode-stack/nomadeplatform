
import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import NewIncidentFormAdvanced from '../components/incidents/NewIncidentFormAdvanced';
import IncidentCard from '../components/incidents/IncidentCard';
import IncidentsDashboard from '../components/incidents/IncidentsDashboard';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, Filter, AlertTriangle, Clock, Wrench, CheckCircle } from 'lucide-react';
import { useNewIncidentsList } from '../hooks/useNewIncidents';

const Incidencias = () => {
  const { data: incidents = [], isLoading } = useNewIncidentsList();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.project?.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.project?.project_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || incident.status?.status_code === statusFilter;
    const matchesCategory = categoryFilter === 'all' || incident.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Métricas clave para el resumen
  const totalIncidents = incidents.length;
  const reportedIncidents = incidents.filter(i => i.status?.status_code === 'reportada').length;
  const inRepairIncidents = incidents.filter(i => i.status?.status_code === 'en_reparacion').length;
  const completedIncidents = incidents.filter(i => i.status?.status_code === 'cerrada').length;

  if (isLoading) {
    return (
      <Layout title="Incidencias">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Cargando incidencias...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Incidencias">
      <div className="pt-0 space-y-6 mx-0">
        {/* Header - más compacto */}
        <div className="flex items-center justify-between !mt-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Gestión de Incidencias</h1>
            <p className="text-sm text-gray-600">Reporta y gestiona incidencias de los proyectos</p>
          </div>
          <NewIncidentFormAdvanced />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="incidencias" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="incidencias">Incidencias</TabsTrigger>
            <TabsTrigger value="dashboard">Data</TabsTrigger>
          </TabsList>

          <TabsContent value="incidencias" className="space-y-4">
            {/* Enhanced Stats Grid - red theme for incidents */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-red-50 rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-red-500 to-red-600 shadow-sm">
                    <AlertTriangle className="h-5 w-5 text-white stroke-[1.5]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-2xl font-bold text-gray-900 leading-none">{totalIncidents}</p>
                  <p className="text-sm font-medium text-gray-700 leading-tight">Total Incidencias</p>
                  <p className="text-xs text-red-700 font-medium">En el sistema</p>
                </div>
              </div>

              <div className="bg-red-50 rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-red-500 to-red-600 shadow-sm">
                    <Clock className="h-5 w-5 text-white stroke-[1.5]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-2xl font-bold text-gray-900 leading-none">{reportedIncidents}</p>
                  <p className="text-sm font-medium text-gray-700 leading-tight">Pendientes</p>
                  <p className="text-xs text-red-700 font-medium">Esperando asignación</p>
                </div>
              </div>

              <div className="bg-red-50 rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-red-500 to-red-600 shadow-sm">
                    <Wrench className="h-5 w-5 text-white stroke-[1.5]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-2xl font-bold text-gray-900 leading-none">{inRepairIncidents}</p>
                  <p className="text-sm font-medium text-gray-700 leading-tight">En Reparación</p>
                  <p className="text-xs text-red-700 font-medium">Siendo reparadas</p>
                </div>
              </div>

              <div className="bg-red-50 rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-red-500 to-red-600 shadow-sm">
                    <CheckCircle className="h-5 w-5 text-white stroke-[1.5]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-2xl font-bold text-gray-900 leading-none">{completedIncidents}</p>
                  <p className="text-sm font-medium text-gray-700 leading-tight">Completadas</p>
                  <p className="text-xs text-red-700 font-medium">Reparaciones terminadas</p>
                </div>
              </div>
            </div>

            {/* Filtros - más compactos */}
            <div className="sticky top-[var(--header-h)] z-10 bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[250px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar por cliente, código o descripción..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-9"
                    />
                  </div>
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="reportada">Reportada</SelectItem>
                    <SelectItem value="en_revision">En Revisión</SelectItem>
                    <SelectItem value="asignada">Asignada</SelectItem>
                    <SelectItem value="en_reparacion">En Reparación</SelectItem>
                    <SelectItem value="reparada">Reparada</SelectItem>
                    <SelectItem value="cerrada">Cerrada</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    <SelectItem value="Mobiliario">Mobiliario</SelectItem>
                    <SelectItem value="Sistema eléctrico">Sistema eléctrico</SelectItem>
                    <SelectItem value="Agua">Agua</SelectItem>
                    <SelectItem value="Gas">Gas</SelectItem>
                    <SelectItem value="Revestimiento">Revestimiento</SelectItem>
                    <SelectItem value="Vehículo">Vehículo</SelectItem>
                    <SelectItem value="Filtraciones">Filtraciones</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Lista de Incidencias - grid más compacto */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredIncidents.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <Filter className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-lg">
                    {incidents.length === 0 ? 'No hay incidencias reportadas' : 'No se encontraron incidencias con los filtros aplicados'}
                  </p>
                </div>
              ) : (
                filteredIncidents.map((incident) => (
                  <IncidentCard key={incident.id} incident={incident} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="dashboard">
            <IncidentsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Incidencias;
