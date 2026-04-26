import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePanelStore } from '../store/usePanelStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, User, Terminal, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export const Login: React.FC = () => {
  const { settings } = usePanelStore();
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [congregation, setCongregation] = useState('');
  const [circuit, setCircuit] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, loginAsGuest } = useAuth();

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      await loginAsGuest();
    } catch (error) {
      toast.error('Falha ao liberar acesso de convidado.');
    } finally {
      setLoading(false);
    }
  };

  const MASTER_UI_USERS = [
    { name: "Jaaziel Silva", icon: "JS" },
    { name: "Elton Ramos", icon: "ER" },
    { name: "Kelvin", icon: "K" }
  ];

  const handleQuickLogin = async (name: string) => {
    setUsername(name);
    setIsRegistering(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Preencha ID e Senha');
      return;
    }

    setLoading(true);
    try {
      if (isRegistering) {
        if (!congregation || !circuit) {
          toast.error('Preencha congregação e circuito');
          setLoading(false);
          return;
        }
        await register(username, password, congregation, circuit);
      } else {
        await login(username, password);
      }
    } catch (error: any) {
      toast.error(error.message || 'Falha na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px]" />
      
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-2xl relative z-10">
        <CardHeader className="text-center space-y-1 pb-8">
          <div className="mx-auto w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 rotate-3 transform transition-transform hover:rotate-0 duration-500 overflow-hidden border border-slate-800">
            {settings.appLogo ? (
              <img src={settings.appLogo} alt="Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <ShieldCheck className="h-8 w-8 text-blue-600" />
            )}
          </div>
          <CardTitle className="text-2xl font-black text-white uppercase tracking-tighter">{settings.appName}</CardTitle>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
          >
            <CardDescription className="text-blue-400 font-bold text-[10px] uppercase tracking-[0.2em]">
              Complexos de salões do Reino
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isRegistering && (
             <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 text-center">Acesso Rápido</p>
                <div className="flex justify-center gap-3">
                   {MASTER_UI_USERS.map(u => (
                     <button 
                       key={u.name}
                       className={cn(
                         "h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs transition-all border",
                         username === u.name ? "bg-blue-600 border-blue-400 text-white" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-blue-500"
                       )}
                       onClick={() => handleQuickLogin(u.name)}
                       title={u.name}
                     >
                        {u.icon}
                     </button>
                   ))}
                </div>
             </div>
          )}

          <div className="relative py-2">
             <div className="absolute inset-0 flex items-center"><Separator className="bg-slate-800" /></div>
             <div className="relative flex justify-center text-[9px] uppercase font-black tracking-widest text-slate-600 bg-transparent px-2">
               {isRegistering ? 'Nova Conta' : 'Identificação de Acesso'}
             </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input 
                  placeholder="ID de Usuário" 
                  className="bg-slate-950/50 border-slate-800 text-white pl-10 h-10 font-bold focus:ring-blue-500"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input 
                  type="password"
                  placeholder="Senha" 
                  className="bg-slate-950/50 border-slate-800 text-white pl-10 h-10 font-bold focus:ring-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              {isRegistering && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      placeholder="Congregação" 
                      className="bg-slate-950/50 border-slate-800 text-white h-10 text-xs font-bold"
                      value={congregation}
                      onChange={(e) => setCongregation(e.target.value)}
                      disabled={loading}
                    />
                    <Input 
                      placeholder="Circuito (Ex: BA-71)" 
                      className="bg-slate-950/50 border-slate-800 text-white h-10 text-xs font-bold"
                      value={circuit}
                      onChange={(e) => setCircuit(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </motion.div>
              )}
            </div>
            
            <div className="flex flex-col gap-3">
              <Button 
                type="submit" 
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-[0.3em] shadow-lg shadow-blue-500/20"
                disabled={loading}
              >
                {loading ? (
                   <div className="flex items-center gap-2">
                     <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     Processando...
                   </div>
                ) : (
                   isRegistering ? "Criar Minha Conta" : "Entrar no Sistema"
                )}
              </Button>

              <div className="flex items-center justify-between gap-4">
                <button 
                  type="button"
                  className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-400 transition-colors"
                  onClick={() => setIsRegistering(!isRegistering)}
                >
                  {isRegistering ? 'Já tenho uma conta' : 'Criar nova conta'}
                </button>
                <button 
                  type="button"
                  className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                  onClick={handleGuestLogin}
                >
                  Acesso Convidado
                </button>
              </div>
            </div>
          </form>
          
          <div className="pt-6 border-t border-slate-800/50 text-center">
             <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
               <Terminal className="h-3 w-3" />
               <span>Base de Dados Sincronizada</span>
             </div>
          </div>
        </CardContent>
      </Card>
      
      <footer className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.4em]">
          Desenvolvido por Jaaziel Silva
        </p>
      </footer>
    </div>
  );
};
