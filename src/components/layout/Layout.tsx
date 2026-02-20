
import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  isDashboard?: boolean;
  currentPhase?: string;
}

const Layout = ({ children, title, subtitle, isDashboard = false, currentPhase }: LayoutProps) => {
  return (
    <div className="flex w-full h-screen overflow-hidden bg-background">
      {/* Sidebar Container */}
      <div className="hidden lg:block w-60 flex-shrink-0 border-r border-sidebar-border bg-sidebar h-full overflow-hidden">
        <Sidebar className="w-60 h-full" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <Header title={title} subtitle={subtitle} isDashboard={isDashboard} currentPhase={currentPhase} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
