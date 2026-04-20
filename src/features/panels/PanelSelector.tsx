import React from 'react';
import { usePanelStore } from '../../store/usePanelStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ChevronRight, Plus } from 'lucide-react';

interface PanelSelectorProps {
  onSelect: (id: string) => void;
  onCreate: () => void;
}

export const PanelSelector: React.FC<PanelSelectorProps> = ({ onSelect, onCreate }) => {
  const { panels } = usePanelStore();

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Editor de Painéis</h1>
        <p className="text-slate-500 text-sm font-medium italic">Selecione um painel operacional para editar a estrutura e equipes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {panels.map((panel) => (
          <Card 
            key={panel.id} 
            className="group hover:border-blue-500 cursor-pointer transition-all shadow-sm hover:shadow-xl border-slate-100"
            onClick={() => onSelect(panel.id)}
          >
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{panel.name}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5 line-clamp-1">{panel.description}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </CardContent>
          </Card>
        ))}

        <button 
          onClick={onCreate}
          className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 p-8 hover:border-blue-500 hover:bg-slate-50 transition-all min-h-[100px]"
        >
          <Plus className="h-6 w-6 text-slate-400 group-hover:text-blue-600 mb-2" />
          <span className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400 group-hover:text-blue-600 transition-colors">Criar Novo Painel</span>
        </button>
      </div>
    </div>
  );
};
