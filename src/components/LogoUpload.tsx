import React from 'react';
import api from '../lib/api';
import { usePanelStore } from '../store/usePanelStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

export default function LogoUpload() {
  const { updateSettings } = usePanelStore();
  const [isUploading, setIsUploading] = React.useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    if (!file.type.startsWith('image/')) {
      toast.error("Formato inválido. Use PNG ou JPG.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Arquivo muito grande (Máx 2MB).");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await api.post('/api/branding/upload-logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const fileUrl = result.data.url;
      await updateSettings({ appLogo: fileUrl });
      toast.success("Logo enviada e salva com sucesso!");
    } catch (err: any) {
      console.error("Upload fail:", err);
      toast.error("Falha no upload: " + (err.message || "Erro desconhecido"));
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input 
        type="file" 
        accept="image/*" 
        id="hidden-logo-input"
        className="hidden" 
        onChange={handleUpload} 
        disabled={isUploading}
      />
      <Button 
        variant="outline"
        className="w-full h-10 gap-2 font-black text-[10px] uppercase tracking-widest"
        disabled={isUploading}
        onClick={() => document.getElementById('hidden-logo-input')?.click()}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-3 w-3" />
        )}
        {isUploading ? "Processando..." : "Selecionar Logo"}
      </Button>
    </div>
  );
}
