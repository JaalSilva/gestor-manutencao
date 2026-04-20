import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, Lock, User, Terminal } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginAsGuest } = useAuth();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    try {
      await login(username, password);
    } catch (error) {
      console.error(error);
      toast.error('Garantia de acesso negada. Verifique credenciais.');
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
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 rotate-3 transform transition-transform hover:rotate-0 duration-500">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-black text-white uppercase tracking-tighter">GESTÃO DE MANUTENÇÃO</CardTitle>
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
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input 
                  placeholder="ID de Usuário" 
                  className="bg-slate-950/50 border-slate-800 text-white pl-10 h-10 font-bold focus:ring-blue-500 transition-all"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input 
                  type="password" 
                  placeholder="Senha de Acesso" 
                  className="bg-slate-950/50 border-slate-800 text-white pl-10 h-10 font-bold focus:ring-blue-500 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Button 
                type="submit" 
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-[0.3em] transition-all shadow-lg shadow-blue-500/20"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Validando...
                  </div>
                ) : (
                  "Autenticar Sessão"
                )}
              </Button>

              <Button 
                type="button"
                variant="ghost" 
                className="w-full text-slate-400 hover:text-white font-bold uppercase text-[9px] tracking-widest h-10"
                onClick={handleGuestLogin}
                disabled={loading}
              >
                Entrar sem login
              </Button>
            </div>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-800/50 text-center">
            <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <Terminal className="h-3 w-3" />
              <span>Garantia de Sincronização Ativa</span>
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
