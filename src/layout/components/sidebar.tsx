import React from 'react';
import { 
  LayoutDashboard, PenTool, Database, FileText, 
  Settings, LogOut, ChevronRight, ShieldCheck,
  BookOpen, AlertCircle, Receipt, Calendar as CalendarIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { usePanelStore } from '../../store/usePanelStore';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  activeView: string;
  setView: (v: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setView, isOpen, onClose }) => {
  const { settings, tasks, taskDefinitions } = usePanelStore();
  const { user } = useAuth();
  
  const currentYear = new Date().getFullYear();
  const totalSlots = taskDefinitions.reduce((acc, def) => acc + def.periodsPerYear, 0);
  const completedTasksThisYear = tasks.filter(t => t.status === 'completed' && t.year === currentYear).length;
  const progressPercent = totalSlots > 0 ? Math.round((completedTasksThisYear / totalSlots) * 100) : 0;

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed left-0 top-0 h-screen transition-all duration-300 z-[70] border-r bg-white",
        isOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:translate-x-0 lg:w-20"
      )}>
        <div className="flex h-full flex-col p-4">
          <div className="mb-8 flex items-center gap-2 px-2 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-900 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            {isOpen && <span className="text-lg font-black tracking-tight uppercase truncate">{settings.appName}</span>}
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto">
            <Separator className="my-4" />
            <NavItem 
              icon={LayoutDashboard} 
              label={isOpen ? "Início" : ""} 
              active={activeView === 'dashboard'} 
              onClick={() => { setView('dashboard'); onClose(); }}
            />
            <NavItem 
              icon={PenTool} 
              label={isOpen ? "Editor de Painel" : ""} 
              active={activeView === 'editor'} 
              onClick={() => { setView('editor'); onClose(); }}
            />
            <NavItem 
              icon={CalendarIcon} 
              label={isOpen ? "Agenda" : ""} 
              active={activeView === 'calendar'} 
              onClick={() => { setView('calendar'); onClose(); }}
            />
            <Separator className="my-4" />
            <NavItem icon={Database} label={isOpen ? "Compliance" : ""} active={activeView === 'compliance'} onClick={() => { setView('compliance'); onClose(); }} />
            <NavItem icon={Receipt} label={isOpen ? "Tesouraria" : ""} active={activeView === 'treasury'} onClick={() => { setView('treasury'); onClose(); }} />
            <NavItem icon={AlertCircle} label={isOpen ? "Pendências" : ""} active={activeView === 'pending'} onClick={() => { setView('pending'); onClose(); }} />
          </nav>

          <div className="mt-auto">
            <div className="rounded-xl bg-slate-900 p-4 text-white">
              <p className="text-[10px] font-bold uppercase text-slate-400">Progresso {currentYear}</p>
              <p className="text-sm font-black">{progressPercent}%</p>
              <div className="h-1.5 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 px-2 border-t pt-4">
              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                {user?.login?.substring(0, 2).toUpperCase()}
              </div>
              {isOpen && <div className="flex-1 truncate text-xs font-bold">{user?.login}</div>}
              <Button variant="ghost" size="icon" onClick={() => { localStorage.removeItem('auth_token'); window.location.reload(); }}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

const NavItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={cn(
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    active ? "bg-slate-900 text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"
  )}>
    <Icon className="h-4 w-4" />
    <span className="flex-1 text-left">{label}</span>
  </button>
);