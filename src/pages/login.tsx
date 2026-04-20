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
    setLoading(true);
    try {
      await login(username, password);
    } catch (error) {
      toast.error('Acesso negado. Verifique credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 px-4">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-black text-white uppercase tracking-tighter">GESTÃO DE MANUTENÇÃO</CardTitle>
          <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
            <CardDescription className="text-blue-400 font-bold text-[10px] uppercase tracking-widest">
              Complexos de salões do Reino
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input placeholder="Usuário" value={username} onChange={(e) => setUsername(e.target.value)} className="bg-slate-950/50 border-slate-800 text-white" />
            <Input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-slate-950/50 border-slate-800 text-white" />
            <Button type="submit" disabled={loading} className="w-full bg-blue-600 uppercase font-black text-xs h-12">
              Autenticar
            </Button>
            <Button type="button" variant="ghost" onClick={handleGuestLogin} className="w-full text-slate-400 text-[9px] uppercase font-bold">
              Entrar sem login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};