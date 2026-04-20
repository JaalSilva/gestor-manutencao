import { TaskDefinition, OriginName } from '../types';

export const ORIGINS: OriginName[] = [
  'Cajazeiras Oito',
  'Cajazeiras Nove',
  'Fazenda Grande Dois',
  'Jaguaripe',
  'Parque São José',
  'Banco'
];

export const NATIVE_TASK_DEFINITIONS: TaskDefinition[] = [
  {
    id: 'ac',
    name: 'Ar-condicionado',
    frequency: '3x/ano',
    periodsPerYear: 3,
    steps: [
      'Limpeza de filtros de ar e verificação de dreno',
      'Higienização bactericida da serpentina',
      'Inspeção da carga de gás e conexões elétricas'
    ],
    safety: ['Máscara de Proteção (PFF2)', 'Escada com trava de segurança', 'Luvas isolantes', 'Manuseio Seguro de Fluidos'],
    description: 'Manutenção preventiva em unidades evaporadoras e condensadoras.'
  },
  {
    id: 'bebedouros',
    name: 'Bebedouros',
    frequency: '2x/ano',
    periodsPerYear: 2,
    steps: [
      'Higienização do reservatório com produto específico',
      'Troca de elementos filtrantes (carvão ativado)',
      'Teste de termostato e limpeza de grades'
    ],
    safety: ['Luvas descartáveis', 'Verificar Disjuntor DR', 'Garantir potabilidade', 'Higienização Clorada'],
    description: 'Foco na qualidade da água e funcionamento elétrico.'
  },
  {
    id: 'cadeiras',
    name: 'Cadeiras',
    frequency: 'Anual',
    periodsPerYear: 1,
    steps: [
      'Reaperto de parafusos e componentes de fixação',
      'Limpeza profunda da superfície de assento',
      'Inspeção de ponteiras e rodízios'
    ],
    safety: ['Uso de joelheiras', 'Proteção para olhos'],
    description: 'Manutenção de mobiliário e conforto.'
  },
  {
    id: 'passagem',
    name: 'Caixas de Passagem',
    frequency: 'Anual',
    periodsPerYear: 1,
    steps: [
      'Limpeza interna e remoção de detritos',
      'Reaperto de bornes e conexões elétricas',
      'Verificação de selagens contra infiltração'
    ],
    safety: ['Luvas isolantes', 'Verificador de Tensão'],
    description: 'Manutenção de rede elétrica e hidráulica.'
  },
  {
    id: 'extintores',
    name: 'Extintores',
    frequency: 'Anual',
    periodsPerYear: 1,
    steps: [
      'Verificação de lacre e pino de segurança',
      'Inspeção de validade da carga e do casco',
      'Desobstrução do acesso ao equipamento'
    ],
    safety: ['Cuidado com recipientes sob pressão'],
    description: 'Equipamento crítico de combate a incêndio.'
  },
  {
    id: 'pragas',
    name: 'Controle de Pragas',
    frequency: 'Anual',
    periodsPerYear: 1,
    steps: [
      'Aplicação de gel em pontos estratégicos',
      'Pulverização perimetral contra rastejantes',
      'Inspeção de ralos e vedações'
    ],
    safety: ['Uso de máscara respiratória', 'Isolamento da área por 2h'],
    description: 'Dedetização e desratização preventiva.'
  },
  {
    id: 'fossa',
    name: 'Limpeza de Fossa',
    frequency: 'Anual',
    periodsPerYear: 1,
    steps: [
      'Sucção técnica de efluentes',
      'Inspeção de integridade das tampas',
      'Desobstrução de caixas de passagem'
    ],
    safety: ['Botas de PVC', 'Luvas de borracha nitrílica', 'Cuidado com gases confinados'],
    description: 'Manutenção pesada de esgoto e drenagem.'
  }
];

export const FINANCIAL_CONFIG = {
  LOW_BALANCE_THRESHOLD: 250,
  RESOLUTION_THRESHOLD: 500
};
