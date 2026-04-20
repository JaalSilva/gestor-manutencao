import React, { useState } from 'react';
import { 
  AlertCircle, Plus, Search, Trash2, Edit3, 
  MapPin, User, Calendar, Clock, DollarSign,
  Users, Briefcase, Filter, ArrowUpDown
} from 'lucide-react';
import { usePanelStore } from '../store/usePanelStore';
import { MaintenancePending } from '../types';
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
import { Separator } from '@/components/ui/separator';
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';

export const PendingManagement: React.FC = () => {
  const { pendencies, addPendency, updatePendency, deletePendency } = usePanelStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<MaintenancePending>>({
    reporter: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    area: '',
    criticality: 'low',
    cost: 0,
    isVoluntaryCapable: true,
    description: ''
  });

  const [search, setSearch] = useState('');

  const filteredPendencies = (pendencies || []).filter(p => 
    p.area.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase()) ||
    p.reporter.toLowerCase().includes(search.toLowerCase())
  );

  const totalCost = (pendencies || []).reduce((acc, p) => acc + (Number(p.cost) || 0), 0);

  const handleSave = () => {
    if (!formData.reporter || !formData.area || !formData.description) {
      toast.error('Por favor, preencha as informações básicas do registro.');
      return;
    }

    if (editingId) {
      updatePendency(editingId, formData);
      toast.success('Registro de pendência atualizado!');
    } else {
      addPendency({
        ...formData as MaintenancePending,
        id: `pend-${Date.now()}`
      });
      toast.success('Pêndencia registrada com sucesso!');
    }

    resetForm();
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      reporter: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      area: '',
      criticality: 'low',
      cost: 0,
      isVoluntaryCapable: true,
      description: ''
    });
  };

  const startEdit = (p: MaintenancePending) => {
    setFormData(p);
    setEditingId(p.id);
    setIsAdding(true);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in slide-in-from-bottom duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Manutenção Corretiva</h1>
          <p className="text-slate-500 mt-1">Gestão de pendências, orçamentos e intervenções emergenciais.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 text-white rounded-lg px-6 py-2 shadow-lg border border-slate-700">
            <span className="text-xs uppercase font-bold text-slate-400 block tracking-widest">Custo Total Acumulado</span>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-black">{totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
          </div>
          <Button className="gap-2 bg-red-600 hover:bg-red-700 h-12 px-6 shadow-xl" onClick={() => setIsAdding(true)}>
            <Plus className="h-5 w-5" />
            Registrar Problema
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters & Summary Tools */}
        <aside className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Filter className="h-4 w-4" /> Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Pesquisa Livre</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input 
                    placeholder="Busque por local..." 
                    className="pl-8 text-xs"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs">Métricas de Registros</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
                    <span className="text-xl font-bold text-slate-700">{(pendencies || []).length}</span>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                    <span className="text-[10px] uppercase font-bold text-red-400 block">Críticos</span>
                    <span className="text-xl font-bold text-red-700">{(pendencies || []).filter(p => p.criticality === 'high').length}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Pending List */}
        <main className="lg:col-span-3 space-y-4 text-slate-500">
          {(filteredPendencies || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <AlertCircle className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-lg font-medium">Nenhum registro de pendência encontrado.</p>
              <Button variant="link" className="text-blue-600 mt-2" onClick={() => setIsAdding(true)}>
                Clique aqui para registrar o primeiro
              </Button>
            </div>
          ) : (
            (filteredPendencies || []).map((p) => (
              <Card key={p.id} className="relative overflow-hidden group hover:border-slate-300 transition-all">
                {p.criticality === 'high' && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600" />
                )}
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={p.criticality === 'high' ? 'destructive' : 'secondary'} className="uppercase text-[10px]">
                          {p.criticality === 'high' ? 'Crítico' : 'Normal'}
                        </Badge>
                        <Badge variant="outline" className="uppercase text-[10px] gap-1 flex items-center">
                          {p.isVoluntaryCapable ? (
                            <><Users className="h-2.5 w-2.5" /> Voluntários Locais</>
                          ) : (
                            <><Briefcase className="h-2.5 w-2.5" /> Exige Terceirizados</>
                          )}
                        </Badge>
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-500" /> {p.area}
                      </h3>
                      <p className="text-slate-600 line-clamp-2">{p.description}</p>
                    </div>
                    
                    <div className="flex flex-row md:flex-col items-end gap-3 md:gap-1 text-right border-l md:pl-6 border-slate-100 min-w-[200px]">
                      <div className="text-xl font-black text-slate-900">{p.cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                      <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" /> {p.reporter}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {p.date}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="outline" size="sm" className="h-8 gap-2" onClick={() => startEdit(p)}>
                          <Edit3 className="h-3.5 w-3.5" /> Editar
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deletePendency(p.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </main>
      </div>

      {/* New / Edit Dialog */}
      <Dialog open={isAdding} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Registro' : 'Registrar Nova Pendência'}</DialogTitle>
            <DialogDescription>
              Relate problemas encontrados nas instalações para controle de custos e planejamento.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reporter">Quem identificou o problema?</Label>
                <Input 
                  id="reporter" 
                  placeholder="Nome do colaborador" 
                  value={formData.reporter || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, reporter: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data da ocorrência</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    value={formData.date || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Hora aproximada</Label>
                  <Input 
                    id="time" 
                    type="time" 
                    value={formData.time || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">Área / Localização</Label>
                <Input 
                  id="area" 
                  placeholder="Ex: Galpão Norte, Copa, etc." 
                  value={formData.area || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nível de Criticidade</Label>
                <Select 
                  value={formData.criticality || 'low'} 
                  onValueChange={(val: any) => setFormData(prev => ({ ...prev, criticality: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a urgência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Não Crítico (Rotina)</SelectItem>
                    <SelectItem value="high">Crítico (Urgente / Risco)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Estimativa de Custos (R$)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    id="cost" 
                    type="number" 
                    className="pl-9"
                    placeholder="0.00"
                    value={formData.cost ?? 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mão de Obra Necessária</Label>
                <Select 
                  value={formData.isVoluntaryCapable !== false ? 'yes' : 'no'} 
                  onValueChange={(val) => setFormData(prev => ({ ...prev, isVoluntaryCapable: val === 'yes' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Voluntários Locais (Equipe)</SelectItem>
                    <SelectItem value="no">Exige Especialista Terceirizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="desc">Descrição Detalhada do Problema</Label>
              <Textarea 
                id="desc" 
                className="h-32"
                placeholder="Descreva o problema encontrado, impactos e o que precisa ser feito..." 
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={resetForm}>Cancelar</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 min-w-[150px]" onClick={handleSave}>
              {editingId ? 'Salvar Alterações' : 'Registrar Ocorrência'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
