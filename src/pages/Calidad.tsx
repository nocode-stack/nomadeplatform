
import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import InspectionCard from '../components/quality/InspectionCard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  mockInspections,
  mockQualityMetrics,
  qualityTemplates,
  inspectors
} from '../data/qualityData';
import { QualityInspection, QualityTemplate } from '../types/quality';
import {
  BarChart3,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Filter,
  Search,
  Users,
  FileText,
  Eye,
  Settings
} from 'lucide-react';

const Calidad = () => {
  const [selectedInspection, setSelectedInspection] = useState<QualityInspection | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<QualityTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inspections' | 'templates' | 'metrics'>('dashboard');

  const handleInspectionClick = (inspection: QualityInspection) => {
    setSelectedInspection(inspection);
    if (import.meta.env.DEV) console.log('📋 Inspección seleccionada:', inspection.projectCode);
  };

  const handleTemplateClick = (template: QualityTemplate) => {
    setSelectedTemplate(template);
    if (import.meta.env.DEV) console.log('📝 Template seleccionado:', template.name);
  };

  const getStatusStats = () => {
    const stats = {
      completed: mockInspections.filter(i => i.status === 'completed').length,
      in_progress: mockInspections.filter(i => i.status === 'in_progress').length,
      approved: mockInspections.filter(i => i.status === 'approved').length,
      rejected: mockInspections.filter(i => i.status === 'rejected').length
    };
    return stats;
  };

  const stats = getStatusStats();

  return (
    <Layout
      title="Módulo de Calidad"
      subtitle="Control de calidad integral y gestión de inspecciones"
    >
      <div className="space-y-6">
        {/* Header con controles */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Panel de Control de Calidad</h2>

            <div className="flex space-x-2">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Inspección
              </Button>

              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Configurar Templates
              </Button>
            </div>
          </div>

          {/* Métricas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tasa de Aprobación</p>
                    <p className="text-2xl font-bold text-green-600">
                      {mockQualityMetrics.averagePassRate}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Inspecciones Activas</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.in_progress}
                    </p>
                  </div>
                  <Eye className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Aprobadas</p>
                    <p className="text-2xl font-bold text-green-600">
                      {mockQualityMetrics.passedInspections}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Rechazadas</p>
                    <p className="text-2xl font-bold text-red-600">
                      {mockQualityMetrics.failedInspections}
                    </p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs principales */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="inspections">Inspecciones</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="metrics">Métricas</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Inspecciones recientes */}
            <Card>
              <CardHeader>
                <CardTitle>Inspecciones Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {mockInspections.slice(0, 3).map((inspection) => (
                    <InspectionCard
                      key={inspection.id}
                      inspection={inspection}
                      onClick={handleInspectionClick}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Defectos más comunes */}
            <Card>
              <CardHeader>
                <CardTitle>Defectos Más Comunes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockQualityMetrics.commonDefects.map((defect, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium">{defect.category}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${defect.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {defect.count} ({defect.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inspections" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Todas las Inspecciones</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtrar
                </Button>
                <Button variant="outline" size="sm">
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {mockInspections.map((inspection) => (
                <InspectionCard
                  key={inspection.id}
                  inspection={inspection}
                  onClick={handleInspectionClick}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Templates de Calidad</h3>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Template
              </Button>
            </div>

            <div className="grid gap-4">
              {qualityTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleTemplateClick(template)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant="outline">{template.projectType}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{template.items.length} elementos de control</span>
                      <span>Actualizado: {new Date(template.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tendencia de Calidad</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4" />
                    <p>Gráfico de tendencias - Próximamente</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Equipo de Inspectores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {inspectors.map((inspector) => (
                      <div key={inspector.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{inspector.name}</p>
                            <p className="text-sm text-gray-600">{inspector.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            inspector.level === 'lead' ? 'default' :
                              inspector.level === 'senior' ? 'secondary' : 'outline'
                          }>
                            {inspector.level}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {inspector.certifications.length} certificaciones
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal/Detalles de inspección seleccionada */}
        {selectedInspection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    Inspección: {selectedInspection.projectCode}
                  </h2>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedInspection(null)}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Inspector:</strong> {selectedInspection.inspectorName}</div>
                    <div><strong>Fase:</strong> {selectedInspection.phase}</div>
                    <div><strong>Estado:</strong> {selectedInspection.status}</div>
                    <div><strong>Tasa Aprobación:</strong> {selectedInspection.passRate}%</div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Controles Realizados:</h3>
                    <div className="space-y-2">
                      {selectedInspection.checks.map((check) => (
                        <div key={check.id} className="flex items-center justify-between p-2 border rounded">
                          <span>{check.itemId}</span>
                          <Badge variant={
                            check.status === 'passed' ? 'default' :
                              check.status === 'failed' ? 'destructive' : 'secondary'
                          }>
                            {check.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedInspection.overallNotes && (
                    <div>
                      <h3 className="font-semibold mb-2">Notas Generales:</h3>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded">
                        {selectedInspection.overallNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Calidad;
