import React from 'react';
import { 
  Plus, FileText, ChevronRight, 
  CheckCircle2, AlertCircle, 
  Wallet, ShieldAlert,
  ArrowRight, BellRing, Edit3, Trash2,
  BadgeAlert, Clock, RefreshCw
} from 'lucide-react';
import { usePanelStore } from '../store/usePanelStore';
import { GradientCard, SectionTitle } from '../components/shared/DesignElements';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription 
} from '@/components/ui/dialog';
import { syncService } from '../services/syncService';

export const Dashboard: React.FC<{ onEdit: (id: string) => void; onNavigate: (view: string) => void }> = ({ onEdit, onNavigate }) => {
  const { 
    panels, addPanel, updatePanel, deletePanel, tasks, taskDefinitions, 
    pendencies, settings, transactions, events, serviceOrders,
    balanceAlertVisible, getBalance 
  } = usePanelStore();
  const currentYear = new Date().getFullYear();
  const [editingTitleId, setEditingTitleId] = React.useState<string | null>(null);
  const [tempTitle, setTempTitle] = React.useState('');
  const [isDeletingPanel, setIsDeletingPanel] = React.useState<string | null>(null);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [googleConnected, setGoogleConnected] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    syncService.getGoogleSyncStatus().then(status => setGoogleConnected(status.connected));
  }, []);

  const handleSyncToSheets = async () => {
    if (!googleConnected) {
      try {
        const authUrl = await syncService.getGoogleAuthUrl();
        window.location.href = authUrl;
        return;
      } catch (err) {
        toast.error("Erro ao iniciar conexão com Google.");
        return;
      }
    }

    setIsSyncing(true);
    const id = toast.loading("Preparando sincronização...");
    
    try {
      toast.loading("Sincronizando...", { id });
      await syncService.syncToGoogleSheets({
        treasury: transactions,
        tasks: tasks,
        pendencies: pendencies,
        calendar: events,
        serviceOrders: serviceOrders,
        definitions: taskDefinitions
      });
      toast.success("Concluído! Planilha atualizada.", { id });
    } catch (err: any) {
      console.error("Sync error:", err);
      toast.error(err.message || "Falha na sincronização", { id });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateNew = () => {
    const id = `panel-${Date.now()}`;
    addPanel({
      id,
      name: 'Novo Painel de Manutenção',
      description: 'Descrição do novo painel operacional.',
      teams: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    onEdit(id);
  };

  // Compliance Calculation
  const totalSlots = (taskDefinitions || []).reduce((acc, def) => acc + (def.periodsPerYear || 0), 0);
  const completedTasksThisYear = (tasks || []).filter(t => t.status === 'completed' && t.year === currentYear).length;
  const progressPercent = totalSlots > 0 ? (completedTasksThisYear / totalSlots) * 100 : 0;
  const isFullyCompliant = progressPercent >= 100;

  // Pendency Stats
  const criticalPendencies = (pendencies || []).filter(p => p.criticality === 'high').length;
  const totalCorrectiveCost = (pendencies || []).reduce((acc, p) => acc + (p.cost || 0), 0);

  const totalBalance = getBalance();

  // Persistent Pending Compliance Cards (Não Realizei)
  const pendingCompliance = (taskDefinitions || []).filter(def => {
    const completedCount = (tasks || []).filter(t => t.definitionId === def.id && t.year === currentYear && t.status === 'completed').length;
    return completedCount < def.periodsPerYear;
  });

  const handleStartEditTitle = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setEditingTitleId(id);
    setTempTitle(name);
  };

  const handleSaveTitle = (id: string) => {
    updatePanel(id, { name: tempTitle });
    setEditingTitleId(null);
  };

  const confirmDeletePanel = () => {
    if (isDeletingPanel) {
      deletePanel(isDeletingPanel);
      setIsDeletingPanel(null);
      toast.success("Painel removido com sucesso.");
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Safety Modal */}
      <Dialog open={isSafetyModalOpen} onOpenChange={setIsSafetyModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="uppercase font-black text-blue-600 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" /> Padrões de Segurança
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm font-bold text-slate-700 leading-relaxed border-l-4 border-blue-600 pl-4 bg-slate-50 py-3 rounded-r-lg">
              "Para trabalhar com segurança, é essencial planejar as atividades com antecedência. No caso de trabalhos de alto risco, é preciso preencher o formulário DC-85 e enviar ao TM com, no mínimo, 15 dias de antecedência. Veja mais detalhes nos documentos S-283 e DC-82."
            </p>
            <p className="text-sm font-bold text-slate-700 leading-relaxed border-l-4 border-amber-500 pl-4 bg-slate-50 py-3 rounded-r-lg">
              "Como a manutenção pode envolver serviços elétricos, é importante verificar com antecedência quais irmãos estão capacitados para realizar esse tipo de atividade."
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsSafetyModalOpen(false)} className="w-full font-black uppercase text-xs tracking-widest bg-slate-900">Entendido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!isDeletingPanel} onOpenChange={(open) => !open && setIsDeletingPanel(null)}>
        <DialogContent>
           <DialogHeader>
              <DialogTitle className="uppercase font-black">Confirmar Exclusão</DialogTitle>
              <DialogDescription className="font-bold text-slate-600">
                 Tem certeza que deseja excluir este painel e todas as suas equipes? Esta ação não pode ser desfeita.
              </DialogDescription>
           </DialogHeader>
           <DialogFooter>
              <Button variant="ghost" onClick={() => setIsDeletingPanel(null)}>Cancelar</Button>
              <Button variant="destructive" className="font-black uppercase text-xs" onClick={confirmDeletePanel}>Sim, Excluir Painel</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Intelligent Notifications */}
      {balanceAlertVisible && (
        <div className="bg-red-50 border border-red-200 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0 border border-red-200 shadow-inner">
              <BellRing className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h4 className="font-black text-red-900 uppercase tracking-tight text-sm">Alerta de Liquidez Crítica</h4>
              <p className="text-red-700 text-xs font-bold leading-tight mt-1">
                Saldo igual ou inferior a R$ 250,00. Solicitar envio imediato de recursos.
              </p>
            </div>
          </div>
          <Button onClick={() => onNavigate('treasury')} className="bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase h-10 px-6 rounded-xl gap-2 shrink-0 shadow-lg shadow-red-200">
            Ver Tesouraria <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SectionTitle 
            title={settings.appName} 
            subtitle={`Comissão de Funcionamento ${currentYear}`} 
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={isSyncing}
            className={cn(
              "h-10 px-4 font-bold shadow-sm transition-all gap-2",
              googleConnected ? "bg-white" : "bg-blue-600 text-white hover:bg-blue-700 border-none"
            )} 
            onClick={handleSyncToSheets}
          >
            <RefreshCw className={cn("h-4 w-4", googleConnected ? "text-green-600" : "text-white", isSyncing && "animate-spin")} />
            {googleConnected ? "Sincronizar Dados" : "Conectar Google"}
          </Button>
          <Button variant="outline" size="sm" className="h-10 px-4 font-bold shadow-sm bg-white" onClick={() => onNavigate('treasury')}>
            <Wallet className="h-4 w-4 mr-2 text-blue-500" />
            Tesouraria
          </Button>
          <Button onClick={handleCreateNew} className="h-10 gap-2 rounded-xl bg-slate-900 px-5 font-bold shadow-lg hover:bg-slate-800">
            <Plus className="h-5 w-5" />
            Novo Painel
          </Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Compliance Card */}
        <Card 
          className={cn(
            "lg:col-span-2 border-none shadow-xl text-white overflow-hidden relative group cursor-pointer transition-all duration-1000",
            isFullyCompliant ? "bg-green-600 shadow-[0_0_40px_rgba(22,163,74,0.3)] animate-pulse" : "bg-slate-900"
          )} 
          onClick={() => onNavigate('compliance')}
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
            <CheckCircle2 className="h-48 w-48" />
          </div>
          <CardContent className="p-8 relative z-10 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <p className={cn("text-[10px] font-black uppercase tracking-[0.2em]", isFullyCompliant ? "text-green-100" : "text-blue-400")}>
                {isFullyCompliant ? "EXCELÊNCIA TÉCNICA ALCANÇADA" : "Compliance de Manutenção"}
              </p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-7xl font-black tabular-nums tracking-tighter">{progressPercent.toFixed(1)}%</h2>
              </div>
              <div className={cn("h-2 w-full rounded-full overflow-hidden", isFullyCompliant ? "bg-green-800" : "bg-white/5")}>
                <div 
                  className={cn("h-full transition-all duration-1000 ease-out", isFullyCompliant ? "bg-white shadow-[0_0_15px_white]" : "bg-blue-500")}
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>
            </div>
            <div className="mt-8 flex items-center justify-between">
              <p className={cn("text-xs font-bold uppercase tracking-widest", isFullyCompliant ? "text-green-50" : "text-slate-400")}>{completedTasksThisYear} / {totalSlots} Ciclos Técnicos</p>
              <ArrowRight className={cn("h-5 w-5 group-hover:translate-x-2 transition-transform", isFullyCompliant ? "text-white" : "text-blue-400")} />
            </div>
          </CardContent>
        </Card>

        {/* Finance / Treasury Card */}
        <GradientCard className="p-6 bg-white border-none shadow-xl relative overflow-hidden flex flex-col justify-between cursor-pointer group" onClick={() => onNavigate('treasury')}>
           <div className="absolute right-[-10px] top-[-10px] opacity-1 group-hover:scale-110 transition-transform duration-500">
            <Wallet className="h-32 w-32 text-slate-50" />
          </div>
          <div className="space-y-1 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Saldo Consolidado</p>
            <h3 className={cn(
               "text-3xl font-black tabular-nums transition-all",
               totalBalance <= 250 ? "text-red-500 animate-[pulse_1s_infinite] drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "text-slate-900"
            )}>
              R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="mt-4 flex items-center justify-between relative z-10">
            <Badge className={cn(
              "border-none px-2 py-0.5 text-[9px] font-black uppercase shadow-none",
              totalBalance > 250 ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-600"
            )}>
              {totalBalance > 250 ? "Liquidez Segura" : "Liquidez Crítica"}
            </Badge>
            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-100">Gerenciar</Button>
          </div>
        </GradientCard>

        {/* Pendencies Card */}
        <GradientCard className="p-6 bg-white border-none shadow-xl relative overflow-hidden flex flex-col justify-between cursor-pointer group" onClick={() => onNavigate('pending')}>
           <div className="absolute right-[-10px] top-[-10px] opacity-1 group-hover:scale-110 transition-transform duration-500">
            <ShieldAlert className="h-32 w-32 text-slate-50" />
          </div>
          <div className="space-y-1 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Pendências Corretivas</p>
            <h3 className="text-3xl font-black text-red-700">{criticalPendencies}</h3>
          </div>
          <div className="mt-4 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-1 text-[10px] text-red-600 font-bold uppercase tracking-widest">
              <AlertCircle className="h-3 w-3" />
              <span>Ação Urgente</span>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">R$ {totalCorrectiveCost.toLocaleString()}</span>
          </div>
        </GradientCard>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Persistent Compliance Alerts (SERVIÇO PENDENTE) */}
          {pendingCompliance.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                 <BadgeAlert className="h-4 w-4 text-amber-500" /> Manutenções Interrompidas ou Não Realizadas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 {(pendingCompliance || []).map(def => (
                   <div key={def.id} className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between group hover:bg-amber-100 transition-colors cursor-pointer" onClick={() => onNavigate('compliance')}>
                      <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-lg bg-amber-200/50 flex items-center justify-center text-amber-700 shrink-0">
                            <Clock className="h-5 w-5" />
                         </div>
                         <div className="min-w-0">
                            <p className="text-[11px] font-black uppercase tracking-tight text-amber-900 truncate">{def.name}</p>
                            <p className="text-[8px] font-bold text-amber-700 uppercase tracking-widest">Aguardando Execução</p>
                         </div>
                      </div>
                      <Badge className="bg-amber-600 text-white border-none text-[8px] font-black uppercase">Pendente</Badge>
                   </div>
                 ))}
              </div>
            </div>
          )}

          <div className="space-y-6">
            <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 text-slate-700">
               <FileText className="h-5 w-5 text-blue-500" /> Painéis Operacionais
            </h3>

            <div className="grid gap-3">
              {(panels || []).map((panel) => (
                <div key={panel.id} className="relative group">
                  <div
                    onClick={() => onEdit(panel.id)}
                    className="flex w-full items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-lg shadow-sm text-left px-6 cursor-pointer"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                      <FileText className="h-6 w-6" />
                    </div>
                    
                    <div className="flex-1 overflow-hidden">
                      {editingTitleId === panel.id ? (
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Input 
                            value={tempTitle} 
                            onChange={(e) => setTempTitle(e.target.value)}
                            onBlur={() => handleSaveTitle(panel.id)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSaveTitle(panel.id)}
                            autoFocus
                            className="h-8 py-0 font-bold"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 truncate">{panel.name}</h4>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleStartEditTitle(e, panel.id, panel.name)}
                          >
                            <Edit3 className="h-3 w-3 text-slate-400" />
                          </Button>
                        </div>
                      )}
                      <p className="text-xs text-slate-400 font-medium line-clamp-1">{panel.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsDeletingPanel(panel.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-8">
           <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform duration-700">
                <ShieldAlert className="h-24 w-24" />
              </div>
              <p className="font-black text-[10px] uppercase tracking-[0.2em] text-blue-400 mb-2">Protocolos de Risco</p>
              <h4 className="font-black text-xl mb-6 leading-tight uppercase tracking-tighter">Manutenção de Alta Performance</h4>
              <p className="text-slate-400 text-xs font-bold leading-relaxed mb-8">Consulte as normas DC-85, S-283 e DC-82 antes de qualquer intervenção técnica em equipamentos críticos.</p>
              <Button onClick={() => setIsSafetyModalOpen(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase h-12 shadow-lg shadow-blue-900/40">
                Padrão de Segurança
              </Button>
           </div>

           <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Padrões de Execução</h3>
              <div className="grid grid-cols-1 gap-2">
                 {(taskDefinitions || []).slice(0, 4).map(def => (
                   <div key={def.id} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between hover:border-blue-200 transition-colors shadow-sm group">
                      <div className="flex items-center gap-3">
                         <div className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <Clock className="h-4 w-4" />
                         </div>
                         <p className="font-black text-[10px] uppercase tracking-tight text-slate-700">{def.name}</p>
                      </div>
                      <Badge className="bg-slate-100 text-slate-500 border-none text-[8px] font-black uppercase">{def.frequency}</Badge>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="pt-12 pb-6 mt-12 border-t border-slate-100 flex flex-col items-center justify-center gap-2">
         <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
           Desenvolvido por Jaaziel Silva. Desenvolvedor Sênior.
         </p>
         <div className="h-1 w-12 bg-blue-600 rounded-full opacity-20" />
      </footer>
    </div>
  );
};
