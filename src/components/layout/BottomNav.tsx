import React from 'react';
import { 
  LayoutDashboard, Library, 
  AlertTriangle, Receipt, Calendar as CalendarIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeView: string;
  setView: (v: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeView, setView }) => {
  const items = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Início' },
    { id: 'calendar', icon: CalendarIcon, label: 'Agenda' },
    { id: 'treasury', icon: Receipt, label: 'Financeiro' },
    { id: 'pending', icon: AlertTriangle, label: 'Pendências' },
    { id: 'library', icon: Library, label: 'Recursos' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-100 flex items-center justify-around px-2 lg:hidden z-50 transition-all duration-300 pb-safe">
      {items.map((item) => {
        const Icon = item.icon;
        const active = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all",
              active ? "text-blue-600" : "text-slate-400"
            )}
          >
            <div className={cn(
              "p-1.5 rounded-xl transition-all",
              active ? "bg-blue-50" : "bg-transparent"
            )}>
              <Icon className={cn("h-5 w-5", active ? "stroke-[2.5px]" : "stroke-[2px]")} />
            </div>
            <span className={cn(
              "text-[10px] font-black uppercase tracking-tighter",
              active ? "opacity-100" : "opacity-60"
            )}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
