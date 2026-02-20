
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useDepartmentPermissions } from '../../hooks/useDepartmentPermissions';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FileText,
  PenTool,
  FolderOpen,
  Car,
  CalendarDays,
  AlertCircle,
  LogOut,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className }: SidebarProps) => {
  const { user, logout } = useAuth();
  const { data: permissions } = useDepartmentPermissions();

  if (!user) return null;

  const displayDepartment = permissions?.department?.name || 'Sin asignar';

  const menuSections = [
    {
      title: 'Principal',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/', show: true },
        {
          icon: UserPlus,
          label: 'Usuarios',
          path: '/usuarios',
          show: permissions?.routes.includes('/usuarios')
        },
      ]
    },
    {
      title: 'CRM & Ventas',
      items: [
        { icon: Users, label: 'CRM / Leads', path: '/crm', show: true },
        { icon: FileText, label: 'Presupuestos', path: '/presupuestos', show: true },
        { icon: PenTool, label: 'Contratos', path: '/contratos', show: true },
      ]
    },
    {
      title: 'Operaciones',
      items: [
        { icon: FolderOpen, label: 'Proyectos', path: '/proyectos', show: true },
        { icon: Car, label: 'Vehículos', path: '/vehiculos', show: true },
        { icon: CalendarDays, label: 'Planificación', path: '/planificacion-produccion', show: true },
        { icon: AlertCircle, label: 'Incidencias', path: '/incidencias', show: true },
      ]
    }
  ];

  return (
    <div className={cn("w-60 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border shadow-xl print:hidden", className)}>
      {/* Header / Logo */}
      <div className="p-6 border-b border-sidebar-border/50">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-3">
            <div className="bg-[#D9D9D9] p-1 rounded-2xl w-14 h-14 flex items-center justify-center shadow-lg">
              <img
                src="/lovable-uploads/logo_grande.jpg"
                alt="Nomade Logo"
                className="w-full h-auto object-contain rounded-lg"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white tracking-tight leading-none">Nomade</span>
              <span className="text-sm font-medium text-sidebar-foreground/40 tracking-wider">Nation</span>
            </div>
          </div>
          <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
            <p className="text-[10px] uppercase tracking-widest text-primary font-bold">
              {displayDepartment}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto no-scrollbar">
        {menuSections.map((section, idx) => (
          <div key={idx} className="mb-8 last:mb-0">
            <h3 className="px-4 text-[10px] font-bold text-sidebar-foreground/50 uppercase tracking-[2px] mb-4">
              {section.title}
            </h3>
            <ul className="space-y-1.5">
              {section.items.filter(item => item.show).map(item => {
                const isDisabled = section.title === 'Operaciones';

                if (isDisabled) {
                  return (
                    <li key={item.path}>
                      <div
                        className="flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 opacity-40 cursor-not-allowed text-sidebar-foreground/40"
                        title="Sección bloqueada"
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="text-sm font-medium tracking-wide">{item.label}</span>
                      </div>
                    </li>
                  );
                }

                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive
                          ? 'bg-primary text-white shadow-lg shadow-primary/20'
                          : 'hover:bg-sidebar-accent hover:text-sidebar-primary text-sidebar-foreground/70'
                        }`
                      }
                    >
                      <item.icon className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110`} />
                      <span className="text-sm font-medium tracking-wide">{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer / User */}
      <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/30">
        <button
          onClick={() => logout()}
          className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all duration-300"
        >
          <LogOut className="h-5 w-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
