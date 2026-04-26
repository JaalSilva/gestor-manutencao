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

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      active 
        ? "bg-slate-900 text-white shadow-sm" 
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    )}
  >
    <Icon className="h-4 w-4" />
    <span className="flex-1 text-left line-clamp-1">{label}</span>
    {active && <ChevronRight className="h-3 w-3" />}
  </button>
);

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
      {/* Mobile Overlay */}
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
            {isOpen && <span className="text-lg font-black tracking-tight uppercase truncate animate-in fade-in duration-500">{settings.appName}</span>}
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
            <Separator className="my-4" />
            {isOpen && <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 animate-in fade-in duration-500">Governança</p>}
            <NavItem 
              icon={LayoutDashboard} 
              label={isOpen ? "Início" : ""} 
              active={activeView === 'dashboard'} 
              onClick={() => { setView('dashboard'); if (window.innerWidth < 1024) onClose(); }}
            />
            <NavItem 
              icon={ShieldCheck} 
              label={isOpen ? "Comissão" : ""} 
              active={activeView === 'commission'} 
              onClick={() => { setView('commission'); if (window.innerWidth < 1024) onClose(); }}
            />
            <NavItem 
              icon={PenTool} 
              label={isOpen ? "Editor de Painel" : ""} 
              active={activeView === 'editor'} 
              onClick={() => { setView('editor'); if (window.innerWidth < 1024) onClose(); }}
            />
            <NavItem 
              icon={CalendarIcon} 
              label={isOpen ? "Calendário" : ""} 
              active={activeView === 'calendar'} 
              onClick={() => { setView('calendar'); if (window.innerWidth < 1024) onClose(); }}
            />
            
            <Separator className="my-4" />
            {isOpen && <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 animate-in fade-in duration-500">Manutenção</p>}
            <NavItem 
              icon={Database} 
              label={isOpen ? "Compliance Anual" : ""} 
              active={activeView === 'compliance'} 
              onClick={() => { setView('compliance'); if (window.innerWidth < 1024) onClose(); }}
            />
            <NavItem 
              icon={BookOpen} 
              label={isOpen ? "Biblioteca Técnica" : ""} 
              active={activeView === 'library'} 
              onClick={() => { setView('library'); if (window.innerWidth < 1024) onClose(); }}
            />
            <NavItem 
              icon={FileText} 
              label={isOpen ? "Ordens de Serviço" : ""} 
              active={activeView === 'service-orders'} 
              onClick={() => { setView('service-orders'); if (window.innerWidth < 1024) onClose(); }}
            />

            <Separator className="my-4" />
            {isOpen && <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 animate-in fade-in duration-500">Financeiro</p>}
            <NavItem 
              icon={Receipt} 
              label={isOpen ? "Tesouraria" : ""} 
              active={activeView === 'treasury'} 
              onClick={() => { setView('treasury'); if (window.innerWidth < 1024) onClose(); }}
            />

            <Separator className="my-4" />
            {isOpen && <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 animate-in fade-in duration-500">Pendências</p>}
            <NavItem 
              icon={AlertCircle} 
              label={isOpen ? "Gestão Geral" : ""} 
              active={activeView === 'pending'} 
              onClick={() => { setView('pending'); if (window.innerWidth < 1024) onClose(); }}
            />

            <Separator className="my-4" />
            <NavItem 
              icon={Settings} 
              label={isOpen ? "Configurações" : ""} 
              active={activeView === 'settings'}
              onClick={() => { setView('settings'); if (window.innerWidth < 1024) onClose(); }}
            />
          </nav>

        <div className="mt-auto overflow-hidden">
          {isOpen ? (
            <div className="rounded-xl bg-slate-900 p-4 text-white shadow-xl animate-in slide-in-from-bottom-2 duration-500">
              <div className="flex justify-between items-end mb-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Progresso {currentYear}</p>
                <p className="text-sm font-black">{progressPercent}%</p>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div 
                  className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000" 
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>
              <p className="mt-2 text-[10px] text-slate-400 leading-tight truncate">
                {completedTasksThisYear} de {totalSlots} períodos.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center p-2 rounded-lg bg-slate-900 text-white shadow-lg">
               <span className="text-[10px] font-black">{progressPercent}%</span>
            </div>
          )}
          
          <div className="mt-4 flex items-center gap-3 px-2 border-t pt-4 border-slate-100 min-h-[50px]">
            <div className="h-8 w-8 shrink-0 rounded-full bg-blue-600 border border-blue-700 flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-lg shadow-blue-500/20">
              SH
            </div>
            {isOpen && (
              <div className="flex-1 overflow-hidden animate-in fade-in duration-500">
                <p className="truncate text-sm font-bold text-slate-700">Sincronismo Online</p>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    Ativo agora
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
    </>
  );
};
