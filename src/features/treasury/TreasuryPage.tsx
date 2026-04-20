import React, { useState, useRef } from 'react';
import { usePanelStore } from '../../store/usePanelStore';
import { 
  Plus, Search, ArrowUpCircle, ArrowDownCircle, 
  Wallet, Building2, Trash2, Edit2,
  Receipt, DollarSign, BellRing, Link, ExternalLink, FileText,
  ShieldCheck, AlertTriangle, Camera, X, RefreshCcw, BadgeCheck
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription 
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Transaction, OriginName } from '../../types';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { S26TReport } from '../../services/pdf/S26TReport';
import { AnnualReport } from '../../services/pdf/AnnualReport';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

export const TreasuryPage: React.FC = () => {
  const { 
    transactions, addTransaction, deleteTransaction, 
    updateTransaction, clearFinanceStore, balanceAlertVisible, 
    getBalance, settings 
  } = usePanelStore();
  
  const { isGuest } = useAuth();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Zerar Conta State
  const [isClearing, setIsClearing] = useState(false);
  const [pin, setPin] = useState('');
  const [passwordAttempts, setPasswordAttempts] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: 'deposit',
    accountType: 'Donativos',
    date: new Date().toISOString().split('T')[0],
    monthReference: format(new Date(), 'MM/yyyy'),
    value: 0,
    category: 'Manutenção',
    origin: 'Cajazeiras Oito'
  });

  const totalBalance = getBalance();

  const totalDeposits = (transactions || [])
    .filter(t => t.type === 'deposit')
    .reduce((acc, t) => acc + t.value, 0);

  const totalExpenses = (transactions || [])
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.value, 0);

  const filteredTransactions = (transactions || []).filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  const ORIGINS: OriginName[] = [
    'Cajazeiras Oito', 
    'Cajazeiras Nove', 
    'Fazenda Grande Dois', 
    'Jaguaripe', 
    'Parque São José',
    'Banco'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('O arquivo deve ter no máximo 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, receiptUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateTransaction(editingId, {
        ...formData,
        value: Number(formData.value) || 0,
      });
      toast.success('Lançamento atualizado!');
    } else {
      const newTransaction: Transaction = {
        id: `tx-${Date.now()}`,
        type: formData.type as 'deposit' | 'expense',
        accountType: formData.accountType as any || 'Donativos',
        origin: formData.type === 'deposit' ? formData.origin as OriginName : undefined,
        value: Number(formData.value) || 0,
        date: formData.date || new Date().toISOString().split('T')[0],
        monthReference: formData.monthReference || format(new Date(), 'MM/yyyy'),
        description: formData.description || (formData.type === 'deposit' ? `Aporte ${formData.origin}` : 'Nova Despesa'),
        category: formData.category as any || 'Geral',
        linkedPendencyId: formData.linkedPendencyId,
        receiptUrl: formData.receiptUrl,
      };
      addTransaction(newTransaction);
      toast.success('Movimento registrado com sucesso!');
    }

    setIsAdding(false);
    setEditingId(null);
    resetForm();
  };

  const handleClearStore = () => {
    if (pin === (settings.clearingPassword || '1234')) { 
      clearFinanceStore();
      setIsClearing(false);
      setPin('');
      toast.success('Tesouraria zerada com sucesso.');
    } else {
      const newAttempts = passwordAttempts + 1;
      setPasswordAttempts(newAttempts);
      if (newAttempts >= 3) {
        toast.error("Segurança: Painel bloqueado temporariamente.", { duration: 5000 });
        setIsClearing(false);
        setPasswordAttempts(0);
      } else {
        toast.error(`Código incorreto. Tentativa ${newAttempts}/3`);
      }
    }
  };

  const handleEdit = (tx: Transaction) => {
    setFormData(tx);
    setEditingId(tx.id);
    setIsAdding(true);
  };

  const resetForm = () => {
    setFormData({
      type: 'deposit',
      accountType: 'Donativos',
      date: new Date().toISOString().split('T')[0],
      monthReference: format(new Date(), 'MM/yyyy'),
      value: 0,
      category: 'Manutenção',
      origin: 'Cajazeiras Oito'
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Alerta Inteligente */}
      {balanceAlertVisible && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-4 text-red-800 animate-pulse shadow-sm">
          <BellRing className="h-5 w-5 shrink-0" />
          <p className="text-xs font-bold uppercase tracking-tight">
            Saldo Crítico: Solicitar envio de recursos às congregações para cobertura de gastos futuros.
          </p>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Tesouraria</h1>
          <p className="text-slate-500 text-sm font-medium italic">Gestão de recursos e liquidez operacional.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Dialog open={isClearing} onOpenChange={setIsClearing}>
            <DialogTrigger render={
              <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 gap-2 font-bold h-11 px-6">
                <RefreshCcw className="h-4 w-4" />
                Zerar Conta
              </Button>
            } />
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="uppercase font-black text-red-600">Atenção Crítica</DialogTitle>
                <DialogDescription className="font-bold text-slate-600">
                  Gere um relatório S-26-T antes de excluir. Tem certeza que deseja zerar a tesouraria? Todos os dados serão perdidos permanentemente.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Insira o PIN de 4 Dígitos</Label>
                  <Input 
                    type="password" 
                    maxLength={4} 
                    className="text-center text-2xl font-black tracking-[1em]"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsClearing(false)}>Cancelar</Button>
                <Button variant="destructive" className="font-black uppercase text-xs tracking-widest" onClick={handleClearStore}>
                  Confirmar Exclusão Total
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAdding} onOpenChange={(val) => { setIsAdding(val); if(!val) resetForm(); }}>
            <DialogTrigger render={
              <Button className="bg-slate-900 hover:bg-slate-800 gap-2 h-11 px-6 shadow-xl font-bold">
                <Plus className="h-4 w-4" />
                Lançar Movimento
              </Button>
            } />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="uppercase font-black tracking-tight">{editingId ? 'Editar Lançamento' : 'Novo Lançamento'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                  <Button 
                    type="button"
                    variant={formData.type === 'deposit' ? 'default' : 'ghost'}
                    className={cn("h-8 text-[10px] font-black uppercase", formData.type === 'deposit' && "bg-white text-slate-900 shadow-sm")}
                    onClick={() => setFormData(prev => ({ ...prev, type: 'deposit' }))}
                  >
                    <ArrowUpCircle className="h-3 w-3 mr-2 text-green-500" />
                    Entrada
                  </Button>
                  <Button 
                    type="button"
                    variant={formData.type === 'expense' ? 'default' : 'ghost'}
                    className={cn("h-8 text-[10px] font-black uppercase", formData.type === 'expense' && "bg-white text-slate-900 shadow-sm")}
                    onClick={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
                  >
                    <ArrowDownCircle className="h-3 w-3 mr-2 text-red-500" />
                    Saída
                  </Button>
                </div>

                {formData.type === 'deposit' && (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Origem do Recurso</Label>
                    <Select 
                      value={formData.origin} 
                      onValueChange={(val) => setFormData(prev => ({ ...prev, origin: val as OriginName }))}
                    >
                      <SelectTrigger className="h-10 text-xs font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORIGINS.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Valor (R$)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input 
                        type="number" 
                        step="0.01"
                        className="pl-9 h-10 font-bold"
                        value={formData.value || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Referência</Label>
                    <Input 
                      placeholder="MM/YYYY"
                      className="h-10 text-xs font-bold"
                      value={formData.monthReference}
                      onChange={(e) => setFormData(prev => ({ ...prev, monthReference: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Descrição</Label>
                  <Input 
                    className="h-10 text-xs font-medium"
                    placeholder="Ex: Aporte mensal, Manutenção AC..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Comprovante (Foto/Link)</Label>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="h-10 flex-1 text-[10px] font-bold uppercase gap-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="h-4 w-4" />
                      Upload Foto
                    </Button>
                    <Input 
                      className="h-10 flex-1 text-xs font-medium"
                      placeholder="Ou cole Link..."
                      value={formData.receiptUrl || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, receiptUrl: e.target.value }))}
                    />
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  {formData.receiptUrl && (
                    <div className="relative mt-2 h-20 w-32 rounded-lg overflow-hidden border">
                       {formData.receiptUrl.startsWith('data:') ? (
                         <img src={formData.receiptUrl} alt="Preview" className="h-full w-full object-cover" />
                       ) : (
                         <div className="h-full w-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-400 uppercase">Link Externo</div>
                       )}
                       <button 
                         className="absolute top-1 right-1 h-5 w-5 bg-black/50 text-white rounded-full flex items-center justify-center"
                         onClick={() => setFormData(prev => ({ ...prev, receiptUrl: undefined }))}
                       >
                         <X className="h-3 w-3" />
                       </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Coluna S-26-T</Label>
                    <Select 
                      value={formData.accountType} 
                      onValueChange={(val) => setFormData(prev => ({ ...prev, accountType: val as any }))}
                    >
                      <SelectTrigger className="h-10 text-xs font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Donativos">Donativos</SelectItem>
                        <SelectItem value="Banco/Cofre">Banco/Cofre</SelectItem>
                        <SelectItem value="Outra">Outra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Categoria</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(val) => setFormData(prev => ({ ...prev, category: val as any }))}
                    >
                      <SelectTrigger className="h-10 text-xs font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Manutenção">Manutenção</SelectItem>
                        <SelectItem value="Limpeza">Limpeza</SelectItem>
                        <SelectItem value="Equipamentos">Equipamentos</SelectItem>
                        <SelectItem value="Juros Bancários">Juros Bancários</SelectItem>
                        <SelectItem value="Geral">Geral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 font-black uppercase text-xs h-11 tracking-widest">
                    {editingId ? 'Salvar Alterações' : 'Efetuar Lançamento'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-xl bg-slate-900 text-white overflow-hidden group">
          <CardHeader className="pb-2">
            <CardDescription className="text-white/60 font-black uppercase tracking-widest text-[9px]">Saldo Consolidado</CardDescription>
            <CardTitle className={cn(
              "text-4xl font-black tabular-nums transition-all",
              totalBalance <= 250 && "text-red-500 animate-[pulse_1s_infinite] drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]"
            )}>
              R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-white/40 text-[10px] font-black uppercase tracking-widest">
              <span className={cn("h-2 w-2 rounded-full", totalBalance > 500 ? "bg-green-500" : "bg-red-500 animate-pulse")} />
              {totalBalance > 500 ? "Liquidez Segura" : "Liquidez Crítica"}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-white border-l-4 border-green-500">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400 font-black uppercase tracking-widest text-[9px]">Aportes Recebidos</CardDescription>
            <CardTitle className="text-3xl font-black text-green-600 tabular-nums">
              R$ {totalDeposits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <ArrowUpCircle className="h-4 w-4 text-green-500" />
            <span className="text-[10px] text-slate-400 font-bold uppercase">Entradas Acumuladas</span>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-white border-l-4 border-red-500">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400 font-black uppercase tracking-widest text-[9px]">Saídas e Investimentos</CardDescription>
            <CardTitle className="text-3xl font-black text-red-600 tabular-nums">
              R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <ArrowDownCircle className="h-4 w-4 text-red-500" />
            <span className="text-[10px] text-slate-400 font-bold uppercase">Total de Gastos</span>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-2xl bg-white">
        <CardHeader className="border-b border-slate-50 flex-row items-center justify-between space-y-0 pb-4 px-6 py-4">
          <div>
            <CardTitle className="text-lg font-black uppercase tracking-tight">Extrato Operacional</CardTitle>
          </div>
          <div className="flex items-center gap-3">
             {transactions.length > 0 && (
               <div className="flex items-center gap-2">
                 <PDFDownloadLink
                   document={<AnnualReport 
                     year={new Date().getFullYear()} 
                     transactions={transactions} 
                     tasks={usePanelStore.getState().tasks} 
                     taskDefinitions={usePanelStore.getState().taskDefinitions}
                     commissionMembers={settings.commissionMembers}
                     appName={settings.appName}
                     isGuest={isGuest}
                   />}
                   fileName={`Relatorio_Anual_${new Date().getFullYear()}.pdf`}
                 >
                   {({ loading }) => (
                     <Button variant="default" size="sm" className="h-9 gap-2 text-[10px] font-black uppercase bg-blue-600 hover:bg-blue-700" disabled={loading}>
                       <BadgeCheck className="h-3.5 w-3.5" />
                       {loading ? 'Preparando...' : 'Relatório Anual BI'}
                     </Button>
                   )}
                 </PDFDownloadLink>

                 <PDFDownloadLink
                   document={<S26TReport monthRef={formData.monthReference || ''} transactions={transactions} settings={settings} isGuest={isGuest} />}
                   fileName={`S26T_${formData.monthReference?.replace('/', '_')}.pdf`}
                 >
                   {({ loading }) => (
                     <Button variant="outline" size="sm" className="h-9 gap-2 text-[10px] font-black uppercase border-slate-200" disabled={loading}>
                       <FileText className="h-3.5 w-3.5" />
                       {loading ? 'Preparando...' : 'Exportar S-26-T'}
                     </Button>
                   )}
                 </PDFDownloadLink>
               </div>
             )}
             <div className="hidden md:flex bg-slate-100 p-1 rounded-lg">
              <Button 
                variant={filterType === 'all' ? 'default' : 'ghost'} 
                size="sm" 
                className={cn("h-7 text-[9px] uppercase font-black px-4", filterType === 'all' && "bg-white text-slate-900 shadow-sm")}
                onClick={() => setFilterType('all')}
              >
                Tudo
              </Button>
              <Button 
                variant={filterType === 'deposit' ? 'default' : 'ghost'} 
                size="sm" 
                className={cn("h-7 text-[9px] uppercase font-black px-4", filterType === 'deposit' && "bg-white text-slate-900 shadow-sm")}
                onClick={() => setFilterType('deposit')}
              >
                Entradas
              </Button>
              <Button 
                variant={filterType === 'expense' ? 'default' : 'ghost'} 
                size="sm" 
                className={cn("h-7 text-[9px] uppercase font-black px-4", filterType === 'expense' && "bg-white text-slate-900 shadow-sm")}
                onClick={() => setFilterType('expense')}
              >
                Saídas
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input 
                placeholder="Filtrar..." 
                className="pl-9 h-9 w-40 text-xs font-bold bg-slate-50 border-none shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 border-b border-slate-50">
                  <th className="px-6 py-3 text-left font-black uppercase text-[9px] tracking-widest">Data / Ref</th>
                  <th className="px-6 py-3 text-left font-black uppercase text-[9px] tracking-widest">Identificação</th>
                  <th className="px-6 py-3 text-right font-black uppercase text-[9px] tracking-widest">Valor</th>
                  <th className="px-6 py-3 text-right font-black uppercase text-[9px] tracking-widest">Comp / Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(filteredTransactions || []).map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{format(new Date(t.date), 'dd/MM/yy')}</span>
                        <span className="text-[10px] text-slate-400 font-black uppercase">{t.monthReference}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{t.description}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {t.origin || t.category}
                        </span>
                      </div>
                    </td>
                    <td className={cn(
                      "px-6 py-4 text-right font-black tabular-nums text-sm",
                      t.type === 'deposit' ? "text-green-600" : "text-red-500"
                    )}>
                      {t.type === 'deposit' ? '+' : '-'} R$ {t.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {t.receiptUrl && (
                          <Dialog>
                            <DialogTrigger render={
                              <button className="h-8 w-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                                <Receipt className="h-4 w-4" />
                              </button>
                            } />
                            <DialogContent className="max-w-2xl">
                               <DialogHeader>
                                 <DialogTitle className="uppercase font-black">Comprovante</DialogTitle>
                               </DialogHeader>
                               <div className="mt-4 border rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center min-h-[300px]">
                                  {t.receiptUrl.startsWith('data:') ? (
                                    <img src={t.receiptUrl} alt="Comprovante" className="max-w-full max-h-[70vh] object-contain" />
                                  ) : (
                                    <div className="text-center p-8">
                                       <Link className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                       <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Link de Documento Externo</p>
                                       <Button render={<a href={t.receiptUrl} target="_blank" rel="noopener noreferrer">Abrir em Nova Aba</a>} />
                                    </div>
                                  )}
                               </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-300 hover:text-blue-600"
                          onClick={() => handleEdit(t)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-300 hover:text-red-500"
                          onClick={() => {
                            if(confirm('Remover este lançamento?')) deleteTransaction(t.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                { (filteredTransactions || []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                       <Wallet className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                       <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum movimento encontrado</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
