import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { encrypt } from '../../lib/crypto';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Key, ShieldCheck, LogOut, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

export const UserAccountSettings: React.FC = () => {
  const { user, username, logout } = useAuth();
  const [newLogin, setNewLogin] = useState(username || '');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!user) return;
    if (!newLogin && !newPassword) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/auth/update', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          uid: user.uid, 
          newLogin: newLogin !== username ? newLogin : undefined, 
          newPassword: newPassword || undefined 
        })
      });

      if (!response.ok) throw new Error("Erro ao atualizar credenciais.");

      toast.success("Credenciais atualizadas! Elas entrarão em vigor no próximo login.");
      setNewPassword('');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Falha ao atualizar credenciais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50/50">
        <CardTitle className="text-xs font-black uppercase tracking-tight flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" /> Acesso de Usuário
          </div>
          <Badge variant="outline" className="text-[9px] font-bold text-blue-600 border-blue-200">AES-256 ENCRYPTED</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-slate-400">Login / Identificador</Label>
          <div className="relative">
             <User className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
             <Input 
                value={newLogin} 
                onChange={(e) => setNewLogin(e.target.value)}
                placeholder="Seu nome de acesso"
                className="pl-10 font-bold"
                disabled={loading}
             />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-slate-400">Nova Senha</Label>
          <div className="relative">
             <Key className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
             <Input 
                type="password"
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Deixe em branco para manter"
                className="pl-10 font-bold"
                disabled={loading}
             />
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <Button 
            className="flex-1 bg-blue-600 hover:bg-blue-700 font-black uppercase text-[10px] tracking-widest gap-2"
            onClick={handleUpdate}
            disabled={loading}
          >
            {loading ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Salvar Alterações
          </Button>
          <Button 
            variant="outline" 
            className="font-black uppercase text-[10px] tracking-widest gap-2 border-slate-200 text-slate-500 hover:text-red-600"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4" />
            Sair do Sistema
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
