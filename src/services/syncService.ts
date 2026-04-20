import { usePanelStore } from '../store/usePanelStore';
import { toast } from 'sonner';

export const syncService = {
  // Collection Names
  PANELS: 'panels',
  TASK_DEFS: 'taskDefinitions',
  TASKS: 'tasks',
  PENDENCIES: 'pendencies',
  TRANSACTIONS: 'transactions',
  EVENTS: 'events',
  SETTINGS: 'config',

  // Utility to get Token
  getHeaders: () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  },

  // Initialize data
  initSync: async () => {
    try {
      const headers = syncService.getHeaders();
      
      const safeFetch = async (url: string) => {
        try {
          const res = await fetch(url, { headers });
          if (!res.ok) return null;
          return await res.json();
        } catch {
          return null;
        }
      };

      // Fetch all collections
      const [panels, taskDefs, tasks, pends, txs, events, settingsDoc] = await Promise.all([
        safeFetch('/api/data/panels'),
        safeFetch('/api/data/taskDefinitions'),
        safeFetch('/api/data/tasks'),
        safeFetch('/api/data/pendencies'),
        safeFetch('/api/data/transactions'),
        safeFetch('/api/data/events'),
        safeFetch('/api/config/settings')
      ]);

      const newState: any = {};
      if (Array.isArray(panels)) newState.panels = panels;
      if (Array.isArray(taskDefs)) newState.taskDefinitions = taskDefs;
      if (Array.isArray(tasks)) newState.tasks = tasks;
      if (Array.isArray(pends)) newState.pendencies = pends;
      if (Array.isArray(txs)) newState.transactions = txs;
      if (Array.isArray(events)) newState.events = events;
      if (settingsDoc && typeof settingsDoc === 'object' && !settingsDoc.error) newState.settings = settingsDoc;

      usePanelStore.setState({ ...newState, isHydrated: true });
      
    } catch (err) {
      console.error("Sync init failed:", err);
      usePanelStore.setState({ isHydrated: true }); // Falha mas libera a UI
    }
  },

  // CRUD methods calling our Server Proxy
  savePanel: async (panel: any) => {
    const res = await fetch(`/api/data/panels/${panel.id}`, {
      method: 'POST',
      headers: syncService.getHeaders(),
      body: JSON.stringify(panel)
    });
    if (res.status === 403) toast.error("Acesso Convidado: Verifique com um administrador para realizar alterações.");
  },
  deletePanel: async (id: string) => {
    const res = await fetch(`/api/data/panels/${id}`, {
      method: 'DELETE',
      headers: syncService.getHeaders()
    });
    if (res.status === 403) toast.error("Acesso Convidado: Apenas administradores podem deletar.");
  },
  saveSettings: async (settings: any) => {
    const res = await fetch('/api/config/settings', {
      method: 'POST',
      headers: syncService.getHeaders(),
      body: JSON.stringify(settings)
    });
    if (res.status === 403) toast.error("Acesso Convidado: Alterações de sistema bloqueadas.");
  },
  saveTask: async (task: any) => {
    const res = await fetch(`/api/data/tasks/${task.id}`, {
      method: 'POST',
      headers: syncService.getHeaders(),
      body: JSON.stringify(task)
    });
    if (res.status === 403) toast.error("Acesso Convidado: Registros de manutenção bloqueados.");
  },
  deleteTask: async (id: string) => {
    const res = await fetch(`/api/data/tasks/${id}`, {
      method: 'DELETE',
      headers: syncService.getHeaders()
    });
    if (res.status === 403) toast.error("Acesso Convidado: Operação bloqueada.");
  },
  saveTaskDef: async (def: any) => {
    const res = await fetch(`/api/data/taskDefinitions/${def.id}`, {
      method: 'POST',
      headers: syncService.getHeaders(),
      body: JSON.stringify(def)
    });
    if (res.status === 403) toast.error("Acesso Convidado: Operação bloqueada.");
  },
  deleteTaskDef: async (id: string) => {
    const res = await fetch(`/api/data/taskDefinitions/${id}`, {
      method: 'DELETE',
      headers: syncService.getHeaders()
    });
    if (res.status === 403) toast.error("Acesso Convidado: Operação bloqueada.");
  },
  savePendency: async (pend: any) => {
    const res = await fetch(`/api/data/pendencies/${pend.id}`, {
      method: 'POST',
      headers: syncService.getHeaders(),
      body: JSON.stringify(pend)
    });
    if (res.status === 403) toast.error("Acesso Convidado: Cadastro de pendências bloqueado.");
  },
  deletePendency: async (id: string) => {
    const res = await fetch(`/api/data/pendencies/${id}`, {
      method: 'DELETE',
      headers: syncService.getHeaders()
    });
    if (res.status === 403) toast.error("Acesso Convidado: Operação bloqueada.");
  },
  saveTransaction: async (tx: any) => {
    const res = await fetch(`/api/data/transactions/${tx.id}`, {
      method: 'POST',
      headers: syncService.getHeaders(),
      body: JSON.stringify(tx)
    });
    if (res.status === 403) toast.error("Acesso Convidado: Lançamentos financeiros bloqueados.");
  },
  deleteTransaction: async (id: string) => {
    const res = await fetch(`/api/data/transactions/${id}`, {
      method: 'DELETE',
      headers: syncService.getHeaders()
    });
    if (res.status === 403) toast.error("Acesso Convidado: Operação bloqueada.");
  },
  saveEvent: async (event: any) => {
    const res = await fetch(`/api/data/events/${event.id}`, {
      method: 'POST',
      headers: syncService.getHeaders(),
      body: JSON.stringify(event)
    });
    if (res.status === 403) toast.error("Acesso Convidado: Gerenciamento de eventos bloqueado.");
  },
  deleteEvent: async (id: string) => {
    const res = await fetch(`/api/data/events/${id}`, {
      method: 'DELETE',
      headers: syncService.getHeaders()
    });
    if (res.status === 403) toast.error("Acesso Convidado: Operação bloqueada.");
  }
};
