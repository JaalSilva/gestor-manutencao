import React, { useState, useRef } from 'react';
import { 
  BookOpen, Plus, Search, FileUp, Download, 
  Trash2, Edit3, CheckCircle2, AlertTriangle, FileText,
  Clock, ShieldCheck, ChevronRight, X, Send, Printer
} from 'lucide-react';
import { usePanelStore } from '../store/usePanelStore';
import { useAuth } from '../contexts/AuthContext';
import { TaskDefinition, AppSettings, Team } from '../types';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ServiceOrderPDF } from '../services/pdf/ServiceOrderPDF';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogTrigger, DialogFooter, DialogDescription 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';
import { cn } from '@/lib/utils';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const Library: React.FC = () => {
  const { isGuest } = useAuth();
  const { 
    taskDefinitions, addTaskDefinition, updateTaskDefinition, 
    deleteTaskDefinition, panels, settings,
    tasks, completeTask, resetTask
  } = usePanelStore();
  const currentYear = new Date().getFullYear();
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingDef, setViewingDef] = useState<TaskDefinition | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmingPeriod, setConfirmingPeriod] = useState<{ defId: string, idx: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<TaskDefinition>>({
    name: '',
    frequency: 'Anual',
    periodsPerYear: 1,
    steps: [],
    safety: [],
    description: ''
  });

  const [newStep, setNewStep] = useState('');
  const [newSafety, setNewSafety] = useState('');

  const filteredDefs = taskDefinitions.filter(def => 
    def.name.toLowerCase().includes(search.toLowerCase()) ||
    def.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    if (!formData.name) {
      toast.error('O nome da ficha é obrigatório.');
      return;
    }

    if (editingId) {
      updateTaskDefinition(editingId, formData);
      toast.success('Ficha técnica atualizada!');
    } else {
      addTaskDefinition({
        ...formData as TaskDefinition,
        id: `def-${Date.now()}`
      });
      toast.success('Nova ficha técnica adicionada!');
    }

    resetForm();
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      name: '',
      frequency: 'Anual',
      periodsPerYear: 1,
      steps: [],
      safety: [],
      description: ''
    });
    setNewStep('');
    setNewSafety('');
  };

  const startView = (def: TaskDefinition) => {
    setViewingDef(def);
    setIsViewing(true);
    // Find a team that uses this task to pre-select
    const relatedTeam = panels.flatMap(p => p.teams).find(t => t.taskType === def.id);
    if (relatedTeam) setSelectedTeamId(relatedTeam.id);
  };

  const handleToggleExecution = (periodIndex: number) => {
    if (!viewingDef) return;
    const task = tasks.find(t => t.definitionId === viewingDef.id && t.periodIndex === periodIndex && t.year === currentYear);
    const isDone = task?.status === 'completed';

    if (isDone) {
      resetTask(viewingDef.id, periodIndex, currentYear);
      toast.info("Execução redefinida para pendente.");
    } else {
      setConfirmingPeriod({ defId: viewingDef.id, idx: periodIndex });
    }
  };

  const confirmExecution = () => {
    if (confirmingPeriod) {
      completeTask(confirmingPeriod.defId, confirmingPeriod.idx, currentYear);
      toast.success("Execução técnica registrada!");
      setConfirmingPeriod(null);
    }
  };

  const handleResetExecution = (idx: number) => {
     if (!viewingDef) return;
     resetTask(viewingDef.id, idx, currentYear);
     toast.info("Execução redefinida para pendente.");
  };

  const handleWhatsAppSend = () => {
    if (!viewingDef) return;
    const team = panels.flatMap(p => p.teams).find(t => t.id === selectedTeamId);
    if (!team) {
       toast.error("Selecione uma equipe para enviar.");
       return;
    }

    const leaderPhone = team.customFields.find(f => f.id === 'leader-phone')?.value;
    if (!leaderPhone) {
       toast.error("Telefone do líder não cadastrado para esta equipe.");
       return;
    }

    const message = `*ORDEM TÉCNICA - ${viewingDef.name}*\n\n` +
      `*Procedimentos:*\n${viewingDef.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n` +
      `*Segurança:*\n${viewingDef.safety.map(s => `• ${s}`).join('\n')}\n\n` +
      `*EQUIPE:* ${team.name}\n*LÍDER:* ${team.leader}`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?phone=${leaderPhone}&text=${encodedMessage}`, '_blank');
  };

  const addStep = () => {
    if (newStep.trim()) {
      setFormData(prev => ({ ...prev, steps: [...(prev.steps || []), newStep.trim()] }));
      setNewStep('');
    }
  };

  const addSafety = () => {
    if (newSafety.trim()) {
      setFormData(prev => ({ ...prev, safety: [...(prev.safety || []), newSafety.trim()] }));
      setNewSafety('');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      toast.error('O arquivo excede o limite de 3MB.');
      return;
    }

    setIsProcessing(true);
    const fileName = file.name.split('.')[0];
    
    try {
      let text = '';
      if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        try {
          const result = await mammoth.extractRawText({ arrayBuffer });
          text = result.value;
        } catch (mError) {
          console.error('Mammoth Error:', mError);
          toast.error('Este arquivo Word não é suportado. Use apenas .docx moderno.');
          return;
        }
      } else if (file.name.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          fullText += content.items.map((item: any) => item.str).join(' ') + '\n';
        }
        text = fullText;
      }

      // Simple heuristic for extraction
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      const steps: string[] = [];
      const safety: string[] = [];
      let currentSection: 'steps' | 'safety' | null = null;

      lines.forEach(line => {
        const lower = line.toLowerCase();
        if (lower.includes('procedimento') || lower.includes('passo') || lower.includes('execução')) {
          currentSection = 'steps';
        } else if (lower.includes('segurança') || lower.includes('epi') || lower.includes('risco')) {
          currentSection = 'safety';
        } else if (currentSection === 'steps') {
          steps.push(line);
        } else if (currentSection === 'safety') {
          safety.push(line);
        }
      });

      setFormData({
        name: fileName,
        description: `Extraído de ${file.name}`,
        frequency: 'Anual',
        periodsPerYear: 1,
        steps: steps.length > 0 ? steps : ['Redigir procedimentos técnicos...'],
        safety: safety.length > 0 ? safety : ['Adicionar requisitos de segurança...']
      });
      setIsAdding(true);
      toast.success('Documento processado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao processar o arquivo.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Biblioteca Técnica</h1>
          <p className="text-slate-500 mt-1">Repositório central de fichas de manutenção e diretrizes operacionais.</p>
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".pdf,.docx" 
            onChange={handleFileUpload}
          />
          <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
            <FileUp className="h-4 w-4" />
            {isProcessing ? 'Processando...' : 'Importar PDF/Word'}
          </Button>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4" />
            Nova Ficha Manual
          </Button>
        </div>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Pesquisar fichas por nome ou descrição..." 
          className="pl-10 h-12 text-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDefs.map((def) => (
          <Card key={def.id} className="group overflow-hidden border-slate-200 transition-all hover:shadow-lg hover:border-blue-200">
            <CardHeader className="bg-slate-50/50 pb-4">
              <div className="flex justify-between items-start">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 mb-2">
                  {def.frequency}
                </Badge>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                    setFormData(def);
                    setEditingId(def.id);
                    setIsAdding(true);
                  }}>
                    <Edit3 className="h-4 w-4 text-slate-600" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteTaskDefinition(def.id)}>
                    <Trash2 className="h-4 w-4 font-bold" />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-xl text-slate-800">{def.name}</CardTitle>
              <CardDescription className="line-clamp-2 min-h-[40px] italic">
                {def.description || 'Sem descrição cadastrada.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{def.periodsPerYear}x / ano</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>{def.steps.length} passos</span>
                </div>
                <div className="flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" />
                  <span>{def.safety.length} EPIs</span>
                </div>
              </div>
              <Button variant="outline" className="w-full gap-2 text-slate-600 bg-slate-50 border-slate-200" onClick={() => startView(def)}>
                Ver Detalhes
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Confirmation Dialog for Execution */}
      <Dialog open={!!confirmingPeriod} onOpenChange={(open) => !open && setConfirmingPeriod(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
               <CheckCircle2 className="h-5 w-5" /> Confirmação Técnica
            </DialogTitle>
            <DialogDescription className="font-bold text-slate-700 pt-2">
               Você realizou este serviço de manutenção preventiva?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-xs text-slate-500 italic">
             Esta ação registrará a conclusão oficial para o ciclo de compliance {currentYear}.
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setConfirmingPeriod(null)} className="h-10 text-[10px] uppercase font-black tracking-widest">Não, cancelar</Button>
            <Button onClick={confirmExecution} className="h-10 bg-blue-600 hover:bg-blue-700 text-white text-[10px] uppercase font-black tracking-widest px-8">Sim, realizei</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail / View Dialog */}
      <Dialog open={isViewing} onOpenChange={(open) => !open && setIsViewing(false)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          {viewingDef && (
            <>
              <DialogHeader className="p-6 pb-4 border-b bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <DialogTitle className="text-2xl font-black uppercase tracking-tight">{viewingDef.name}</DialogTitle>
                      <DialogDescription className="font-medium">{viewingDef.description}</DialogDescription>
                    </div>
                  </div>
                  <Badge className="h-6 uppercase font-black text-[9px] tracking-widest bg-blue-100 text-blue-700">
                    {viewingDef.frequency}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Procedimentos Técnicos</h4>
                    <div className="space-y-3">
                      {viewingDef.steps.map((step, idx) => (
                        <div key={idx} className="flex gap-4 group">
                          <span className="h-5 w-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-black shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            {idx + 1}
                          </span>
                          <p className="text-sm font-medium text-slate-700 leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status de Execução ({currentYear})</h4>
                     <div className="space-y-3">
                        {Array.from({ length: viewingDef.periodsPerYear }).map((_, idx) => {
                          const task = tasks.find(t => t.definitionId === viewingDef.id && t.periodIndex === idx && t.year === currentYear);
                          const isDone = task?.status === 'completed';
                          const progressValue = ((idx + 1) / viewingDef.periodsPerYear) * 100;

                          return (
                            <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
                               <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black uppercase text-slate-500">Execução #{idx + 1}</span>
                                  {isDone && <Badge className="bg-green-500 text-white border-none text-[8px] font-black uppercase">Concluído</Badge>}
                               </div>
                               
                               <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    className={cn(
                                      "flex-1 h-10 font-black uppercase text-[10px] tracking-widest",
                                      isDone ? "bg-green-600 hover:bg-green-700" : "bg-slate-200 text-slate-500 hover:bg-blue-600 hover:text-white"
                                    )}
                                    onClick={() => !isDone && handleToggleExecution(idx)}
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                    Realizei
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="flex-1 h-10 font-black uppercase text-[10px] tracking-widest border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-500"
                                    onClick={() => isDone && handleResetExecution(idx)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                                    Não Realizei
                                  </Button>
                               </div>

                               {isDone && (
                                 <p className="text-[8px] font-bold text-slate-400 uppercase italic">
                                   Registrado em: {format(new Date(task.completedAt!), 'dd/MM/yyyy HH:mm')}
                                 </p>
                               )}

                               <div className="space-y-1">
                                  <div className="flex justify-between items-center text-[8px] font-black uppercase text-slate-400">
                                     <span>Progresso Proporcional</span>
                                     <span>{progressValue.toFixed(2)}%</span>
                                  </div>
                                  <Progress value={isDone ? progressValue : 0} className="h-1 bg-slate-200" />
                               </div>
                            </div>
                          );
                        })}
                     </div>
                  </div>

                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Segurança & EPIs Obrigatórios</h4>
                     <div className="grid grid-cols-1 gap-2">
                        {viewingDef.safety.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 bg-secondary/30 p-3 rounded-lg border border-slate-100">
                            <ShieldCheck className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-bold text-slate-700">{item}</span>
                          </div>
                        ))}
                     </div>
                  </div>
                </div>

                <Separator className="opacity-50" />

                <div className="space-y-4">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Destinatário da Notificação</h4>
                   <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                           <SelectTrigger className="h-12 font-bold uppercase text-[10px] tracking-widest">
                              <SelectValue placeholder="Selecione a equipe técnica" />
                           </SelectTrigger>
                           <SelectContent>
                              {panels.flatMap(p => p.teams).filter(t => t.taskType === viewingDef.id).map(team => (
                                <SelectItem key={team.id} value={team.id} className="text-xs font-bold uppercase">
                                  {team.name} - {team.leader || 'Sem Líder'}
                                </SelectItem>
                              ))}
                              {panels.flatMap(p => p.teams).filter(t => t.taskType !== viewingDef.id).length > 0 && (
                                <>
                                  <Separator className="my-1" />
                                  <Label className="px-2 py-1.5 text-[8px] font-black uppercase text-slate-400">Outras Equipes</Label>
                                  {panels.flatMap(p => p.teams).filter(t => t.taskType !== viewingDef.id).map(team => (
                                    <SelectItem key={team.id} value={team.id} className="text-xs font-medium uppercase opacity-60">
                                      {team.name} ({team.focus})
                                    </SelectItem>
                                  ))}
                                </>
                              )}
                           </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        disabled={!selectedTeamId}
                        onClick={handleWhatsAppSend}
                        className="h-12 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-widest px-8 shadow-lg shadow-emerald-100"
                      >
                        <Send className="h-4 w-4" />
                        Enviar WhatsApp
                      </Button>
                   </div>
                </div>
              </div>

              <DialogFooter className="p-4 border-t bg-slate-50 flex items-center justify-between">
                <Button variant="ghost" onClick={() => setIsViewing(false)} className="uppercase text-[9px] font-black tracking-widest">Fechar</Button>
                <PDFDownloadLink
                  document={
                    <ServiceOrderPDF 
                      unitName={settings.appName}
                      task={viewingDef}
                      teamName={panels.flatMap(p => p.teams).find(t => t.id === selectedTeamId)?.name || "Equipe Não Definida"}
                      members={[]}
                      date={new Date().toISOString()}
                      isGuest={isGuest}
                    />
                  }
                  fileName={`OS_${viewingDef.name}.pdf`}
                >
                  {({ loading }) => (
                    <Button variant="outline" className="h-10 gap-2 border-slate-300 font-black uppercase text-[10px] tracking-widest bg-white" disabled={loading}>
                      <Printer className="h-4 w-4" />
                      {loading ? 'Preparando...' : 'Exportar PDF (A4)'}
                    </Button>
                  )}
                </PDFDownloadLink>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={isAdding} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl">{editingId ? 'Editar Ficha Técnica' : 'Cadastrar Nova Ficha Técnica'}</DialogTitle>
            <DialogDescription>Preencha os dados técnicos seguindo o modelo padrão de segurança e execução.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Título da Manutenção</Label>
                  <Input 
                    id="name" 
                    placeholder="Ex: Ar-condicionado" 
                    value={formData.name || ''} 
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequência</Label>
                    <Input 
                      id="frequency" 
                      placeholder="Ex: Trimestral" 
                      value={formData.frequency || ''} 
                      onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="periods">Vezes por Ano</Label>
                    <Input 
                      id="periods" 
                      type="number"
                      min="1"
                      max="12"
                      value={formData.periodsPerYear || 1} 
                      onChange={(e) => setFormData(prev => ({ ...prev, periodsPerYear: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                   <Label>Cor de Identificação</Label>
                   <div className="flex gap-2 p-1 bg-slate-50 rounded-lg border">
                      {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'].map(c => (
                        <button
                          key={c}
                          type="button"
                          className={cn(
                            "h-6 flex-1 rounded transition-all",
                            formData.color === c ? "ring-2 ring-slate-900 scale-110" : "opacity-70 hover:opacity-100"
                          )}
                          style={{ backgroundColor: c }}
                          onClick={() => setFormData(prev => ({ ...prev, color: c }))}
                        />
                      ))}
                   </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição do Escopo</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Descreva brevemente o que esta manutenção cobre..." 
                    className="h-24"
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Requisitos de Segurança & EPIs</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Ex: Uso de óculos" 
                      value={newSafety}
                      onChange={(e) => setNewSafety(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSafety()}
                    />
                    <Button type="button" size="icon" onClick={addSafety}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <ScrollArea className="h-[120px] rounded-md border p-2">
                    <div className="space-y-2">
                      {formData.safety?.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between group bg-slate-50 p-2 rounded text-sm">
                          <span className="flex items-center gap-2">
                            <ShieldCheck className="h-3 w-3 text-blue-500" /> {item}
                          </span>
                          <button onClick={() => setFormData(prev => ({ ...prev, safety: prev.safety?.filter((_, i) => i !== idx) }))}>
                            <X className="h-3 w-3 text-slate-400 hover:text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-bold">Procedimentos Técnicos (Passo a Passo)</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Descreva o passo da execução..." 
                  value={newStep}
                  onChange={(e) => setNewStep(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addStep()}
                />
                <Button type="button" size="icon" onClick={addStep}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {formData.steps?.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-white border border-slate-100 p-3 rounded-lg shadow-sm">
                    <span className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-sm">{step}</span>
                    <button onClick={() => setFormData(prev => ({ ...prev, steps: prev.steps?.filter((_, i) => i !== idx) }))}>
                      <Trash2 className="h-4 w-4 text-slate-300 hover:text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 border-t bg-slate-50">
            <Button variant="ghost" onClick={resetForm}>Cancelar</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 min-w-[120px]" onClick={handleSave}>
              {editingId ? 'Salvar Alterações' : 'Criar Ficha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
