import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { Header } from './components/layout/Header';
import { Dashboard } from './pages/Dashboard';
import { PanelEditor } from './pages/PanelEditor';
import { Compliance } from './pages/Compliance';
import { Settings } from './pages/Settings';
import { Library } from './pages/Library';
import { PendingManagement } from './pages/PendingManagement';
import { Treasury } from './pages/Treasury';
import { Commission } from './pages/Commission';
import { Calendar } from './pages/Calendar';
import { ServiceOrders } from './pages/ServiceOrders';
import { Login } from './pages/Login';
import { usePanelStore } from './store/usePanelStore';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

import { syncService } from './services/syncService';

function AppContent() {
  const [activeView, setActiveView] = useState('dashboard');
  const [editingPanelId, setEditingPanelId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { settings, taskDefinitions, tasks } = usePanelStore();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user) {
      syncService.initSync();
      syncService.startContinuousSync();
      
      // Auto-check Google Integration on startup
      syncService.getGoogleSyncStatus().then(status => {
        if (status.connected) {
          console.log("Sistema conectado ao Google Sheets.");
        }
      });
    }
  }, [user]);

  const currentYear = new Date().getFullYear();
  const totalSlots = (taskDefinitions || []).reduce((acc, def) => acc + (def.periodsPerYear || 0), 0);
  const completedTasksThisYear = (tasks || []).filter(t => t.status === 'completed' && t.year === currentYear).length;
  const progressPercent = totalSlots > 0 ? Math.round((completedTasksThisYear / totalSlots) * 100) : 0;

  const handleEdit = (id: string) => {
    setEditingPanelId(id);
    setActiveView('editor');
  };

  const handleBack = () => {
    setEditingPanelId(null);
    setActiveView('dashboard');
  };

  const navigateTo = (view: string) => {
    setActiveView(view);
    if (view !== 'editor') setEditingPanelId(null);
  };

  // Dynamic Branding (Title & Favicon)
  useEffect(() => {
    document.title = settings.appName || "JW Hub";
    
    if (settings.appLogo) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = settings.appLogo;
      
      // Also update apple-touch-icon if needed for "installation" feel
      let appleLink: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");
      if (!appleLink) {
        appleLink = document.createElement('link');
        appleLink.rel = 'apple-touch-icon';
        document.getElementsByTagName('head')[0].appendChild(appleLink);
      }
      appleLink.href = settings.appLogo;
    }
  }, [settings.appLogo, settings.appName]);

  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Adjust sidebar default state based on screen size
  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">Sincronizando...</p>
      </div>
    );
  }

  // Public access is always granted now
  // if (!user) {
  //   return (
  //     <>
  //       <Login />
  //       <Toaster position="bottom-right" richColors />
  //     </>
  //   );
  // }

  return (
    <TooltipProvider>
      <div 
        className={cn(
          "flex min-h-screen font-sans text-slate-900 antialiased transition-colors duration-500 overflow-x-hidden flex-col",
          progressPercent >= 100 && "ring-8 ring-green-400 ring-inset animate-[pulse_2s_infinite]"
        )}
        style={{ backgroundColor: settings.backgroundColor }}
      >
        <Header 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          onNavigateToSettings={() => navigateTo('settings')}
          sidebarOpen={sidebarOpen}
        />
        
        <Sidebar 
          activeView={activeView} 
          setView={navigateTo} 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        <main className={cn(
          "flex-1 pb-20 lg:pb-0 font-sans transition-all duration-300",
          sidebarOpen ? "lg:pl-64" : "lg:pl-20"
        )}>
          <div className="mx-auto min-h-[calc(100vh-64px)] overflow-y-auto">
            {activeView === 'dashboard' && (
              <Dashboard onEdit={handleEdit} onNavigate={navigateTo} />
            )}
            
            {activeView === 'commission' && (
              <Commission />
            )}
            
            {activeView === 'editor' && editingPanelId && (
              <PanelEditor 
                panelId={editingPanelId} 
                onBack={handleBack} 
              />
            )}

            {activeView === 'compliance' && (
              <Compliance />
            )}

            {activeView === 'library' && (
              <Library />
            )}

            {activeView === 'pending' && (
              <PendingManagement />
            )}

            {activeView === 'settings' && (
              <Settings />
            )}

            {activeView === 'treasury' && (
              <Treasury />
            )}

            {activeView === 'calendar' && (
              <Calendar />
            )}

            {activeView === 'service-orders' && (
              <ServiceOrders />
            )}
          </div>
        </main>

        <BottomNav 
          activeView={activeView} 
          setView={navigateTo} 
        />
        
        <Toaster position="bottom-right" richColors />
      </div>
    </TooltipProvider>
  );
}
