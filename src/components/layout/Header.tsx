
import React, { useEffect } from 'react';
import { Search, Bell, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUserProfile } from '../../hooks/useUserProfile';
import { ROLE_PERMISSIONS } from '../../types/auth';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import ProfileDialog from '../user/ProfileDialog';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import Sidebar from './Sidebar';
import Van3DHeader from '../3d/Van3DHeader';

interface HeaderProps {
  title: string;
  subtitle?: string;
  isDashboard?: boolean;
  currentPhase?: string;
}

const Header = ({ title, subtitle, isDashboard = false, currentPhase }: HeaderProps) => {
  const { user, logout } = useAuth();
  const { data: profile, isLoading: profileLoading, refetch } = useUserProfile(user?.id);

  useEffect(() => {
    const syncHeaderHeight = () => {
      const headerEl = document.getElementById('app-header');
      if (headerEl) {
        const height = headerEl.offsetHeight;
        document.documentElement.style.setProperty('--header-h', `${height}px`);
      }
    };

    const timer = setTimeout(syncHeaderHeight, 0);
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newHeight = Math.round(entry.contentRect.height);
        document.documentElement.style.setProperty('--header-h', `${newHeight}px`);
      }
    });

    const headerEl = document.getElementById('app-header');
    if (headerEl) {
      resizeObserver.observe(headerEl);
    }

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, []);

  if (!user) return null;

  const userPermissions = ROLE_PERMISSIONS[user.role];
  const displayName = profile?.name || user.name || 'Usuario';
  const displayAvatar = profile?.avatar_url || user.avatar;
  const displayDepartment = profile?.department || user.department || userPermissions.name;

  return (
    <header
      id="app-header"
      className="relative w-full h-28 flex items-center px-4 md:px-6 lg:px-8 border-b border-white/10 shadow-xl print:hidden"
      style={{
        backgroundImage: 'url("/lovable-uploads/fondo8.png")',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: '50% 60%'
      }}
    >
      {/* Readability Overlay: Subtle gradient from top (darker) to bottom (transparent) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-transparent z-0"></div>

      {/* 3D Van Animation (Safe Version) */}
      <Van3DHeader />

      <div className="flex items-center justify-between w-full relative z-10 gap-2 md:gap-4">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <Sheet>
            <SheetTrigger asChild>
              <button className="lg:hidden p-1.5 text-white/70 hover:text-white transition-colors shrink-0">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 border-none w-64">
              <Sidebar className="w-full h-full" />
            </SheetContent>
          </Sheet>
          <div className="text-white min-w-0">
            <h1 className="text-lg md:text-xl xl:text-2xl font-bold tracking-tight drop-shadow-lg truncate">
              {isDashboard ? `¡Hola, ${displayName}!` : title}
            </h1>
            {subtitle && <p className="text-[10px] md:text-xs text-white/80 font-medium drop-shadow-md truncate">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center space-x-1.5 md:space-x-3 shrink-0">
          {/* Search */}
          <div className="relative group hidden 2xl:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-white/50 group-focus-within:text-white transition-colors" />
            <input
              type="text"
              placeholder="Buscar..."
              className="pl-9 pr-3 py-1.5 bg-white/10 backdrop-blur-md text-white placeholder:text-white/40 rounded-xl border border-white/20 focus:border-primary focus:ring-2 focus:ring-primary/5 w-36 2xl:w-48 text-sm transition-all outline-none"
            />
          </div>

          <button className="p-1.5 text-white/70 hover:text-white transition-colors relative">
            <Bell className="h-4 w-4 md:h-5 md:w-5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full border border-black/20 shadow-sm"></span>
          </button>


          <ProfileDialog onProfileUpdate={() => refetch()}>
            <div className="flex items-center space-x-2 cursor-pointer group p-1 hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10 shrink-0">
              <div className="text-right hidden sm:block max-w-[100px] lg:max-w-none">
                <p className="font-bold text-xs text-white drop-shadow-md truncate">
                  {profileLoading ? '...' : displayName}
                </p>
                <p className="text-[8px] uppercase tracking-wider font-bold text-white/60 group-hover:text-primary transition-colors truncate">
                  {displayDepartment}
                </p>
              </div>
              <Avatar className="h-7 w-7 md:h-8 md:w-8 lg:h-9 lg:w-9 border border-white/20 shadow-lg overflow-hidden ring-2 ring-white/10 shrink-0">
                <AvatarImage src={displayAvatar} className="object-cover" />
                <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold uppercase">
                  {displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
          </ProfileDialog>
        </div>
      </div>
    </header>
  );
};

export default Header;
