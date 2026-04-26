import { create } from 'zustand';
import { 
  AppState, PanelTemplate, TaskDefinition, 
  MaintenanceTask, MaintenancePending, Transaction
} from '../types';
import { NATIVE_TASK_DEFINITIONS } from '../constants/technicalData';
import { syncService } from '../services/syncService';

const INITIAL_PANELS: PanelTemplate[] = [
  { id: 'p1', name: 'Painel 01 - Auditórios', description: 'Gestão de ar-condicionado e assentos.', teams: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'p2', name: 'Painel 02 - Áreas de Serviço', description: 'Limpeza e infraestrutura.', teams: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'p3', name: 'Painel 03 - Elétrica e Som', description: 'Manutenção de cabines e quadros.', teams: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'p4', name: 'Painel 04 - Áreas Externas', description: 'Pátio, jardins e portões.', teams: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'p5', name: 'Painel 05 - Documentação', description: 'S-26-T e compliance legal.', teams: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export const usePanelStore = create<AppState>()(
  (set, get) => ({
    settings: {
      appName: 'JW HUB MANUTENÇÃO',
      appLogo: 'https://cdn-icons-png.flaticon.com/512/281/281764.png', // Generic professional G icon
      primaryColor: '#0f172a',
      accentColors: ['#0f172a', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
      backgroundColor: '#f8fafc',
      darkMode: false,
      clearingPassword: '1234',
      commissionMembers: [],
    },
    taskDefinitions: NATIVE_TASK_DEFINITIONS,
    tasks: [],
    pendencies: [],
    transactions: [],
    events: [],
    serviceOrders: [],
    balanceAlertVisible: false,
    isHydrated: false,
    panels: INITIAL_PANELS,
    currentPanelId: null,
    
    // Derived Balance Logic
    getBalance: () => {
      const txs = get().transactions;
      return txs.reduce((acc, t) => t.type === 'deposit' ? acc + t.value : acc - t.value, 0);
    },

    _checkBalanceAlert: () => {
      const balance = get().getBalance();
      set({ balanceAlertVisible: balance <= 250 });
    },
    
    // Panels
    addPanel: async (panel) => {
      set((state) => ({ panels: [...(state.panels || []), panel] }));
      await syncService.savePanel(panel);
    },
    updatePanel: async (id, updatedFields) => {
      const panel = get().panels.find(p => p.id === id);
      if (!panel) return;
      const updated = { ...panel, ...updatedFields, updatedAt: new Date().toISOString() };
      set((state) => ({
        panels: (state.panels || []).map((p) => p.id === id ? updated : p),
      }));
      await syncService.savePanel(updated);
    },
    deletePanel: async (id) => {
      set((state) => ({
        panels: (state.panels || []).filter((p) => p.id !== id),
        currentPanelId: state.currentPanelId === id ? null : state.currentPanelId,
      }));
      await syncService.deletePanel(id);
    },
    setCurrentPanel: (id) => set({ currentPanelId: id }),
    
    // Settings
    updateSettings: async (newSettings) => {
      const updated = { ...get().settings, ...newSettings };
      set({ settings: updated });
      await syncService.saveSettings(updated);
    },
    
    // Commission
    upsertCommissionMember: async (member) => {
      const members = get().settings.commissionMembers || [];
      const index = members.findIndex(m => m.id === member.id);
      const newMembers = [...members];
      if (index > -1) {
        newMembers[index] = member;
      } else {
        if (newMembers.length >= 5) return;
        newMembers.push(member);
      }
      const updatedSettings = { ...get().settings, commissionMembers: newMembers };
      set({ settings: updatedSettings });
      await syncService.saveSettings(updatedSettings);
    },
    deleteCommissionMember: async (id) => {
      const updatedSettings = {
        ...get().settings,
        commissionMembers: (get().settings.commissionMembers || []).filter(m => m.id !== id)
      };
      set({ settings: updatedSettings });
      await syncService.saveSettings(updatedSettings);
    },
    
    // Compliance
    completeTask: async (definitionId, periodIndex, year) => {
      const tasks = get().tasks || [];
      const existingTaskIndex = tasks.findIndex(
        t => t.definitionId === definitionId && t.periodIndex === periodIndex && t.year === year
      );

      let task: MaintenanceTask;
      if (existingTaskIndex > -1) {
        task = {
          ...tasks[existingTaskIndex],
          status: 'completed',
          completedAt: new Date().toISOString()
        };
      } else {
        task = {
          id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          definitionId,
          periodIndex,
          year,
          status: 'completed',
          completedAt: new Date().toISOString()
        };
      }
      
      set((state) => {
        const newTasks = existingTaskIndex > -1 
          ? state.tasks.map((t, i) => i === existingTaskIndex ? task : t)
          : [...state.tasks, task];
        return { tasks: newTasks };
      });
      await syncService.saveTask(task);
    },
    
    resetTask: async (definitionId, periodIndex, year) => {
      const taskToDelete = get().tasks.find(t => 
        t.definitionId === definitionId && t.periodIndex === periodIndex && t.year === year
      );
      if (taskToDelete) {
        set((state) => ({
          tasks: state.tasks.filter(t => t.id !== taskToDelete.id)
        }));
        await syncService.deleteTask(taskToDelete.id);
      }
    },

    interruptTask: async (definitionId, periodIndex, year) => {
      const tasks = get().tasks || [];
      const taskDefs = get().taskDefinitions || [];
      const pendencies = get().pendencies || [];
      
      const def = taskDefs.find(d => d.id === definitionId);
      const existingTaskIndex = tasks.findIndex(
        t => t.definitionId === definitionId && t.periodIndex === periodIndex && t.year === year
      );

      const pendency: MaintenancePending = {
        id: `pend-${Date.now()}`,
        reporter: 'Sistema (Não Realizado)',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString(),
        area: def?.name || 'Área Técnica',
        criticality: 'high',
        cost: 0,
        isVoluntaryCapable: true,
        description: `MANUTENÇÃO NÃO REALIZADA: ${def?.name} (Ciclo ${periodIndex + 1}/${year})`
      };

      let task: MaintenanceTask;
      if (existingTaskIndex > -1) {
        task = { ...tasks[existingTaskIndex], status: 'interrupted' };
      } else {
        task = {
          id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          definitionId,
          periodIndex,
          year,
          status: 'interrupted'
        };
      }

      set((state) => ({
        tasks: existingTaskIndex > -1 ? state.tasks.map((t, i) => i === existingTaskIndex ? task : t) : [...state.tasks, task],
        pendencies: [...state.pendencies, pendency]
      }));
      
      await syncService.saveTask(task);
      await syncService.savePendency(pendency);
    },

    clearMaintenanceHistory: async (definitionId) => {
      const tasksToDelete = get().tasks.filter(t => t.definitionId === definitionId);
      set((state) => ({
        tasks: state.tasks.filter(t => t.definitionId !== definitionId)
      }));
      for (const t of tasksToDelete) {
        await syncService.deleteTask(t.id);
      }
    },

    // Technical Library
    addTaskDefinition: async (def) => {
      set((state) => ({ taskDefinitions: [...state.taskDefinitions, def] }));
      await syncService.saveTaskDef(def);
    },
    updateTaskDefinition: async (id, defUpdates) => {
      const def = get().taskDefinitions.find(d => d.id === id);
      if (!def) return;
      const updated = { ...def, ...defUpdates };
      set((state) => ({
        taskDefinitions: state.taskDefinitions.map(d => d.id === id ? updated : d)
      }));
      await syncService.saveTaskDef(updated);
    },
    deleteTaskDefinition: async (id) => {
      set((state) => ({
        taskDefinitions: state.taskDefinitions.filter(d => d.id !== id),
        tasks: state.tasks.filter(t => t.definitionId !== id)
      }));
      await syncService.deleteTaskDef(id);
    },

    // Pendencies
    addPendency: async (pending) => {
      set((state) => ({ pendencies: [...state.pendencies, pending] }));
      await syncService.savePendency(pending);
    },
    updatePendency: async (id, pendingUpdates) => {
      const pend = get().pendencies.find(p => p.id === id);
      if (!pend) return;
      const updated = { ...pend, ...pendingUpdates };
      set((state) => ({
        pendencies: state.pendencies.map(p => p.id === id ? updated : p)
      }));
      await syncService.savePendency(updated);
    },
    deletePendency: async (id) => {
      set((state) => ({ pendencies: state.pendencies.filter(p => p.id !== id) }));
      await syncService.deletePendency(id);
    },

    // Finance
    addTransaction: async (transaction) => {
      set((state) => ({ transactions: [transaction, ...state.transactions] }));
      get()._checkBalanceAlert();
      await syncService.saveTransaction(transaction);
    },
    deleteTransaction: async (id) => {
      set((state) => ({ transactions: state.transactions.filter(t => t.id !== id) }));
      get()._checkBalanceAlert();
      await syncService.deleteTransaction(id);
    },
    updateTransaction: async (id, txUpdates) => {
      const tx = get().transactions.find(t => t.id === id);
      if (!tx) return;
      const updated = { ...tx, ...txUpdates };
      set((state) => ({
        transactions: state.transactions.map(t => t.id === id ? updated : t)
      }));
      get()._checkBalanceAlert();
      await syncService.saveTransaction(updated);
    },
    clearFinanceStore: async () => {
      const txs = get().transactions;
      set({ transactions: [], balanceAlertVisible: false });
      for (const tx of txs) {
        await syncService.deleteTransaction(tx.id);
      }
    },

    // Calendar
    addEvent: async (event) => {
      set((state) => ({ events: [event, ...state.events] }));
      await syncService.saveEvent(event);
    },
    updateEvent: async (id, eventUpdates) => {
      const event = get().events.find(e => e.id === id);
      if (!event) return;
      const updated = { ...event, ...eventUpdates };
      set((state) => ({
        events: state.events.map(e => e.id === id ? updated : e)
      }));
      await syncService.saveEvent(updated);
    },
    deleteEvent: async (id) => {
      set((state) => ({ events: state.events.filter(e => e.id !== id) }));
      await syncService.deleteEvent(id);
    },

    // Service Orders
    addServiceOrder: async (os) => {
      set((state) => ({ serviceOrders: [os, ...state.serviceOrders] }));
      await syncService.saveServiceOrder(os);
    },
    updateServiceOrder: async (id, osUpdates) => {
      const os = get().serviceOrders.find(o => o.id === id);
      if (!os) return;
      const updated = { ...os, ...osUpdates };
      set((state) => ({
        serviceOrders: state.serviceOrders.map(o => o.id === id ? updated : o)
      }));
      await syncService.saveServiceOrder(updated);
    },
    deleteServiceOrder: async (id) => {
      set((state) => ({ serviceOrders: state.serviceOrders.filter(o => o.id !== id) }));
      await syncService.deleteServiceOrder(id);
    },
  })
);
