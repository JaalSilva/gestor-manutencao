import { usePanelStore } from '../store/usePanelStore';
import { toast } from 'sonner';
import api from '../lib/api';

export const syncService = {
  // Collection Names
  PANELS: 'panels',
  TASK_DEFS: 'taskDefinitions',
  TASKS: 'tasks',
  PENDENCIES: 'pendencies',
  TRANSACTIONS: 'transactions',
  EVENTS: 'events',
  SERVICE_ORDERS: 'serviceOrders',
  SETTINGS: 'config',


  // Initialize data
  initSync: async () => {
    try {
      const safeFetch = async (url: string) => {
        try {
          const result = await api.get(url);
          return result.data;
        } catch (err) {
          console.error(`Fetch error for ${url}:`, err);
          return null;
        }
      };

      // Fetch all collections
      const [panels, taskDefs, tasks, pends, txs, events, orders, settingsDoc] = await Promise.all([
        safeFetch('/api/data/panels'),
        safeFetch('/api/data/taskDefinitions'),
        safeFetch('/api/data/tasks'),
        safeFetch('/api/data/pendencies'),
        safeFetch('/api/data/transactions'),
        safeFetch('/api/data/events'),
        safeFetch('/api/data/serviceOrders'),
        safeFetch('/api/config/settings')
      ]);

      const newState: any = {};
      if (Array.isArray(panels)) newState.panels = panels;
      if (Array.isArray(taskDefs)) newState.taskDefinitions = taskDefs;
      if (Array.isArray(tasks)) newState.tasks = tasks;
      if (Array.isArray(pends)) newState.pendencies = pends;
      if (Array.isArray(txs)) newState.transactions = txs;
      if (Array.isArray(events)) newState.events = events;
      if (Array.isArray(orders)) newState.serviceOrders = orders;
      if (settingsDoc && typeof settingsDoc === 'object' && !settingsDoc.error) newState.settings = settingsDoc;

      usePanelStore.setState({ ...newState, isHydrated: true });
      
    } catch (err) {
      console.error("Sync init failed:", err);
      usePanelStore.setState({ isHydrated: true }); // Falha mas libera a UI
    }
  },

  // Start continuous polling for multi-user sync
  startContinuousSync: (intervalMs = 5000) => {
    // Only start if not already running
    if ((window as any)._syncInterval) return;
    
    console.log("[SYNC] Iniciando sincronismo contínuo...");
    (window as any)._syncInterval = setInterval(async () => {
      await syncService.initSync();
    }, intervalMs);
  },

  // CRUD methods calling our Server Proxy
  savePanel: async (panel: any) => {
    try {
      await api.post(`/api/data/panels/${panel.id}`, panel);
    } catch (err: any) {
      if (err.message.includes('403')) toast.error("Acesso Convidado: Operação bloqueada.");
    }
  },
  deletePanel: async (id: string) => {
    try {
      await api.delete(`/api/data/panels/${id}`);
    } catch (err: any) {
      if (err.message.includes('403')) toast.error("Acesso Convidado: Operação bloqueada.");
    }
  },
  saveSettings: async (settings: any) => {
    try {
      await api.post('/api/config/settings', settings);
    } catch (err: any) {
      if (err.message.includes('403')) toast.error("Acesso Convidado: Operação bloqueada.");
    }
  },
  saveTask: async (task: any) => {
    try {
      await api.post(`/api/data/tasks/${task.id}`, task);
    } catch (err: any) {
      if (err.message.includes('403')) toast.error("Acesso Convidado: Operação bloqueada.");
    }
  },
  deleteTask: async (id: string) => {
    try {
      await api.delete(`/api/data/tasks/${id}`);
    } catch (err: any) {
      if (err.message.includes('403')) toast.error("Acesso Convidado: Operação bloqueada.");
    }
  },
  saveTaskDef: async (def: any) => {
    try {
      await api.post(`/api/data/taskDefinitions/${def.id}`, def);
    } catch (err: any) {
      if (err.message.includes('403')) toast.error("Acesso Convidado: Operação bloqueada.");
    }
  },
  deleteTaskDef: async (id: string) => {
    try {
      await api.delete(`/api/data/taskDefinitions/${id}`);
    } catch (err: any) {
      if (err.message.includes('403')) toast.error("Acesso Convidado: Operação bloqueada.");
    }
  },
  savePendency: async (pend: any) => {
    try {
      await api.post(`/api/data/pendencies/${pend.id}`, pend);
    } catch (err: any) {
      if (err.message.includes('403')) toast.error("Acesso Convidado: Operação bloqueada.");
    }
  },
  deletePendency: async (id: string) => {
    try {
      await api.delete(`/api/data/pendencies/${id}`);
    } catch (err: any) {
      if (err.message.includes('403')) toast.error("Acesso Convidado: Operação bloqueada.");
    }
  },
  saveTransaction: async (tx: any) => {
    try {
      await api.post(`/api/data/transactions/${tx.id}`, tx);
    } catch (err: any) {
      if (err.message.includes('403')) toast.error("Acesso Convidado: Operação bloqueada.");
    }
  },
  deleteTransaction: async (id: string) => {
    try {
      await api.delete(`/api/data/transactions/${id}`);
    } catch (err: any) {
      if (err.message.includes('403')) toast.error("Acesso Convidado: Operação bloqueada.");
    }
  },
  saveEvent: async (event: any) => {
    try {
      await api.post(`/api/data/events/${event.id}`, event);
    } catch (err: any) {
      if (err.message.includes('403')) toast.error("Acesso Convidado: Operação bloqueada.");
    }
  },
  deleteEvent: async (id: string) => {
    try {
      await api.delete(`/api/data/events/${id}`);
    } catch (err: any) {
      if (err.message.includes('403')) toast.error("Acesso Convidado: Operação bloqueada.");
    }
  },
  saveServiceOrder: async (os: any) => {
    try {
      await api.post(`/api/data/serviceOrders/${os.id}`, os);
    } catch (err: any) {
      if (err.message.includes('403')) toast.error("Acesso Convidado: Operação bloqueada.");
    }
  },
  deleteServiceOrder: async (id: string) => {
    try {
      await api.delete(`/api/data/serviceOrders/${id}`);
    } catch (err: any) {
      if (err.message.includes('403')) toast.error("Acesso Convidado: Operação bloqueada.");
    }
  },

  /**
   * Google Integration Secure (Backend Managed)
   */
  getGoogleAuthUrl: async () => {
    try {
      const response = await api.get('/api/auth/google/url');
      return response.data.url;
    } catch (err: any) {
      console.error("Failed to get auth URL", err);
      throw err;
    }
  },

  getGoogleSyncStatus: async () => {
    try {
      const response = await api.get('/api/auth/google/status');
      return response.data;
    } catch (err) {
      return { connected: false };
    }
  },

  syncToGoogleSheets: async (payload: any) => {
    try {
      const response = await api.post('/api/sync/google-sheets', { payload });
      return response.data;
    } catch (err: any) {
      console.error("Sync error", err);
      throw new Error(err.response?.data?.error || "Falha na sincronização segura.");
    }
  }
};
