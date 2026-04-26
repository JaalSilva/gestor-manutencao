export interface Member {
  id: string;
  name: string;
  phone?: string;
}

export interface Group {
  id: string;
  members: [Member, Member]; // Exactly 2 members
}

export interface CustomField {
  id: string;
  label: string;
  value: string;
}

export interface TaskDefinition {
  id: string;
  name: string;
  frequency: string; // ex: "3x/ano"
  periodsPerYear: number;
  steps: string[];
  safety: string[];
  description?: string;
  color?: string; // Cor personalizada por serviço
}

export interface MaintenanceTask {
  id: string;
  definitionId: string;
  periodIndex: number; // 0, 1, 2...
  status: 'pending' | 'completed' | 'interrupted';
  completedAt?: string;
  performer?: string; // Quem executou
  year: number;
}

export interface MaintenancePending {
  id: string;
  reporter: string;
  date: string;
  time: string;
  area: string;
  criticality: 'low' | 'high'; // Não Crítico / Crítico
  cost: number;
  isVoluntaryCapable: boolean; // Voluntários Locais ou Terceirizados
  description: string;
  expenseId?: string; // Vínculo opcional com transação financeira
}

export type OriginName = 
  | 'Cajazeiras Oito' 
  | 'Cajazeiras Nove' 
  | 'Fazenda Grande Dois' 
  | 'Jaguaripe' 
  | 'Parque São José'
  | 'Banco';

export interface Transaction {
  id: string;
  type: 'deposit' | 'expense';
  accountType: 'Donativos' | 'Banco/Cofre' | 'Outra'; // Ref: S-26-T columns
  origin?: OriginName; // Renomeado de congregation
  value: number;
  date: string;
  monthReference: string; // MM/YYYY
  description: string;
  category: 'Manutenção' | 'Limpeza' | 'Equipamentos' | 'Juros Bancários' | 'Geral';
  receiptUrl?: string;
  linkedPendencyId?: string; // Para despesas vinculadas a uma pendência
}

export interface CommissionMember {
  id: string;
  name: string;
  role: string;
  congregation?: string;
  circuit: string; // Fixo: BA-71
}

export interface AppSettings {
  appName: string;
  appLogo?: string; // URL or Base64
  primaryColor: string;
  backgroundColor: string;
  darkMode: boolean;
  accentColors: string[];
  clearingPassword?: string;
  commissionMembers: CommissionMember[];
  osTitle?: string;
  osSubTitle?: string;
  nextOsNumber?: number;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  focus: string;
  leader: string;
  manager: string;
  groups: Group[];
  customFields: CustomField[];
  taskType?: string; // Links to TaskDefinition id
}

export interface PanelTemplate {
  id: string;
  name: string;
  description: string;
  teams: Team[];
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime?: string; // HH:mm
  type: 'activity' | 'meeting' | 'maintenance' | 'visit';
  status: 'scheduled' | 'requested' | 'confirmed' | 'cancelled';
  organizer: string;
  location?: string;
}

export interface ServiceOrderItem {
  id: string;
  description: string;
  service: string;
  material: string;
  prevValue: string;
  realValue: string;
  status: 'E' | 'P' | 'N'; // Executado, Pendente, Não Executado
}

export interface ServiceOrder {
  id: string;
  osNumber: string;
  date: string;
  period: string; // ex: "07/01/2024 até 07/08/2024"
  
  // Informações Gerais
  unit: string;
  requester: string;
  responsible: string;
  executingSector: string;
  maintenanceType: string;
  costCenter: string;
  account: string;
  location: string;
  provider: string;
  brandModel: string;
  serialNumber: string;
  client: string;

  // Padrões de Execução
  deliveryDeadline: string;
  executionTime: string;
  interferenceTime: string;
  priority: 'Baixa' | 'Média' | 'Alta';
  warranty: string;

  // Identificação do Ambiente
  buildingName: string;
  address: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  fax: string;
  activityType: string;
  climatizedArea: string;
  fixedOccupants: string;
  floatingOccupants: string;

  // Responsável Técnico
  techName: string;
  techCpf: string;
  techReg: string;
  techArtOs: string;
  techAddress: string;
  techNeighborhood: string;
  techArtFun: string;
  techZip: string;
  techPhone: string;
  techCity: string;

  requestedService: string;
  observations: string;
  planObservations: string;
  items: ServiceOrderItem[];
}

export type AppState = {
  panels: PanelTemplate[];
  currentPanelId: string | null;
  settings: AppSettings;
  tasks: MaintenanceTask[];
  taskDefinitions: TaskDefinition[];
  pendencies: MaintenancePending[];
  transactions: Transaction[];
  events: CalendarEvent[];
  serviceOrders: ServiceOrder[];
  balanceAlertVisible: boolean;
  isHydrated: boolean;
  _checkBalanceAlert: () => void;
  
  // Balance
  getBalance: () => number;
  addPanel: (panel: PanelTemplate) => Promise<void>;
  updatePanel: (id: string, panel: Partial<PanelTemplate>) => Promise<void>;
  deletePanel: (id: string) => Promise<void>;
  setCurrentPanel: (id: string | null) => void;
  
  // Settings
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  
  // Commission
  upsertCommissionMember: (member: CommissionMember) => Promise<void>;
  deleteCommissionMember: (id: string) => Promise<void>;
  
  // Compliance
  completeTask: (definitionId: string, periodIndex: number, year: number) => Promise<void>;
  resetTask: (definitionId: string, periodIndex: number, year: number) => Promise<void>;
  clearMaintenanceHistory: (definitionId: string) => Promise<void>;
  
  // Technical Library
  addTaskDefinition: (def: TaskDefinition) => Promise<void>;
  updateTaskDefinition: (id: string, def: Partial<TaskDefinition>) => Promise<void>;
  deleteTaskDefinition: (id: string) => Promise<void>;
  
  // Pendencies
  addPendency: (pending: MaintenancePending) => Promise<void>;
  updatePendency: (id: string, pending: Partial<MaintenancePending>) => Promise<void>;
  deletePendency: (id: string) => Promise<void>;

  // Finance
  addTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  clearFinanceStore: () => Promise<void>;
  interruptTask: (definitionId: string, periodIndex: number, year: number) => Promise<void>;

  // Calendar
  addEvent: (event: CalendarEvent) => Promise<void>;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

  // Service Orders
  addServiceOrder: (os: ServiceOrder) => Promise<void>;
  updateServiceOrder: (id: string, os: Partial<ServiceOrder>) => Promise<void>;
  deleteServiceOrder: (id: string) => Promise<void>;
}
