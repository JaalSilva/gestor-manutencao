import React, { useState } from 'react';
import { 
  Users, UserPlus, Edit3, Trash2, 
  ShieldCheck, Briefcase, BadgeCheck
} from 'lucide-react';
import { usePanelStore } from '../store/usePanelStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

import { PDFDownloadLink } from '@react-pdf/renderer';
import { AnnualReport } from '../services/pdf/AnnualReport';

export const Commission: React.FC = () => {
  const { settings, upsertCommissionMember, deleteCommissionMember, tasks, taskDefinitions } = usePanelStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editingMember, setEditingMember] = useState<{ id?: string, name: string, role: string, congregation: string, circuit: string }>({
    name: '',
    role: '',
    congregation: '',
    circuit: 'BA-71'
  });

  const handleSave = () => {
    if (!editingMember.name || !editingMember.role || !editingMember.congregation) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    upsertCommissionMember({
      id: editingMember.id || `member-${Date.now()}`,
      name: editingMember.name,
      role: editingMember.role,
      congregation: editingMember.congregation,
      circuit: 'BA-71'
    });

    setIsEditing(false);
    setEditingMember({ name: '', role: '', congregation: '', circuit: 'BA-71' });
    toast.success(editingMember.id ? "Membro atualizado!" : "Membro adicionado!");
  };

  const startEdit = (member?: any) => {
    if (member) {
      setEditingMember({
        ...member,
        circuit: 'BA-71'
      });
    } else {
      if ((settings.commissionMembers || []).length >= 5) {
        toast.error("Limite de 5 membros atingido para governança.");
        return;
      }
      setEditingMember({ name: '', role: '', congregation: '', circuit: 'BA-71' });
    }
    setIsEditing(true);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Comissão de Funcionamento</h1>
          <p className="text-slate-500 text-sm font-medium italic">Gestão de membros e governança técnica da unidade.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <PDFDownloadLink
            document={<AnnualReport 
              year={new Date().getFullYear()} 
              transactions={usePanelStore.getState().transactions} 
              tasks={tasks} 
              taskDefinitions={taskDefinitions}
              commissionMembers={settings.commissionMembers}
              appName={settings.appName}
            />}
            fileName={`Relatorio_Anual_${new Date().getFullYear()}.pdf`}
          >
            {({ loading }) => (
              <Button variant="outline" size="lg" className="h-11 px-6 border-slate-200 gap-2 font-bold uppercase text-[10px] tracking-widest shadow-sm" disabled={loading}>
                <BadgeCheck className="h-4 w-4 text-blue-600" />
                {loading ? 'Preparando...' : 'Exportar Relatório BI'}
              </Button>
            )}
          </PDFDownloadLink>

          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger
              render={
                <Button className="bg-slate-900 hover:bg-slate-800 gap-2 h-11 px-6 shadow-xl font-bold" onClick={() => startEdit()}>
                  <UserPlus className="h-4 w-4" />
                  Novo Membro
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="uppercase font-black">{editingMember.id ? 'Editar Membro' : 'Adicionar Membro'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome Completo</Label>
                  <Input 
                    id="name" 
                    value={editingMember.name} 
                    onChange={(e) => setEditingMember(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: João da Silva"
                    className="font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Função / Cargo</Label>
                  <Input 
                    id="role" 
                    value={editingMember.role} 
                    onChange={(e) => setEditingMember(prev => ({ ...prev, role: e.target.value }))}
                    placeholder="Ex: Coordenador, Tesoureiro..."
                    className="font-bold border-blue-100 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="congregation" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Congregação</Label>
                  <Input 
                    id="congregation" 
                    value={editingMember.congregation} 
                    onChange={(e) => setEditingMember(prev => ({ ...prev, congregation: e.target.value }))}
                    placeholder="Ex: Cajazeiras 8"
                    className="font-bold border-blue-100 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="circuit" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Circuito (Fixo)</Label>
                  <Input 
                    id="circuit" 
                    value="BA-71" 
                    disabled
                    className="font-bold bg-slate-50 cursor-not-allowed"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
                <Button className="font-black uppercase text-xs tracking-widest" onClick={handleSave}>
                  Salvar Membro
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {(settings.commissionMembers || []).map((member) => (
            <motion.div
              key={member.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className="group border-none shadow-sm hover:shadow-md transition-all overflow-hidden bg-white/50 backdrop-blur-sm border-l-4 border-l-blue-600">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform">
                        <BadgeCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 uppercase tracking-tight">{member.name}</h3>
                        <div className="flex flex-col gap-0.5 mt-2">
                          <div className="flex items-center gap-1.5">
                            <Briefcase className="h-3 w-3 text-blue-500" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{member.role}</span>
                          </div>
                          {member.congregation && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">Cong.: {member.congregation}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-blue-500 uppercase tracking-tight">Circuito: {member.circuit}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center gap-2 pt-4 border-t border-slate-50">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 h-8 text-[10px] font-black uppercase tracking-tighter"
                      onClick={() => startEdit(member)}
                    >
                      <Edit3 className="h-3 w-3 mr-1.5" />
                      Editar
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 p-0"
                      onClick={() => {
                        deleteCommissionMember(member.id);
                        toast.info("Membro removido.");
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {(settings.commissionMembers || []).length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4 bg-white/30 rounded-3xl border-2 border-dashed border-slate-200">
            <Users className="h-12 w-12 text-slate-300" />
            <div>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Nenhum membro cadastrado</p>
              <p className="text-slate-400 text-[10px] mt-1 italic">Registre a comissão para habilitar as assinaturas nos relatórios.</p>
            </div>
            <Button variant="outline" className="mt-4" onClick={() => startEdit()}>
              Adicionar Primeiro Membro
            </Button>
          </div>
        )}
      </div>

      {/* Footer Disclaimer */}
      <footer className="mt-auto pt-20 border-t border-slate-100 flex flex-col items-center gap-2 text-center pb-8 opacity-50">
         <ShieldCheck className="h-6 w-6 text-slate-400" />
         <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">JW Hub Maintenance Enterprise v4.0</p>
            <p className="text-[10px] font-bold text-slate-400">Desenvolvido por Jaaziel Silva. Desenvolvedor Sênior.</p>
         </div>
      </footer>
    </div>
  );
};
