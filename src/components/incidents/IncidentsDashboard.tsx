
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Wrench } from 'lucide-react';
import { useNewIncidentsList } from '../../hooks/useNewIncidents';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const IncidentsDashboard = () => {
  const { data: incidents = [] } = useNewIncidentsList();

  // Métricas básicas
  const totalIncidents = incidents.length;
  const reportedIncidents = incidents.filter(i => i.status?.status_code === 'reportada').length;
  const inRepairIncidents = incidents.filter(i => i.status?.status_code === 'en_reparacion').length;
  const completedIncidents = incidents.filter(i => i.status?.status_code === 'terminada').length;

  // Categorías con más problemas
  const categoryStats = incidents.reduce((acc, incident) => {
    acc[incident.category] = (acc[incident.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(categoryStats)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  // Datos para gráfico de evolución mensual
  const monthlyData = incidents.reduce((acc, incident) => {
    const date = new Date(incident.incident_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    acc[monthKey] = (acc[monthKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const evolutionData = Object.entries(monthlyData)
    .map(([month, count]) => ({ month, incidencias: count }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6); // Últimos 6 meses

  // Datos para gráfico de estados
  const statusData = [
    { name: 'Reportada', value: reportedIncidents, color: '#ef4444' },
    { name: 'Fechas Asignadas', value: incidents.filter(i => i.status?.status_code === 'fechas_asignadas').length, color: '#f59e0b' },
    { name: 'En Reparación', value: inRepairIncidents, color: '#3b82f6' },
    { name: 'Terminada', value: completedIncidents, color: '#10b981' }
  ];

  // Cálculo de mejora (comparando último mes con anterior)
  const currentMonth = evolutionData[evolutionData.length - 1]?.incidencias || 0;
  const previousMonth = evolutionData[evolutionData.length - 2]?.incidencias || 0;
  const improvementPercentage = previousMonth > 0 ? ((previousMonth - currentMonth) / previousMonth) * 100 : 0;

  // Talleres con más incidencias
  const workshopStats = incidents.reduce((acc, incident) => {
    acc[incident.workshop] = (acc[incident.workshop] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 mb-8">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incidencias</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalIncidents}</div>
            <p className="text-xs text-muted-foreground">
              Todas las incidencias registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportedIncidents}</div>
            <p className="text-xs text-muted-foreground">
              Esperando asignación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Reparación</CardTitle>
            <Wrench className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inRepairIncidents}</div>
            <p className="text-xs text-muted-foreground">
              Siendo reparadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedIncidents}</div>
            <p className="text-xs text-muted-foreground">
              Reparaciones terminadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolución mensual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Evolución Mensual
              {improvementPercentage > 0 ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  -{improvementPercentage.toFixed(1)}%
                </Badge>
              ) : improvementPercentage < 0 ? (
                <Badge variant="outline" className="text-red-600 border-red-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{Math.abs(improvementPercentage).toFixed(1)}%
                </Badge>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="incidencias" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Estados de incidencias */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de Incidencias</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Categorías y talleres */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categorías con más problemas */}
        <Card>
          <CardHeader>
            <CardTitle>Categorías con Más Incidencias</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ranking de talleres */}
        <Card>
          <CardHeader>
            <CardTitle>Incidencias por Taller</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(workshopStats)
                .sort(([,a], [,b]) => b - a)
                .map(([workshop, count], index) => (
                  <div key={workshop} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        index === 0 ? 'bg-red-500' : 
                        index === 1 ? 'bg-orange-500' : 
                        index === 2 ? 'bg-yellow-500' : 'bg-gray-400'
                      }`} />
                      <span className="font-medium">{workshop}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ width: `${(count / Math.max(...Object.values(workshopStats))) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold w-8">{count}</span>
                    </div>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IncidentsDashboard;
