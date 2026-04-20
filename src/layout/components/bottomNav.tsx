import React from 'react';
import { LayoutDashboard, Library, AlertTriangle, Receipt, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export const BottomNav = ({ activeView, setView }: any) => {
  const items = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Início' },
    { id: 'calendar', icon: Calendar, label: 'Agenda' },
    { id: 'treasury', icon: Receipt, label: 'Contas' },
    { id: 'pending', icon: AlertTriangle, label: 'Alertas' },
    { id: 'library', icon: Library, label: 'Docs' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t flex items-center justify-around lg:hidden z-50">
      {items.map(item => (
        <button key={item.id} onClick={() => setView(item.id)} className={cn(
          "flex flex-col items-center gap-1",
          activeView === item.id ? "text-blue-600" : "text-slate-400"
        )}>
          <item.icon className="h-5 w-5" />
          <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};