
import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import NewLeadModal from '../components/crm/NewLeadModal';
import { useUnifiedProjectsList } from '../hooks/useUnifiedProjects';
import { useNewIncidentsList } from '../hooks/useNewIncidents';
import { useClients } from '../hooks/useClients';
import { useAuth } from '../hooks/useAuth';
import { useUserProfile } from '../hooks/useUserProfile';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Users,
  AlertTriangle,
  Clock,
  CheckCircle,
  Folder,
  Wrench
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const { data: projects = [], refetch } = useUnifiedProjectsList();
  const { data: incidents = [] } = useNewIncidentsList();
  const { data: clients = [] } = useClients();
  const { user } = useAuth();
  const { data: profile } = useUserProfile(user?.id);

  const stats = [
    {
      title: 'Prospects Activos',
      value: projects.filter(p => p.new_clients?.client_status === 'prospect' && p.new_clients?.is_active !== false).length,
      icon: Folder,
      color: 'from-primary/80 to-primary',
      bgColor: 'bg-primary/5',
      textColor: 'text-primary',
      label: 'En sistema'
    },
    {
      title: 'En Producción',
      value: clients.filter(c => c.client_status === 'client' && c.is_active !== false).length,
      icon: Clock,
      color: 'from-primary/80 to-primary',
      bgColor: 'bg-primary/5',
      textColor: 'text-primary',
      label: 'Actualmente'
    },
    {
      title: 'Incidencias',
      value: incidents.filter(i => i.status?.status_code !== 'terminada').length,
      icon: AlertTriangle,
      color: 'from-orange-500 to-primary',
      bgColor: 'bg-orange-50',
      textColor: 'text-primary',
      label: 'Pendientes'
    },
    {
      title: 'En Reparación',
      value: incidents.filter(i => i.status?.status_code === 'en_reparacion').length,
      icon: Wrench,
      color: 'from-orange-500 to-primary',
      bgColor: 'bg-orange-50',
      textColor: 'text-primary',
      label: 'Actualmente'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'prospect': return <Badge className="bg-muted text-muted-foreground border-border font-medium">Prospect</Badge>;
      case 'production': return <Badge className="bg-primary/10 text-primary border-primary/20 font-medium">Producción</Badge>;
      case 'delivered': return <Badge className="bg-success/10 text-success border-success/20 font-medium">Entregado</Badge>;
      default: return <Badge className="bg-muted text-muted-foreground border-border font-medium">{status}</Badge>;
    }
  };

  return (
    <Layout title="Dashboard" subtitle="Panel de control de Nomade Nation" isDashboard={true}>
      <div className="space-y-8 pb-12 animate-blur-in">
        {/* Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Panel de Control</h2>
            <p className="text-muted-foreground mt-0.5">Resumen de proyectos e incidencias</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
              onClick={() => setIsLeadModalOpen(true)}
            >
              <Users className="w-4 h-4 mr-2" />
              Nuevo Lead
            </Button>
          </div>
        </div>

        <NewLeadModal
          open={isLeadModalOpen}
          onOpenChange={setIsLeadModalOpen}
          onLeadCreated={() => refetch()}
        />

        {/* Original Style Stats Grid - Purple Scheme */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className={`${stat.bgColor} rounded-2xl p-6 border border-primary/10 shadow-sm hover:shadow-md transition-all duration-300 group animate-fade-in-up`} style={{ animationDelay: `${idx * 100}ms` }}>
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg shadow-primary/10`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground leading-none">{stat.value}</h3>
                <p className="text-sm font-semibold text-foreground/80 mt-2">{stat.title}</p>
                <p className={`text-[11px] ${stat.textColor} font-bold mt-1 uppercase tracking-wider`}>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Content Tabs / Split View - Blocked Access */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-up [animation-delay:500ms]">
          {/* Recent Operations */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden opacity-60 pointer-events-none">
            <div className="p-6 border-b border-border/50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground flex items-center">
                <Folder className="w-5 h-5 mr-3 text-primary" />
                Proyectos Recientes
              </h3>
              <Button variant="outline" size="sm" className="text-muted-foreground border-border rounded-xl cursor-not-allowed">
                Bloqueado
              </Button>
            </div>
            <div className="divide-y divide-border/20">
              {projects.slice(0, 5).map((project) => (
                <div key={project.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-xs text-opacity-50">
                      {project.code?.substring(0, 3) || 'NOM'}
                    </div>
                    <div>
                      <p className="font-bold text-muted-foreground/60 text-sm">{project.client_name}</p>
                      <p className="text-xs text-muted-foreground/40">{project.model} • {project.code}</p>
                    </div>
                  </div>
                  {getStatusBadge(project.status)}
                </div>
              ))}
            </div>
          </div>

          {/* Critical Alerts */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden opacity-60 pointer-events-none">
            <div className="p-6 border-b border-border/50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground flex items-center">
                <AlertTriangle className="w-5 h-5 mr-3 text-destructive" />
                Incidencias Críticas
              </h3>
              <Button variant="outline" size="sm" className="text-muted-foreground border-border rounded-xl cursor-not-allowed">
                Bloqueado
              </Button>
            </div>
            <div className="p-6 space-y-4">
              {incidents.length > 0 ? incidents.slice(0, 4).map((incident) => (
                <div key={incident.id} className="flex items-center space-x-4 p-4 rounded-xl bg-muted/20 border border-border/50">
                  <div className="p-2 bg-destructive/10 rounded-lg text-destructive/50">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-muted-foreground/60">{incident.category}</p>
                    <p className="text-xs text-muted-foreground/40">{incident.project?.client_name}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold border-destructive/20 text-destructive/40 uppercase">
                    {incident.status?.status_code === 'reportada' ? 'Pendiente' : 'En curso'}
                  </Badge>
                </div>
              )) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-emerald-50/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-500/50" />
                  </div>
                  <p className="text-sm font-medium text-slate-400">No hay incidencias críticas pendientes.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
