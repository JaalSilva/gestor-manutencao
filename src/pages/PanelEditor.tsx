import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  ArrowLeft, FileDown, Plus, 
  Trash2, GripVertical, PlusCircle, UserPlus,
  Palette, ClipboardCheck, RefreshCcw, ExternalLink
} from 'lucide-react';
import { usePanelStore } from '../store/usePanelStore';
import { useAuth } from '../contexts/AuthContext';
import { Team, Group, Member, TaskDefinition, AppSettings } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { A3Report } from '../components/reports/A3Report';
import { ServiceOrderPDF } from '../services/pdf/ServiceOrderPDF';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const PanelEditor: React.FC<{ panelId: string; onBack: () => void }> = ({ panelId, onBack }) => {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetDefId, setResetDefId] = useState<string>('');
  const { panels, updatePanel, settings, taskDefinitions, clearMaintenanceHistory } = usePanelStore();
  const { isGuest } = useAuth();
  const panel = panels.find(p => p.id === panelId);

  const handleResetHistory = () => {
    if (!resetDefId) {
      toast.error('Selecione uma ficha técnica para resetar.');
      return;
    }
    clearMaintenanceHistory(resetDefId);
    toast.success('Histórico de execução resetado com sucesso.');
    setIsResetModalOpen(false);
    setResetDefId('');
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!panel) return <div>Painel não encontrado.</div>;

  const handleUpdatePanel = (updates: Partial<typeof panel>) => {
    updatePanel(panelId, updates);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const teams = panel.teams || [];
      const oldIndex = teams.findIndex((t) => t.id === active.id);
      const newIndex = teams.findIndex((t) => t.id === over.id);
      
      const newTeams = arrayMove(teams, oldIndex, newIndex);
      handleUpdatePanel({ teams: newTeams });
    }
  };

  const addTeam = () => {
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: 'Nova Equipe',
      color: '#3b82f6',
      focus: 'Foco técnico',
      leader: '',
      manager: '',
      groups: [],
      customFields: [],
      taskType: (taskDefinitions || [])[0]?.id
    };
    handleUpdatePanel({ teams: [...(panel.teams || []), newTeam] });
  };

  const removeTeam = (teamId: string) => {
    handleUpdatePanel({ teams: (panel.teams || []).filter(t => t.id !== teamId) });
  };

  const updateTeam = (teamId: string, updates: Partial<Team>) => {
    handleUpdatePanel({
      teams: (panel.teams || []).map(t => t.id === teamId ? { ...t, ...updates } : t)
    });
  };

  const addGroup = (teamId: string) => {
    const newGroup: Group = {
      id: `g-${Date.now()}`,
      members: [
        { id: `m1-${Date.now()}`, name: '' },
        { id: `m2-${Date.now()}`, name: '' }
      ]
    };
    const team = (panel.teams || []).find(t => t.id === teamId);
    if (team) {
      updateTeam(teamId, { groups: [...(team.groups || []), newGroup] });
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden animate-in slide-in-from-right duration-300">
      <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="uppercase font-black text-red-600">Apagar Serviços</DialogTitle>
            <DialogDescription className="font-bold text-slate-600">
              Isso removerá TODO o histórico de execução (verde) da ficha técnica selecionada para o ano atual. Esta ação é irreversível.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Selecione a Ficha Técnica</Label>
                <select 
                  className="w-full bg-slate-50 border rounded-lg h-11 px-3 font-bold text-sm outline-none"
                  value={resetDefId}
                  onChange={(e) => setResetDefId(e.target.value)}
                >
                  <option value="">Nenhuma selecionada...</option>
                  {taskDefinitions.map(def => (
                    <option key={def.id} value={def.id}>{def.name}</option>
                  ))}
                </select>
             </div>
          </div>
          <DialogFooter>
             <Button variant="ghost" onClick={() => setIsResetModalOpen(false)}>Cancelar</Button>
             <Button variant="destructive" className="font-black uppercase text-xs" onClick={handleResetHistory} disabled={!resetDefId}>
                Confirmar Reset de Histórico
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <header className="flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <input 
              value={panel.name}
              onChange={(e) => handleUpdatePanel({ name: e.target.value })}
              className="bg-transparent text-lg font-bold outline-none hover:bg-slate-50 focus:bg-slate-50 rounded px-1 transition-colors"
            />
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Unidade: {settings.appName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <PDFDownloadLink
            document={<A3Report panel={panel} settings={settings} isGuest={isGuest} />}
            fileName={`${panel.name}_A3.pdf`}
          >
            {({ loading }) => (
              <Button disabled={loading} className="gap-2 bg-slate-900 hover:bg-slate-800">
                <FileDown className="h-4 w-4" />
                {loading ? 'Processando A3...' : 'Gerar Painel (A3)'}
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r bg-white p-6 overflow-y-auto max-h-[300px] lg:max-h-none">
          <div className="space-y-6">
            <div>
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block">Governança do Painel</Label>
              <div className="space-y-2 mt-3">
                 <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Última Atualização</p>
                    <p className="text-[10px] font-bold text-slate-700">{format(new Date(panel.updatedAt), "dd/MM/yyyy HH:mm")}</p>
                 </div>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block">Documentos Técnicos</Label>
              <div className="space-y-1.5 mt-3">
                 {[
                   { label: 'Manual de Ar Condicionado', type: 'PDF' },
                   { label: 'Checklist de Bebedouro', type: 'XLSX' },
                   { label: 'Normas de Segurança NR-10', type: 'DOCX' }
                 ].map((doc, i) => (
                   <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 group cursor-pointer border border-transparent hover:border-slate-100 transition-all">
                      <div className="flex items-center gap-2">
                         <div className="h-7 w-7 rounded bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            {doc.type}
                         </div>
                         <span className="text-[10px] font-bold text-slate-600 truncate">{doc.label}</span>
                      </div>
                      <ExternalLink className="h-3 w-3 text-slate-300 group-hover:text-blue-500" />
                   </div>
                 ))}
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block">Ordem das Equipes</Label>
              <div className="mt-4 space-y-2">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={(panel.teams || []).map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {(panel.teams || []).map(team => (
                      <SortableSidebarItem key={team.id} team={team} onRemove={() => removeTeam(team.id)} />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-red-500">Limpeza de Dados</Label>
              <Button onClick={() => setIsResetModalOpen(true)} className="mt-3 w-full gap-2 border-red-200 text-red-600 hover:bg-red-50" variant="outline">
                <RefreshCcw className="h-4 w-4" />
                Apagar Serviços
              </Button>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-auto p-8 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px]">
          <div className="mx-auto max-w-[1400px]">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={(panel.teams || []).map(t => t.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                  {(panel.teams || []).map((team) => (
                    <SortableTeamCard 
                      key={team.id} 
                      team={team} 
                      onUpdateTeam={updateTeam}
                      onAddGroup={addGroup}
                      taskDefinitions={taskDefinitions}
                      settings={settings}
                      isGuest={isGuest}
                    />
                  ))}
                  
                  {(panel.teams || []).length < 12 && (
                    <button 
                      onClick={addTeam}
                      className="group flex h-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white/50 p-8 min-h-[300px] hover:border-primary hover:bg-slate-50 transition-all"
                    >
                       <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all">
                          <Plus className="h-7 w-7" />
                       </div>
                       <div className="mt-4 text-center">
                          <p className="font-black uppercase tracking-tight text-slate-900">Nova Equipe de Campo</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Click para designar nova unidade</p>
                       </div>
                    </button>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </main>
      </div>
    </div>
  );
};

interface SortableSidebarItemProps {
  team: Team;
  onRemove: () => void;
}

const SortableSidebarItem: React.FC<SortableSidebarItemProps> = ({ team, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: team.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="group relative flex items-center justify-between rounded-lg border bg-slate-50 p-2 hover:border-primary transition-colors"
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div {...attributes} {...listeners} className="cursor-grab text-slate-400 hover:text-primary">
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: team.color }} />
        <span className="truncate text-sm font-medium">{team.name}</span>
      </div>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRemove}>
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      </Button>
    </div>
  );
};

interface SortableTeamCardProps {
  team: Team;
  onUpdateTeam: (id: string, updates: Partial<Team>) => void;
  onAddGroup: (id: string) => void;
  taskDefinitions: TaskDefinition[];
  settings: AppSettings;
  isGuest?: boolean;
}

const SortableTeamCard: React.FC<SortableTeamCardProps> = ({ team, onUpdateTeam, onAddGroup, taskDefinitions, settings, isGuest }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: team.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const selectedTask = taskDefinitions.find(t => t.id === team.taskType);

  return (
    <motion.div
      ref={setNodeRef}
      layout
      className="flex h-full flex-col rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md"
      style={{ ...style, borderTop: `6px solid ${team.color}` }}
    >
      <div className="flex items-center justify-between p-4 pb-2">
        <div {...attributes} {...listeners} className="cursor-grab text-slate-300 hover:text-slate-500">
          <GripVertical className="h-4 w-4" />
        </div>
        <input 
          className="flex-1 truncate bg-transparent text-lg font-bold outline-none pl-2"
          value={team.name}
          onChange={(e) => onUpdateTeam(team.id, { name: e.target.value })}
          placeholder="Nome da Equipe"
        />
        <PaletteDialog team={team} onUpdate={(color) => onUpdateTeam(team.id, { color })} />
      </div>
      
      <div className="px-4 pb-4 space-y-4">
        <div className="space-y-1">
          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ficha Técnica</Label>
          <select 
            className="w-full bg-slate-50 border rounded p-1.5 text-xs font-semibold outline-none focus:ring-1 ring-slate-900"
            value={team.taskType}
            onChange={(e) => onUpdateTeam(team.id, { taskType: e.target.value })}
          >
            {(taskDefinitions || []).map(def => (
              <option key={def.id} value={def.id}>{def.name} ({def.frequency})</option>
            ))}
          </select>
        </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 border-indigo-100 bg-indigo-50/50">H. CHAVE</Badge>
              <input 
                className="flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none"
                value={team.manager}
                onChange={(e) => onUpdateTeam(team.id, { manager: e.target.value })}
                placeholder="Designar Homem Chave"
              />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest text-blue-600 border-blue-200 bg-blue-50/50">LÍDER</Badge>
                <input 
                  className="flex-1 bg-transparent text-sm font-medium outline-none"
                  value={team.leader}
                  onChange={(e) => onUpdateTeam(team.id, { leader: e.target.value })}
                  placeholder="Nome do Líder"
                />
              </div>
              <div className="flex items-center gap-2 pl-[54px]">
                 <span className="text-[10px] font-bold text-slate-400">Tel:</span>
                 <input 
                    className="flex-1 bg-transparent text-[11px] font-medium outline-none text-slate-500"
                    value={(team.customFields || []).find(f => f.id === 'leader-phone')?.value || ''}
                    onChange={(e) => {
                      const existing = (team.customFields || []).filter(f => f.id !== 'leader-phone');
                      onUpdateTeam(team.id, { 
                        customFields: [...existing, { id: 'leader-phone', label: 'Telefone Líder', value: e.target.value }]
                      });
                    }}
                    placeholder="Ex: 5571999999999"
                 />
              </div>
            </div>
          </div>
      </div>

      <Separator className="opacity-50" />

      <div className="flex-1 space-y-2 p-4">
        {team.groups?.map((group, gIdx) => (
          <div key={group.id} className="group flex items-center gap-2 rounded-lg bg-slate-50/50 p-2 border border-dashed border-slate-200 text-sm">
            <span className="shrink-0 text-[10px] font-black text-slate-400">{String(gIdx + 1).padStart(2, '0')}</span>
            <div className="flex flex-1 items-center gap-1 overflow-hidden">
              <input 
                className="w-full bg-transparent outline-none focus:text-blue-600 font-medium"
                value={group.members[0].name}
                onChange={(e) => {
                  const newMembers: [Member, Member] = [{ ...group.members[0], name: e.target.value }, group.members[1]];
                  onUpdateTeam(team.id, { 
                    groups: (team.groups || []).map(g => g.id === group.id ? { ...g, members: newMembers } : g)
                  });
                }}
                placeholder="P1"
              />
              <span className="text-slate-300 font-light">&</span>
              <input 
                className="w-full bg-transparent outline-none focus:text-blue-600 font-medium"
                value={group.members[1].name}
                onChange={(e) => {
                  const newMembers: [Member, Member] = [group.members[0], { ...group.members[1], name: e.target.value }];
                  onUpdateTeam(team.id, { 
                    groups: (team.groups || []).map(g => g.id === group.id ? { ...g, members: newMembers } : g)
                  });
                }}
                placeholder="P2"
              />
            </div>
            <button 
              className="shrink-0 text-slate-300 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => {
                onUpdateTeam(team.id, { groups: (team.groups || []).filter(g => g.id !== group.id) });
              }}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full gap-1 text-[10px] uppercase font-bold text-muted-foreground h-8 border-dashed border"
          onClick={() => onAddGroup(team.id)}
        >
          <UserPlus className="h-3 w-3" />
          Adicionar Dupla
        </Button>
      </div>

      <div className="bg-slate-50/80 p-4 rounded-b-xl border-t flex items-center justify-between">
         <div className="flex items-center gap-1">
            <ClipboardCheck className="h-4 w-4 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Ordem Técnica (A4)</span>
         </div>
         {selectedTask && (
           <PDFDownloadLink
              document={
                <ServiceOrderPDF 
                  unitName={settings.appName}
                  task={selectedTask}
                  teamName={team.name}
                  members={(team.groups || []).flatMap(g => (g.members || []).map(m => m.name)).filter(Boolean)}
                  date={new Date().toISOString()}
                  isGuest={isGuest}
                />
              }
              fileName={`OS_${team.name}.pdf`}
           >
              {({ loading }) => (
                <Button size="sm" variant="outline" className="h-7 text-[10px] bg-white border-slate-300" disabled={loading}>
                  {loading ? '...' : 'GERAR'}
                </Button>
              )}
           </PDFDownloadLink>
         )}
      </div>
    </motion.div>
  );
};

const PaletteDialog: React.FC<{ team: Team; onUpdate: (color: string) => void }> = ({ team, onUpdate }) => {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0f172a', '#64748b', '#ec4899', '#06b6d4', '#475569'];
  return (
    <Dialog>
      <DialogTrigger render={
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Palette className="h-4 w-4" style={{ color: team.color }} />
        </Button>
      } />
      <DialogContent className="sm:max-w-xs">
        <DialogHeader><DialogTitle className="uppercase font-black text-xs tracking-widest">Cor da Equipe</DialogTitle></DialogHeader>
        <div className="grid grid-cols-5 gap-3 py-4">
          {colors.map(color => (
            <button
              key={color}
              className={cn("h-10 w-10 rounded-full border-2 transition-all", team.color === color ? "border-slate-900 scale-105" : "border-transparent")}
              style={{ backgroundColor: color }}
              onClick={() => onUpdate(color)}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
