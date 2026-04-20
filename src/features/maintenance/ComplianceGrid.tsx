import React, { useState } from 'react';
import { usePanelStore } from '../../store/usePanelStore';
import { 
  CheckCircle2, AlertTriangle, 
  Trash2, Send, 
  ShieldCheck, Clock,
  Trophy, BadgeAlert, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogTrigger, DialogFooter, DialogDescription 
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { TaskDefinition } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

export const ComplianceGrid: React.FC = () => {
  const { 
    taskDefinitions, tasks, completeTask, resetTask, panels,
    interruptTask
  } = usePanelStore();
  
  const currentYear = new Date().getFullYear();
  const [resetModal, setResetModal] = useState<{defId: string, idx: number} | null>(null);

  // Total required periods across all definitions
  const totalPeriodsRequired = taskDefinitions.reduce((acc, def) => acc + (def.periodsPerYear || 1), 0);
  const totalPeriodsCompleted = tasks.filter(t => t.status === 'completed' && t.year === currentYear).length;
  const globalProgress = totalPeriodsRequired > 0 ? (totalPeriodsCompleted / totalPeriodsRequired) * 100 : 0;
  const isFullyCompliant = globalProgress >= 100;

  const handleRealizei = (def: TaskDefinition, idx: number) => {
    completeTask(def.id, idx, currentYear);
    toast.success(`Execução #${idx + 1} de ${def.name} registrada!`);
  };

  const handleNaoRealizei = (def: TaskDefinition, idx: number) => {
    interruptTask(def.id, idx, currentYear);
    toast.error(`Manutenção #${idx + 1} de ${def.name} marcada como não realizada! Pendência registrada.`);
  };

  const confirmReset = () => {
    if (resetModal) {
      resetTask(resetModal.defId, resetModal.idx, currentYear);
      setResetModal(null);
      toast.info("Status resetado para pendente.");
    }
  };

  return (
    <div className="min-h-full flex flex-col p-4 md:p-6 bg-slate-50/50">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Status de Conformidade</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest italic">Compliance anual de equipamentos e instalações.</p>
        </div>

        <div className={cn(
          "px-6 py-4 rounded-2xl transition-all duration-1000 flex items-center gap-6",
          isFullyCompliant 
            ? "bg-green-600 text-white shadow-[0_0_40px_rgba(34,197,94,0.6)] border-2 border-green-300 animate-[pulse_2s_infinite]" 
            : "bg-white border text-slate-900 shadow-xl"
        )}>
           <div className="space-y-1">
              <p className={cn("text-[9px] font-black uppercase tracking-widest", isFullyCompliant ? "text-green-100" : "text-slate-400")}>Progresso Geral {currentYear}</p>
              <h3 className="text-2xl font-black leading-none">{globalProgress.toFixed(1)}%</h3>
           </div>
           {isFullyCompliant && <Trophy className="h-8 w-8 text-yellow-300" />}
        </div>
      </header>

      {/* SCROLLABLE GRID */}
      <div className="flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
           {(taskDefinitions || []).map(def => {
             const defTasks = (tasks || []).filter(t => t.definitionId === def.id && t.year === currentYear && t.status === 'completed');
             const completionPercent = (defTasks.length / (def.periodsPerYear || 1)) * 100;
             const isDefComplete = completionPercent >= 100;

             return (
               <Card 
                 key={def.id} 
                 className={cn(
                   "flex flex-col border-none shadow-sm transition-all h-full min-h-[160px]",
                   isDefComplete ? "bg-green-50 shadow-green-100/50 ring-2 ring-green-300 animate-[glow_3s_infinite]" : "bg-white"
                 )}
               >
                 <CardHeader className="p-3 space-y-2 shrink-0">
                    <div className="flex items-center justify-between">
                       <Badge 
                         variant="outline" 
                         className={cn(
                           "text-[9px] font-black uppercase tracking-widest",
                           isDefComplete ? "border-green-300 bg-green-100 text-green-700" : "border-slate-200 text-slate-500"
                         )}
                         style={!isDefComplete && def.color ? { borderColor: def.color+'40', color: def.color, backgroundColor: def.color+'10' } : {}}
                       >
                          {def.frequency}
                       </Badge>
                       <span className="text-[10px] font-black text-slate-300"># {def.id}</span>
                    </div>
                    <CardTitle className="text-sm font-black uppercase tracking-tight line-clamp-1">{def.name}</CardTitle>
                 </CardHeader>
                 
                 <CardContent className="p-3 flex-1 flex flex-col justify-between pt-0">
                    <div className="grid grid-cols-1 gap-1.5 pb-3">
                       {Array.from({ length: def.periodsPerYear || 1 }).map((_, idx) => {
                         const task = tasks.find(t => t.definitionId === def.id && t.periodIndex === idx && t.year === currentYear);
                         const isPeriodDone = task?.status === 'completed';
                         const isInterrupted = task?.status === 'interrupted';
                         
                         return (
                           <div key={idx} className="flex gap-1.5">
                              <Button
                                size="sm"
                                className={cn(
                                  "flex-1 h-8 text-[9px] font-black uppercase tracking-tighter",
                                  isPeriodDone ? "bg-green-600 hover:bg-green-700" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                )}
                                onClick={() => !isPeriodDone && handleRealizei(def, idx)}
                              >
                                {isPeriodDone ? <CheckCircle2 className="h-3 w-3 mr-1" /> : null}
                                Realizei
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className={cn(
                                  "flex-1 h-8 text-[9px] font-black uppercase tracking-tighter",
                                  isInterrupted ? "bg-red-600 text-white hover:bg-red-700 shadow-[0_0_10px_rgba(239,68,68,0.3)]" : "text-slate-300 hover:text-red-600"
                                )}
                                onClick={() => handleNaoRealizei(def, idx)}
                              >
                                {isInterrupted ? <AlertCircle className="h-3 w-3 mr-1" /> : null}
                                Não Realizei
                              </Button>
                           </div>
                         );
                       })}
                    </div>
                    
                    <div className="space-y-1.5 mt-auto border-t pt-2">
                       <div className="flex justify-between items-center text-[9px] font-black uppercase mb-1">
                          <span className="text-slate-400">Progresso</span>
                          <span className={cn(isDefComplete ? "text-green-600" : "text-slate-600")}>{completionPercent.toFixed(1)}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
                          <div 
                            className={cn("h-full transition-all duration-500", isDefComplete ? "bg-green-500" : "bg-blue-500")}
                            style={{ width: `${completionPercent}%`, backgroundColor: !isDefComplete && def.color ? def.color : undefined }}
                          />
                       </div>
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         className="w-full h-7 text-[8px] font-bold uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 gap-1.5"
                         onClick={() => {
                            const team = panels.flatMap(p => p.teams).find(t => t.taskType === def.id);
                            if (!team) {
                              toast.error("Nenhuma equipe vinculada a este serviço.");
                              return;
                            }
                            const leaderPhone = team.customFields.find(f => f.id === 'leader-phone')?.value;
                            if (!leaderPhone) {
                              toast.error("Líder sem telefone cadastrado.");
                              return;
                            }
                            const msg = `*MANUTENÇÃO PENDENTE:* ${def.name}\n*EQUIPE:* ${team.name}\nFavor realizar o serviço conforme ficha técnica.`;
                            window.open(`https://wa.me/${leaderPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                         }}
                       >
                         <Send className="h-3 w-3" />
                         Notificar Líder
                       </Button>
                    </div>
                 </CardContent>
               </Card>
             );
           })}
        </div>
      </div>

      <Dialog open={!!resetModal} onOpenChange={(open) => !open && setResetModal(null)}>
        <DialogContent>
           <DialogHeader>
              <DialogTitle className="uppercase font-black">Confirmar Reset</DialogTitle>
              <DialogDescription className="font-bold text-slate-600">
                 Tem certeza que NÃO realizou este serviço? O status de conformidade voltará para pendente.
              </DialogDescription>
           </DialogHeader>
           <DialogFooter>
              <Button variant="ghost" onClick={() => setResetModal(null)}>Cancelar</Button>
              <Button variant="destructive" className="font-black uppercase text-xs" onClick={confirmReset}>Sim, Resetar Status</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
