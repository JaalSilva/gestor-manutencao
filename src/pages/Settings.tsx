import React, { useState } from 'react';
import { usePanelStore } from '../store/usePanelStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Palette, Type, Save, Moon,
  Smartphone, Shield, Database, Trash2, 
  Download, Lock, Key, AlertCircle, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const CORPORATE_PALETTES = [
  { name: 'Azul Cobalto', primary: '#0f172a', accent: '#3b82f6' },
  { name: 'Cinza Executivo', primary: '#334155', accent: '#64748b' },
  { name: 'Verde Esmeralda', primary: '#064e3b', accent: '#10b981' },
  { name: 'Vermelho Corporativo', primary: '#450a0a', accent: '#ef4444' },
  { name: 'Roxo Deep', primary: '#2e1065', accent: '#8b5cf6' },
];

import { UserAccountSettings } from '../components/settings/UserAccountSettings';

export const Settings: React.FC = () => {
  const { settings, updateSettings, taskDefinitions, tasks, pendencies } = usePanelStore();
  const [passwordAttempts, setPasswordAttempts] = useState(0);
  const [keyInput, setKeyInput] = useState('');
  const [newPass, setNewPass] = useState('');
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);

  const totalRequiredCount = (taskDefinitions || []).reduce((acc, def) => acc + (def.periodsPerYear || 0), 0);
  const completedCount = (tasks || []).filter(t => t.status === 'completed' && t.year === new Date().getFullYear()).length;
  const progressPercent = totalRequiredCount > 0 ? (completedCount / totalRequiredCount) * 100 : 0;

  const handleSave = () => {
    toast.success('Configurações salvas com sucesso!');
  };

  const handleUpdatePassword = () => {
    if (keyInput !== 'AEJW') {
      const newAttempts = passwordAttempts + 1;
      setPasswordAttempts(newAttempts);
      if (newAttempts >= 3) {
        toast.error("Senha iniciais da comissão em ordem alfabética", { duration: 5000 });
        setPasswordAttempts(0);
      } else {
        toast.error(`Chave incorreta. Tentativa ${newAttempts}/3`);
      }
      return;
    }

    if (newPass.length !== 4) {
      toast.error("A nova senha deve ter 4 dígitos.");
      return;
    }

    updateSettings({ clearingPassword: newPass });
    setIsPassModalOpen(false);
    setKeyInput('');
    setNewPass('');
    setPasswordAttempts(0);
    toast.success("Senha de segurança atualizada!");
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Ajustes</h1>
          <p className="text-slate-500 font-medium italic">Configurações globais e branding empresarial.</p>
        </div>
        <Button onClick={handleSave} className="bg-slate-900 hover:bg-slate-800 shadow-lg gap-2 h-10 px-6">
          <Save className="h-4 w-4" />
          Salvar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Segurança & Acesso</h2>
            <UserAccountSettings />
          </section>

          <section className="space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Identidade Visual</h2>
            <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
               <CardHeader className="bg-slate-50/50">
                  <CardTitle className="text-xs font-black uppercase tracking-tight flex items-center gap-2">
                    <Palette className="h-4 w-4 text-blue-600" /> Painel de Branding
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-6 space-y-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Paletas Corporativas</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                       {CORPORATE_PALETTES.map(p => (
                         <button
                           key={p.name}
                           onClick={() => updateSettings({ primaryColor: p.primary })}
                           className={cn(
                             "flex items-center gap-2 p-2 rounded-lg border transition-all hover:bg-slate-50",
                             settings.primaryColor === p.primary ? "border-blue-600 bg-blue-50/30" : "border-slate-100"
                           )}
                         >
                           <div className="flex -space-x-1">
                             <div className="h-4 w-4 rounded-full" style={{ backgroundColor: p.primary }} />
                             <div className="h-4 w-4 rounded-full" style={{ backgroundColor: p.accent }} />
                           </div>
                           <span className="text-[10px] font-bold text-slate-600 truncate">{p.name}</span>
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="space-y-1">
                       <Label className="text-[10px] font-black uppercase text-slate-400">Cor Primária (Custom)</Label>
                       <p className="text-[10px] text-slate-400">Define o tom principal de relatórios e botões.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                       <input 
                         type="color" 
                         value={settings.primaryColor} 
                         onChange={(e) => updateSettings({ primaryColor: e.target.value })}
                         className="h-8 w-8 rounded-lg cursor-pointer bg-transparent border-none"
                       />
                       <span className="text-[10px] font-mono font-bold pr-2">{settings.primaryColor.toUpperCase()}</span>
                    </div>
                  </div>
               </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Governança & Segurança</h2>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
               <div className="flex items-center justify-between p-4 px-6">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 text-sm leading-none">Trocar Senha Operacional</span>
                      <span className="text-[11px] text-slate-400 mt-1 italic">Senha para zerar tesouraria</span>
                    </div>
                  </div>
                  <Dialog open={isPassModalOpen} onOpenChange={setIsPassModalOpen}>
                    <DialogTrigger render={<Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase">Alterar</Button>} />
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="uppercase font-black text-blue-600">Configurar Segurança</DialogTitle>
                        <DialogDescription className="font-bold">
                           Para alterar a senha mestre de expurgo (Zerar Conta), identifique-se com a chave do sistema.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase text-slate-400">Chave de Autorização (4 Letras)</Label>
                           <Input 
                             maxLength={4} 
                             value={keyInput} 
                             onChange={(e) => setKeyInput(e.target.value.toUpperCase())}
                             placeholder="Digite a Chave AE..."
                             className="text-center font-black tracking-widest text-lg"
                           />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase text-slate-400">Nova Senha Numérica (4 Dígitos)</Label>
                           <Input 
                             type="password"
                             maxLength={4} 
                             value={newPass} 
                             onChange={(e) => setNewPass(e.target.value)}
                             placeholder="Ex: 0000"
                             className="text-center font-black tracking-widest text-lg"
                           />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsPassModalOpen(false)}>Cancelar</Button>
                        <Button className="font-black uppercase text-xs" onClick={handleUpdatePassword}>Atualizar Senha</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
               </div>

               <div className="flex items-center justify-between p-4 px-6">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                      <Database className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 text-sm leading-none">Exportar Banco de Dados</span>
                      <span className="text-[11px] text-slate-400 mt-1">Backup local do estado global</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 gap-2 text-[10px] font-bold uppercase">
                    <Download className="h-3 w-3" /> Backup
                  </Button>
               </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
           <section className="space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Configurações de Layout</h2>
              <Card className="rounded-2xl shadow-sm border-none bg-slate-900 text-white p-6 space-y-6">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <Moon className="h-4 w-4 text-blue-400" />
                       <span className="text-sm font-bold">Modo Escuro</span>
                    </div>
                    <Switch checked={settings.darkMode} onCheckedChange={(val) => updateSettings({ darkMode: val })} />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-white/40">Nome da Unidade Operacional</Label>
                    <Input 
                      className="bg-white/10 border-white/10 text-white font-bold h-10"
                      value={settings.appName}
                      onChange={(e) => updateSettings({ appName: e.target.value })}
                    />
                 </div>
              </Card>
           </section>

           <section className="space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Status de Compliance Anual</h2>
              <Card className="rounded-2xl shadow-sm border-none bg-blue-600 text-white p-6 relative overflow-hidden">
                 <div className="relative z-10 space-y-4">
                    <div>
                       <p className="text-[9px] font-black uppercase text-white/60 mb-1">Ano Corrente {new Date().getFullYear()}</p>
                       <h3 className="text-4xl font-black">{progressPercent.toFixed(0)}%</h3>
                    </div>
                    <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                       <div className="h-full bg-white shadow-[0_0_10px_white]" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <p className="text-[10px] text-white/50 italic leading-tight">
                       O JW Hub Enterprise consolida todos os serviços marcados como realizados para gerar métricas de auditoria local.
                    </p>
                 </div>
                 <AlertTriangle className="absolute -right-4 -bottom-4 h-32 w-32 text-white/10 rotate-12" />
              </Card>
           </section>
        </div>
      </div>

      <footer className="pt-20 border-t border-slate-100 flex flex-col items-center gap-2 text-center pb-8 opacity-50">
         <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">JW Hub Maintenance Enterprise v4.0</p>
            <p className="text-[10px] font-bold text-slate-400">Desenvolvido por Jaaziel Silva. Desenvolvedor Sênior.</p>
         </div>
      </footer>
    </div>
  );
};
