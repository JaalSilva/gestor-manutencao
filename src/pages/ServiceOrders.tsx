import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, FileText, Download, Trash2, 
  ChevronRight, Calendar, User, MapPin, 
  CheckCircle2, Clock, AlertTriangle, Eye,
  X, Filter, Package, Wrench, MoreHorizontal,
  PlusCircle, MinusCircle, Printer, Save
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { usePanelStore } from '../store/usePanelStore';
import { ServiceOrder, ServiceOrderItem } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogFooter, DialogDescription 
} from '@/components/ui/dialog';
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DetailedServiceOrderPDF } from '../components/reports/DetailedServiceOrderPDF';
import { toast } from 'sonner';

export const ServiceOrders: React.FC = () => {
  const { serviceOrders, addServiceOrder, updateServiceOrder, deleteServiceOrder, settings, updateSettings } = usePanelStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOs, setEditingOs] = useState<ServiceOrder | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<ServiceOrder>>({
    osNumber: `OS-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
    unit: 'UNIDADE LOCAL',
    requester: '',
    responsible: '',
    executingSector: '',
    maintenanceType: 'PREVENTIVA',
    priority: 'Alta',
    location: '',
    buildingName: '',
    address: '',
    items: []
  });

  const filteredOrders = useMemo(() => {
    return serviceOrders.filter(os => 
      os.osNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.requester.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.responsible.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [serviceOrders, searchTerm]);

  const handleOpenModal = (os?: ServiceOrder) => {
    if (os) {
      setEditingOs(os);
      setFormData(os);
    } else {
      const nextNum = settings.nextOsNumber || 1000;
      setEditingOs(null);
      setFormData({
        id: `os-${Date.now()}`,
        osNumber: `OS-${nextNum}`,
        date: new Date().toISOString().split('T')[0],
        unit: 'UNIDADE LOCAL',
        requester: '',
        responsible: '',
        executingSector: '',
        maintenanceType: 'PREVENTIVA',
        priority: 'Alta',
        location: '',
        buildingName: '',
        address: '',
        items: []
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.requester || !formData.responsible) {
      toast.error("Preencha ao menos Solicitante e Responsável");
      return;
    }

    try {
      if (editingOs) {
        await updateServiceOrder(editingOs.id, formData);
        toast.success("Ordem de Serviço atualizada!");
      } else {
        await addServiceOrder(formData as ServiceOrder);
        // Increment OS number in settings
        const currentNext = settings.nextOsNumber || 1000;
        await updateSettings({ nextOsNumber: currentNext + 1 });
        toast.success("Ordem de Serviço criada!");
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error("Erro ao salvar ordem de serviço");
    }
  };

  const addItem = () => {
    const newItem: ServiceOrderItem = {
      id: `item-${Date.now()}`,
      description: '',
      service: '',
      material: '',
      prevValue: '0,00',
      realValue: '0,00',
      status: 'P'
    };
    setFormData(prev => ({ ...prev, items: [...(prev.items || []), newItem] }));
  };

  const removeItem = (id: string) => {
    setFormData(prev => ({ ...prev, items: prev.items?.filter(i => i.id !== id) }));
  };

  const updateItem = (id: string, updates: Partial<ServiceOrderItem>) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.map(i => i.id === id ? { ...i, ...updates } : i)
    }));
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Ordens de Serviço</h1>
          <p className="text-slate-500 font-medium font-mono text-[10px] uppercase tracking-wider mt-1">EMISSÃO E CONTROLE DE MANUTENÇÃO TÉCNICA</p>
        </div>
        <Button 
          onClick={() => handleOpenModal()}
          className="bg-orange-600 hover:bg-orange-700 text-white shadow-xl shadow-orange-500/20 gap-2 font-bold uppercase text-xs"
        >
          <PlusCircle className="h-4 w-4" />
          Nova O.S.
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Buscar por número, solicitante ou responsável..." 
            className="pl-10 h-12 bg-white border-slate-200 focus:ring-orange-500 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="h-12 border rounded-lg bg-white flex items-center px-4 justify-between text-slate-500">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-tight">Filtros Avançados</span>
          </div>
          <Badge variant="outline" className="bg-slate-50 font-mono text-[10px]">{filteredOrders.length}</Badge>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
            <FileText className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="text-slate-900 font-bold uppercase text-sm tracking-tight">Nenhuma O.S. encontrada</h3>
          <p className="text-slate-500 text-xs mt-1">Crie sua primeira ordem de serviço utilizando o botão acima.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredOrders.map((os) => (
              <motion.div 
                key={os.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 overflow-hidden"
              >
                {/* Status Indicator */}
                <div className="absolute top-0 right-0 h-24 w-24 -mr-8 -mt-8 bg-orange-600/5 rounded-full blur-2xl group-hover:bg-orange-600/20 transition-all" />
                
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center border border-orange-100 shrink-0">
                      <FileText className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-slate-900 uppercase tracking-tighter text-lg">{os.osNumber}</h3>
                        <Badge className="bg-orange-600/10 text-orange-700 border-orange-200 font-mono text-[10px] uppercase">{os.priority}</Badge>
                      </div>
                      <p className="text-slate-400 font-mono text-[10px] uppercase tracking-wider">{os.maintenanceType} • {format(new Date(os.date), "dd MMM yyyy", { locale: ptBR })}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                      onClick={() => handleOpenModal(os)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <PDFDownloadLink
                      document={<DetailedServiceOrderPDF os={os} logo={settings.appLogo} osTitle={settings.osTitle} osSubTitle={settings.osSubTitle} />}
                      fileName={`${os.osNumber}.pdf`}
                    >
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </PDFDownloadLink>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full text-red-400 hover:text-red-700 hover:bg-red-50"
                      onClick={() => deleteServiceOrder(os.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">Solicitante</p>
                    <p className="text-xs font-bold text-slate-700 truncate">{os.requester}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">Responsável</p>
                    <p className="text-xs font-bold text-slate-700 truncate">{os.responsible}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-bold text-slate-500 uppercase text-[10px]">{os.items.length} Itens de Plano</span>
                  </div>
                  <div className="flex -space-x-2">
                    {os.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="h-6 w-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-bold">
                        {item.status}
                      </div>
                    ))}
                    {os.items.length > 3 && (
                      <div className="h-6 w-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-400">
                        +{os.items.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* OS MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-5xl p-0 h-[92vh] flex flex-col gap-0 rounded-[32px] overflow-hidden shadow-2xl border-none">
          <div className="bg-slate-900 px-8 py-5 text-white shrink-0 z-10">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-black tracking-tight uppercase leading-none">
                    {editingOs ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
                  </DialogTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-slate-400 font-mono text-[9px] uppercase tracking-widest">{formData.osNumber}</p>
                    <span className="h-1 w-1 rounded-full bg-slate-600" />
                    <p className="text-slate-400 font-mono text-[9px] uppercase tracking-widest">{formData.priority} PRIORIDADE</p>
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full h-10 w-10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 bg-slate-100/50">
            {/* The "Paper" container */}
            <div className="min-h-full py-8 px-4 md:px-0 flex justify-center">
              <div className="w-full max-w-[210mm] bg-white shadow-[0_0_50px_rgba(0,0,0,0.08)] border border-slate-200 rounded-sm min-h-[297mm] p-6 md:p-12 space-y-10 animate-in fade-in zoom-in-95 duration-500">
                
                {/* Simulated Doc Header */}
                <div className="flex justify-between border-b-2 border-slate-900 pb-6">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-slate-900 leading-none">ORDEM DE SERVIÇO</h2>
                    <p className="text-slate-400 font-mono text-[10px] uppercase tracking-widest">Documento Técnico de Manutenção</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-slate-900 text-white rounded-none px-4 py-1 text-lg font-black">{formData.osNumber}</Badge>
                    <p className="text-slate-400 font-mono text-[9px] mt-1">EMITIDO EM: {formData.date}</p>
                  </div>
                </div>

                {/* Informações Gerais */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black bg-slate-900 text-white px-2 py-0.5">01</span>
                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Informações Gerais</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Filial / Unidade</Label>
                      <Input 
                        value={formData.unit} 
                        onChange={e => setFormData(p => ({ ...p, unit: e.target.value }))}
                        className="h-10 rounded-none border-b border-t-0 border-x-0 border-slate-200 focus-visible:ring-0 focus-visible:border-orange-500 bg-transparent px-0 font-bold text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Solicitante</Label>
                      <Input 
                        placeholder="Nome do Solicitante"
                        value={formData.requester} 
                        onChange={e => setFormData(p => ({ ...p, requester: e.target.value }))}
                        className="h-10 rounded-none border-b border-t-0 border-x-0 border-slate-200 focus-visible:ring-0 focus-visible:border-orange-500 bg-transparent px-0 font-bold text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Responsável Técnico</Label>
                      <Input 
                        placeholder="Nome do Responsável"
                        value={formData.responsible} 
                        onChange={e => setFormData(p => ({ ...p, responsible: e.target.value }))}
                        className="h-10 rounded-none border-b border-t-0 border-x-0 border-slate-200 focus-visible:ring-0 focus-visible:border-orange-500 bg-transparent px-0 font-bold text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Setor Executante</Label>
                      <Input 
                        placeholder="Ex: Elétrica / Hidráulica"
                        value={formData.executingSector} 
                        onChange={e => setFormData(p => ({ ...p, executingSector: e.target.value }))}
                        className="h-10 rounded-none border-b border-t-0 border-x-0 border-slate-200 focus-visible:ring-0 focus-visible:border-orange-500 bg-transparent px-0 font-bold text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Tipo Manutenção</Label>
                      <Select 
                        value={formData.maintenanceType}
                        onValueChange={v => setFormData(p => ({ ...p, maintenanceType: v }))}
                      >
                        <SelectTrigger className="h-10 rounded-none border-b border-t-0 border-x-0 border-slate-200 bg-transparent px-0 font-bold text-sm focus:ring-0 text-left">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PREVENTIVA">Manutenção Preventiva</SelectItem>
                          <SelectItem value="CORRETIVA">Manutenção Corretiva</SelectItem>
                          <SelectItem value="PREDITIVA">Manutenção Preditiva</SelectItem>
                          <SelectItem value="EMERGÊNCIAL">Emergencial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Prioridade</Label>
                      <Select 
                        value={formData.priority}
                        onValueChange={(v: any) => setFormData(p => ({ ...p, priority: v }))}
                      >
                        <SelectTrigger className="h-10 rounded-none border-b border-t-0 border-x-0 border-slate-200 bg-transparent px-0 font-bold text-sm focus:ring-0 text-left">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Baixa">Baixa</SelectItem>
                          <SelectItem value="Média">Média</SelectItem>
                          <SelectItem value="Alta">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Data do Serviço</Label>
                      <Input 
                        type="date"
                        value={formData.date} 
                        onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                        className="h-10 rounded-none border-b border-t-0 border-x-0 border-slate-200 focus-visible:ring-0 focus-visible:border-orange-500 bg-transparent px-0 font-bold text-sm"
                      />
                    </div>
                  </div>
                </section>

                {/* Localização e Ambiente */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black bg-slate-900 text-white px-2 py-0.5">02</span>
                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Identificação do Local</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Nome da Edificação/Sala</Label>
                      <Input 
                        placeholder="Ex: Auditório Sul"
                        value={formData.location} 
                        onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
                        className="h-10 rounded-none border-b border-t-0 border-x-0 border-slate-200 focus-visible:ring-0 focus-visible:border-orange-500 bg-transparent px-0 font-bold text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Endereço / Referência</Label>
                      <Input 
                        placeholder="Ex: Bloco B, 2º Andar"
                        value={formData.address} 
                        onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                        className="h-10 rounded-none border-b border-t-0 border-x-0 border-slate-200 focus-visible:ring-0 focus-visible:border-orange-500 bg-transparent px-0 font-bold text-sm"
                      />
                    </div>
                  </div>
                </section>

                {/* Plano de Trabalho */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black bg-slate-900 text-white px-2 py-0.5">03</span>
                      <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Plano de Trabalho / Itens</h3>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={addItem}
                      className="h-7 rounded-none border-slate-200 font-black uppercase text-[8px] tracking-widest hover:bg-slate-50 gap-2"
                    >
                      <Plus className="h-3 w-3" />
                      Novo Item
                    </Button>
                  </div>

                  <div className="border border-slate-950/10">
                    <div className="grid grid-cols-[80px_1fr_1fr_100px_40px] px-4 py-2 bg-slate-50 border-b border-slate-950/10 text-[8px] font-black uppercase tracking-tighter text-slate-400">
                      <div>Status</div>
                      <div>Descrição</div>
                      <div>Serviço</div>
                      <div>Prev.</div>
                      <div />
                    </div>
                    <div className="divide-y divide-slate-100">
                      {formData.items?.length === 0 ? (
                        <div className="py-10 text-center text-[10px] text-slate-300 font-bold italic uppercase tracking-wider bg-slate-50/30">Nenhum item adicionado ao plano</div>
                      ) : (
                        formData.items?.map((item) => (
                          <div key={item.id} className="grid grid-cols-[80px_1fr_1fr_100px_40px] gap-2 px-4 py-2 items-center bg-white group hover:bg-slate-50/50 transition-colors">
                            <Select 
                              value={item.status} 
                              onValueChange={(v: any) => updateItem(item.id, { status: v })}
                            >
                              <SelectTrigger className="h-7 border-none bg-transparent p-0 font-black text-[9px] focus:ring-0">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="E">EXECUTADO</SelectItem>
                                <SelectItem value="P">PENDENTE</SelectItem>
                                <SelectItem value="N">NÃO EXEC.</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input 
                              value={item.description}
                              onChange={e => updateItem(item.id, { description: e.target.value })}
                              className="h-7 border-none bg-transparent px-0 text-xs font-bold focus-visible:ring-0"
                              placeholder="..."
                            />
                            <Input 
                              value={item.service}
                              onChange={e => updateItem(item.id, { service: e.target.value })}
                              className="h-7 border-none bg-transparent px-0 text-xs font-medium focus-visible:ring-0"
                              placeholder="..."
                            />
                            <Input 
                              value={item.prevValue}
                              onChange={e => updateItem(item.id, { prevValue: e.target.value })}
                              className="h-7 border-none bg-transparent px-0 font-mono text-[9px] focus-visible:ring-0"
                              placeholder="0,00"
                            />
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeItem(item.id)}
                              className="h-6 w-6 text-slate-200 hover:text-red-500 rounded-none opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MinusCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </section>

                {/* Escopo de Trabalho */}
                <section className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black bg-slate-900 text-white px-2 py-0.5">04</span>
                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Descrição do Escopo / Observações</h3>
                  </div>
                  <textarea 
                    className="w-full min-h-[150px] p-6 text-sm font-medium border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-0 focus:border-orange-500 focus:outline-none transition-all placeholder:text-slate-300"
                    placeholder="Descreva detalhadamente o serviço solicitado e as observações técnicas encontradas em campo..."
                    value={formData.requestedService}
                    onChange={e => setFormData(p => ({ ...p, requestedService: e.target.value }))}
                  />
                </section>

                {/* Doc Footer */}
                <div className="pt-12 border-t border-slate-100 flex justify-between items-end">
                   <div className="space-y-4">
                      <div className="w-48 border-b border-slate-900 pb-1" />
                      <p className="text-[9px] font-black uppercase text-slate-400">Assinatura do Técnico</p>
                   </div>
                   <div className="space-y-4 text-right">
                      <div className="w-48 border-b border-slate-900 pb-1" />
                      <p className="text-[9px] font-black uppercase text-slate-400">Assinatura do Cliente</p>
                   </div>
                </div>

              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="px-8 py-5 bg-white border-t border-slate-100 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.02)] z-10">
            <div className="flex w-full justify-between items-center">
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-[9px] font-bold uppercase tracking-widest">Preenchimento Manual v1.2</span>
              </div>
              <div className="flex gap-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-none h-11 px-8 font-black uppercase text-[10px] tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors"
                >
                  Descartar
                </Button>
                <Button 
                  onClick={handleSave}
                  className="bg-orange-600 hover:bg-orange-700 text-white rounded-none h-11 px-12 font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-orange-500/20 transition-all active:scale-95"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Documento
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
