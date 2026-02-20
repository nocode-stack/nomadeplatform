import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Package, User, Car, Zap } from 'lucide-react';

interface ProductionSlot {
  id: string;
  production_code: string;
  start_date: string | null;
  end_date: string | null;
  estimated_duration_days: number | null;
  status: 'available' | 'assigned' | 'completed' | 'cancelled';
  project_id: string | null;
  notes: string | null;
  project_name?: string;
  project_model?: string;
  client_name?: string;
  vehicle_specs?: string;
  vehicle_info?: {
    matricula?: string;
    numero_bastidor?: string;
    motorizacion?: string;
    color_exterior?: string;
    plazas?: number;
  };
}

interface ProductionGanttChartProps {
  slots: ProductionSlot[];
  onEditSlot: (slot: ProductionSlot) => void;
  onAssignProject: (slot: ProductionSlot) => void;
}

export const ProductionGanttChart: React.FC<ProductionGanttChartProps> = ({
  slots,
  onEditSlot,
  onAssignProject
}) => {
  // Generar calendario empezando desde hoy
  const generateCalendar = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const months = [];
    
    for (let i = 0; i < 6; i++) {
      const month = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
      
      months.push({
        name: month.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
        days: daysInMonth,
        startDate: new Date(month),
        endDate: new Date(month.getFullYear(), month.getMonth() + 1, 0),
        month: month.getMonth(),
        year: month.getFullYear()
      });
    }
    
    return months;
  };

  // Ordenar slots por código de producción
  const sortedSlots = [...slots]
    .filter(slot => slot.start_date && slot.end_date)
    .sort((a, b) => a.production_code.localeCompare(b.production_code));

  const calendar = generateCalendar();
  const totalDays = calendar.reduce((acc, month) => acc + month.days, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calcular la posición del día actual
  const getTodayPosition = () => {
    const calendarStart = calendar[0].startDate;
    const daysSinceStart = Math.floor((today.getTime() - calendarStart.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysSinceStart);
  };

  const todayPosition = getTodayPosition();
  const todayLeftPercent = (todayPosition / totalDays) * 100;

  // Calcular posición de las barras de Gantt
  const getGanttBarPosition = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const calendarStart = calendar[0].startDate;
    
    const startOffset = Math.max(0, (start.getTime() - calendarStart.getTime()) / (1000 * 60 * 60 * 24));
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    
    const leftPercent = (startOffset / totalDays) * 100;
    const widthPercent = Math.min((duration / totalDays) * 100, 100 - leftPercent);
    
    return { left: `${leftPercent}%`, width: `${widthPercent}%` };
  };

  const getStatusColor = (status: string) => {
    const colors = {
      available: 'bg-emerald-500',
      assigned: 'bg-blue-500',
      completed: 'bg-purple-500',
      cancelled: 'bg-red-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  // Calcular progreso del proyecto
  const getProjectProgress = (slot: ProductionSlot) => {
    if (!slot.start_date || !slot.end_date) return 0;
    if (slot.status === 'completed') return 100;
    if (slot.status === 'available') return 0;
    
    const start = new Date(slot.start_date).getTime();
    const end = new Date(slot.end_date).getTime();
    const now = today.getTime();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const progress = ((now - start) / (end - start)) * 100;
    return Math.round(Math.max(0, Math.min(100, progress)));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  return (
    <div className="w-full h-screen flex flex-col bg-white">
      {/* Header fijo */}
      <div className="flex-shrink-0 bg-gradient-to-r from-slate-50 to-slate-100 border-b p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Diagrama de Gantt
            </h2>
            <p className="text-sm text-gray-600">Planificación de Producción</p>
          </div>
        </div>
      </div>

      {/* Contenedor principal con scroll */}
      <div className="flex-1 flex overflow-hidden">
        {/* Columna fija de proyectos */}
        <div className="w-80 flex-shrink-0 border-r bg-gradient-to-b from-gray-50 to-white flex flex-col">
          {/* Encabezado fijo de proyectos */}
          <div className="h-16 bg-gradient-to-r from-gray-100 to-gray-50 border-b flex items-center px-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-600" />
              <span className="font-semibold text-gray-800">Proyectos</span>
            </div>
          </div>
          
          {/* Lista de proyectos con scroll independiente */}
          <ScrollArea className="flex-1">
            {sortedSlots.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Package className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No hay slots programados</p>
              </div>
            ) : (
              <div className="space-y-1">
                {sortedSlots.map((slot, index) => {
                  const isAssigned = slot.status === 'assigned';
                  const progress = getProjectProgress(slot);
                  
                  return (
                    <div key={slot.id} className={`p-3 hover:bg-blue-50/50 transition-colors cursor-pointer ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                    }`} onClick={() => onEditSlot(slot)}>
                      {/* Código de producción */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold text-sm text-gray-900">
                          {slot.production_code}
                        </span>
                        <Badge 
                          className={`text-xs px-2 py-1 ${
                            isAssigned 
                              ? 'bg-blue-100 text-blue-800 border-blue-200' 
                              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {isAssigned ? 'Asignado' : 'Disponible'}
                        </Badge>
                      </div>
                      
                      {/* Info del proyecto */}
                      {isAssigned ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-blue-600" />
                            <span className="text-xs font-medium text-blue-700 truncate">
                              {slot.client_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Car className="h-3 w-3 text-blue-600" />
                            <span className="text-xs text-blue-600 truncate">
                              {slot.project_model}
                            </span>
                          </div>
                          
                          {/* Información del vehículo */}
                          <div className={`rounded p-2 mt-2 space-y-1 ${
                            slot.vehicle_info ? 'bg-blue-50' : 'bg-gray-100'
                          }`}>
                            <div className="flex items-center gap-1">
                              <Car className={`h-3 w-3 ${
                                slot.vehicle_info ? 'text-blue-600' : 'text-gray-500'
                              }`} />
                              <span className={`text-xs font-medium ${
                                slot.vehicle_info ? 'text-blue-700' : 'text-gray-600'
                              }`}>
                                {slot.vehicle_info ? 'Vehículo:' : 'Vehículo no asignado'}
                              </span>
                            </div>
                            
                            {slot.vehicle_info ? (
                              <>
                                {slot.vehicle_info.matricula && (
                                  <div className="text-xs text-blue-600 ml-4 font-medium">
                                    {slot.vehicle_info.matricula}
                                  </div>
                                )}
                                {slot.vehicle_info.numero_bastidor && (
                                  <div className="text-xs text-blue-600 ml-4">
                                    Bastidor: {slot.vehicle_info.numero_bastidor}
                                  </div>
                                )}
                                <div className="text-xs text-blue-600 ml-4">
                                  {slot.vehicle_info.motorizacion}
                                </div>
                              </>
                            ) : (
                              <div className="text-xs text-gray-500 ml-4">
                                Pendiente de asignación
                              </div>
                            )}
                          </div>
                          
                          {/* Barra de progreso */}
                          <div className="mt-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-600">Progreso</span>
                              <span className="text-xs font-medium text-gray-700">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-1.5" />
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>Sin asignar</div>
                          <div className="text-gray-500">
                            {slot.estimated_duration_days} días estimados
                          </div>
                        </div>
                      )}

                      {/* Fechas */}
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {formatDate(slot.start_date!)} - {formatDate(slot.end_date!)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Área del diagrama de Gantt */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Encabezado del calendario fijo */}
          <div className="h-16 border-b bg-gradient-to-r from-blue-50 to-purple-50 flex-shrink-0 relative">
            <ScrollArea className="h-full">
              <div className="flex h-full relative" style={{ minWidth: `${totalDays * 25}px` }}>
                {/* Línea del día actual en el encabezado */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-emerald-500 z-20 shadow-lg"
                  style={{ left: `${todayLeftPercent}%` }}
                >
                  <div className="absolute -top-1 -left-2 w-4 h-6 bg-emerald-500 rounded-b flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                </div>
                
                {calendar.map((month, index) => (
                  <div 
                    key={index} 
                    className="flex flex-col border-r border-gray-200 flex-shrink-0"
                    style={{ width: `${(month.days / totalDays) * 100}%`, minWidth: `${month.days * 25}px` }}
                  >
                    {/* Nombre del mes */}
                    <div className="h-8 flex items-center justify-center bg-gradient-to-r from-blue-100 to-purple-100 font-semibold text-sm text-gray-700 border-b">
                      {month.name}
                    </div>
                    
                    {/* Días */}
                    <div className="h-8 flex">
                      {Array.from({ length: month.days }, (_, dayIndex) => {
                        const currentDate = new Date(month.year, month.month, dayIndex + 1);
                        const isToday = currentDate.toDateString() === today.toDateString();
                        
                        return (
                          <div 
                            key={dayIndex}
                            className={`flex-1 text-center text-xs flex items-center justify-center border-r border-gray-100 ${
                              isToday ? 'bg-emerald-100 font-bold text-emerald-700' : 'text-gray-600'
                            }`}
                            style={{ minWidth: '25px' }}
                          >
                            {dayIndex + 1}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Área de las barras de Gantt con scroll independiente */}
          <div className="flex-1 overflow-auto relative">
            <div className="relative" style={{ minWidth: `${totalDays * 25}px` }}>
              {/* Línea vertical del día actual */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-emerald-500 opacity-60 z-10"
                style={{ left: `${todayLeftPercent}%` }}
              ></div>
              
              {sortedSlots.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p className="text-sm">No hay datos para mostrar</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {sortedSlots.map((slot, index) => {
                    const barPosition = getGanttBarPosition(slot.start_date!, slot.end_date!);
                    
                    return (
                      <div 
                        key={slot.id} 
                        className={`h-[60px] relative ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                        } hover:bg-blue-50/30 transition-colors border-b border-gray-100`}
                      >
                        {/* Barra de Gantt */}
                        <div 
                          className={`absolute top-3 h-6 rounded-lg ${getStatusColor(slot.status)} 
                            shadow-md hover:shadow-lg transition-all duration-200 flex items-center 
                            justify-center text-white text-xs font-medium cursor-pointer
                            hover:scale-105 transform`}
                          style={barPosition}
                          onClick={() => onEditSlot(slot)}
                        >
                          <span className="truncate px-2">
                            {slot.production_code}
                          </span>
                        </div>
                        
                        {/* Información adicional */}
                        <div className="absolute bottom-2 left-2 text-xs text-gray-500">
                          {slot.status === 'assigned' && slot.client_name && (
                            <span className="bg-white px-2 py-1 rounded shadow-sm">
                              {slot.client_name}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Leyenda fija en la parte inferior */}
      <div className="flex-shrink-0 border-t p-3 bg-gradient-to-r from-gray-50 to-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm">
            <span className="font-medium text-gray-700">Estados:</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-emerald-500 rounded shadow-sm"></div>
              <span className="text-gray-600">Disponible</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded shadow-sm"></div>
              <span className="text-gray-600">Asignado</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-purple-500 rounded shadow-sm"></div>
              <span className="text-gray-600">Completado</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded shadow-sm"></div>
              <span className="text-gray-600">Cancelado</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-0.5 h-4 bg-emerald-500 shadow-sm"></div>
            <span className="text-sm text-gray-600">Día actual</span>
          </div>
        </div>
      </div>
    </div>
  );
};
