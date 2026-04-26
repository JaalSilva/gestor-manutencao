import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Settings as SettingsIcon, Menu, X, RefreshCcw } from 'lucide-react';
import { usePanelStore } from '../../store/usePanelStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { motion } from 'motion/react';

interface HeaderProps {
  onToggleSidebar: () => void;
  onNavigateToSettings: () => void;
  sidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onNavigateToSettings, sidebarOpen }) => {
  const { settings, isHydrated } = usePanelStore();
  const [now, setNow] = useState(new Date());
  const currentYear = 2026;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 border-b bg-white/80 backdrop-blur-md px-4 md:px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden h-9 w-9 text-slate-600"
          onClick={onToggleSidebar}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        <div className="flex items-center gap-3">
          {settings.appLogo ? (
            <img src={settings.appLogo} alt="Logo" className="h-8 w-8 rounded-lg object-contain shadow-sm bg-white" />
          ) : null}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-black tracking-tight text-blue-600 uppercase">
                {settings.appName}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={onNavigateToSettings}
              >
                <SettingsIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
            <motion.p 
              initial={{ opacity: 0.5 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-[9px] font-bold text-slate-400 uppercase tracking-widest"
            >
              Complexos de salões do Reino
            </motion.p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-6 text-slate-500 font-mono text-[11px] font-medium tracking-wider uppercase">
        <div className="hidden md:flex flex-col items-end mr-2">
          <span className="text-[10px] font-black text-slate-900">Desenvolvido por Jaaziel Silva</span>
          <span className="text-[8px] font-bold text-slate-400">Desenvolvedor Sênior</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
           <span>{format(now, "dd 'de' MMMM", { locale: ptBR })}</span>
        </div>
        {!isHydrated && (
          <div className="flex items-center gap-2 text-blue-600 animate-pulse">
            <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
            <span className="text-[9px] font-black uppercase">Sincronizando</span>
          </div>
        )}
        <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-lg shadow-lg shadow-blue-500/10">
           <Clock className="h-3.5 w-3.5 text-blue-400" />
           <span className="font-bold">{format(now, 'HH:mm:ss')}</span>
        </div>
      </div>
    </header>
  );
};
