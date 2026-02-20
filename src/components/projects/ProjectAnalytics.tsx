
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import {
  TrendingUp,
  Users,
  Package,
  MapPin,
  Calendar,
  DollarSign,
  Activity,
  Car,
  Settings
} from 'lucide-react';

import { UnifiedProject } from '../../types/database';

interface ProjectAnalyticsProps {
  projects: UnifiedProject[];
}

const ProjectAnalytics = ({ projects }: ProjectAnalyticsProps) => {
  const [activeTab, setActiveTab] = useState('proyectos');

  // Colores para gráficos
  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];

  // ========== MÉTRICAS DE PROYECTOS ==========

  // Estados de proyectos
  const statusStats = projects.reduce((acc, project) => {
    const statusMap: Record<string, string> = {
      'draft': 'Borrador',
      'confirmed': 'Confirmado',
      'pre_production': 'Pre-producción',
      'in_production': 'En Producción',
      'quality_control': 'Control Calidad',
      'packaging': 'Embalaje',
      'delivery': 'Entrega',
      'completed': 'Completado',
      'cancelled': 'Cancelado',
      'on_hold': 'En Pausa'
    };
    const statusName = statusMap[project.status ?? ''] || project.status || 'Desconocido';
    acc[statusName] = (acc[statusName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(statusStats).map(([status, count]) => ({
    name: status,
    value: count,
    percentage: ((count / projects.length) * 100).toFixed(1)
  }));

  // Evolución mensual
  const monthlyData = projects.reduce((acc, project) => {
    const date = new Date(project.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    acc[monthKey] = (acc[monthKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const timelineData = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({
      month: new Date(month + '-01').toLocaleDateString('es-ES', {
        month: 'short',
        year: 'numeric'
      }),
      proyectos: count
    }));

  // ========== MÉTRICAS DE MODELOS ==========

  // Distribución por modelo
  const modelStats = projects.reduce((acc, project) => {
    acc[project.model ?? 'Sin modelo'] = (acc[project.model ?? 'Sin modelo'] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const modelData = Object.entries(modelStats).map(([model, count]) => ({
    name: model,
    value: count,
    percentage: ((count / projects.length) * 100).toFixed(1)
  }));

  // Distribución por motorización
  const powerStats = projects.reduce((acc, project) => {
    const power = project.power || 'Sin especificar';
    acc[power] = (acc[power] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const powerData = Object.entries(powerStats).map(([power, count]) => ({
    name: power,
    value: count
  }));

  // Distribución por paquetes/extras
  const packageStats = projects.reduce((acc, project) => {
    const pack = project.pack || 'Sin paquete';
    acc[pack] = (acc[pack] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const packageData = Object.entries(packageStats).map(([pack, count]) => ({
    name: pack,
    value: count,
    percentage: ((count / projects.length) * 100).toFixed(1)
  }));

  // ========== MÉTRICAS DE CLIENTES ==========

  // Distribución por ubicación
  const locationStats = projects.reduce((acc, project) => {
    const location = 'Sin ubicación'; // Temporalmente comentado hasta migrar completamente
    acc[location] = (acc[location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const locationData = Object.entries(locationStats)
    .map(([location, count]) => ({
      name: location,
      value: count
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10 ubicaciones

  // Métricas generales — requieren datos de presupuestos (fuera del scope de UnifiedProject)
  const totalValue = 0;
  const avgProjectValue = 0;

  return (
    <div className="space-y-6">
      {/* Tabs para las diferentes secciones */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="proyectos" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Proyectos
          </TabsTrigger>
          <TabsTrigger value="modelos" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Modelos
          </TabsTrigger>
          <TabsTrigger value="clientes" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clientes
          </TabsTrigger>
        </TabsList>

        {/* ========== TAB DE PROYECTOS ========== */}
        <TabsContent value="proyectos" className="space-y-6">
          {/* Métricas principales de proyectos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Proyectos</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{projects.length}</p>
                    <p className="text-sm text-gray-500 mt-1">Proyectos activos</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Valor Total</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      €{totalValue.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Cartera total</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Valor Promedio</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      €{Math.round(avgProjectValue).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Por proyecto</p>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-500">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Este Mes</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {timelineData[timelineData.length - 1]?.proyectos || 0}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Proyectos creados</p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-500">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos de proyectos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Estados de proyectos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Estado de Proyectos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number | string) => [value, 'Proyectos']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Evolución mensual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Evolución Mensual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number | string) => [value, 'Proyectos']} />
                    <Line
                      type="monotone"
                      dataKey="proyectos"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ fill: '#10B981' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ========== TAB DE MODELOS ========== */}
        <TabsContent value="modelos" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribución por modelo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Distribución por Modelo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={modelData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {modelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number | string) => [value, 'Proyectos']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Motorización */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Motorización
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={powerData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number | string) => [value, 'Proyectos']} />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Paquetes y extras */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Paquetes y Extras Seleccionados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {packageData.map((pack, index) => (
                  <div key={pack.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm font-medium">{pack.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{pack.value} proyectos</Badge>
                      <span className="text-sm text-gray-500">{pack.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== TAB DE CLIENTES ========== */}
        <TabsContent value="clientes" className="space-y-6">
          {/* Métricas de clientes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Clientes</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {new Set(projects.map(p => p.clients?.name).filter(Boolean)).size}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Clientes únicos</p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-500">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ubicaciones</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{locationData.length}</p>
                    <p className="text-sm text-gray-500 mt-1">Ciudades diferentes</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Proyectos/Cliente</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {(projects.length / new Set(projects.map(p => p.clients?.name).filter(Boolean)).size || 0).toFixed(1)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Promedio</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Distribución geográfica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Distribución Geográfica (Top 10)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={locationData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip formatter={(value: number | string) => [value, 'Proyectos']} />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Placeholder para futuras métricas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Métricas Adicionales de Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-lg">Espacio reservado para futuras métricas</p>
                <p className="text-sm mt-2">
                  Aquí aparecerán nuevos gráficos cuando se añadan más campos a la base de datos
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectAnalytics;
