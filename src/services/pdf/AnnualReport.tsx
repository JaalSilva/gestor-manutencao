import React from 'react';
import { 
  Document, Page, Text, View, StyleSheet, 
  Font, Image
} from '@react-pdf/renderer';
import { 
  Transaction, TaskDefinition, MaintenanceTask, CommissionMember, AppSettings 
} from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { calculateMovingAverage, getRevenueByOrigin } from '../../lib/biUtils';

// Font Registration
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Italic.ttf', fontWeight: 400, fontStyle: 'italic' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf', fontWeight: 700 }
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Roboto',
    fontSize: 9,
    color: '#1e293b',
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#0f172a',
    paddingBottom: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
    textTransform: 'uppercase',
    fontWeight: 'medium',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
    textTransform: 'uppercase',
    backgroundColor: '#f8fafc',
    padding: '6 10',
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
    marginBottom: 10,
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableHeader: {
    backgroundColor: '#f8fafc',
    fontWeight: 'bold',
  },
  tableCell: {
    padding: 8,
    flex: 1,
  },
  analyticsGrid: {
    flexDirection: 'row',
    gap: 15,
  },
  analyticsCard: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f8faf2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardLabel: {
    fontSize: 7,
    textTransform: 'uppercase',
    color: '#64748b',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  signatureSection: {
    marginTop: 50,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 30,
    justifyContent: 'center',
  },
  signatureBox: {
    width: 140,
    textAlign: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#475569',
  },
  signatureName: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  signatureRole: {
    fontSize: 7,
    color: '#64748b',
    marginTop: 2,
  },
  footerText: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 7,
    color: '#94a3b8',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  }
});

interface AnnualReportProps {
  year: number;
  transactions: Transaction[];
  tasks: MaintenanceTask[];
  taskDefinitions: TaskDefinition[];
  commissionMembers: CommissionMember[];
  appName: string;
  isGuest?: boolean;
}

export const AnnualReport: React.FC<AnnualReportProps> = ({ 
  year, transactions, tasks, taskDefinitions, commissionMembers, appName, isGuest
}) => {
  const annualRevenue = (transactions || [])
    .filter(t => t.type === 'deposit' && new Date(t.date).getFullYear() === year)
    .reduce((acc, t) => acc + t.value, 0);
    
  const annualExpenses = (transactions || [])
    .filter(t => t.type === 'expense' && new Date(t.date).getFullYear() === year)
    .reduce((acc, t) => acc + t.value, 0);

  const revenueByCong = getRevenueByOrigin(transactions);
  const avg3 = calculateMovingAverage(transactions, 3);
  const avg6 = calculateMovingAverage(transactions, 6);
  const avg12 = calculateMovingAverage(transactions, 12);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Relatório Anual de Gestão - {year}</Text>
          <Text style={styles.subtitle}>Comissão de Funcionamento | Unidade: {appName}</Text>
          <Text style={{ fontSize: 7, color: '#94a3b8', marginTop: 10 }}>Emissão: {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</Text>
        </View>

        {/* Financial Analytics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Análise Financeira e Fluxo de Caixa</Text>
          <View style={styles.analyticsGrid}>
            <View style={styles.analyticsCard}>
              <Text style={styles.cardLabel}>Receita Total {year}</Text>
              <Text style={[styles.cardValue, { color: '#16a34a' }]}>
                R$ {annualRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.analyticsCard}>
              <Text style={styles.cardLabel}>Despesa Total {year}</Text>
              <Text style={[styles.cardValue, { color: '#dc2626' }]}>
                R$ {annualExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.analyticsCard}>
              <Text style={styles.cardLabel}>Saldo Líquido</Text>
              <Text style={styles.cardValue}>
                R$ {(annualRevenue - annualExpenses).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>

        {/* Revenue Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalhamento de Entradas por Unidade</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Unidade / Congregação</Text>
              <Text style={styles.tableCell}>Valor Acumulado (R$)</Text>
              <Text style={styles.tableCell}>% Participação</Text>
            </View>
            {Object.entries(revenueByCong || {}).map(([cong, val]) => (
              <View key={cong} style={styles.tableRow}>
                <Text style={styles.tableCell}>{cong}</Text>
                <Text style={styles.tableCell}>{val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                <Text style={styles.tableCell}>{annualRevenue > 0 ? ((val / annualRevenue) * 100).toFixed(1) + '%' : '0%'}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Moving Averages BI */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Médias Móveis de Gastos (Analytics)</Text>
          <View style={styles.analyticsGrid}>
            <View style={[styles.analyticsCard, { backgroundColor: '#f0f9ff' }]}>
              <Text style={styles.cardLabel}>Média 3 Meses</Text>
              <Text style={styles.cardValue}>R$ {avg3.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
            </View>
            <View style={[styles.analyticsCard, { backgroundColor: '#f0f9ff' }]}>
              <Text style={styles.cardLabel}>Média 6 Meses</Text>
              <Text style={styles.cardValue}>R$ {avg6.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
            </View>
            <View style={[styles.analyticsCard, { backgroundColor: '#f0f9ff' }]}>
              <Text style={styles.cardLabel}>Média 12 Meses</Text>
              <Text style={styles.cardValue}>R$ {avg12.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
            </View>
          </View>
        </View>

        {/* Operational Compliance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dashboard de Compliance Técnico (Manutenção)</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { flex: 2 }]}>Equipamento / Serviço</Text>
              <Text style={styles.tableCell}>Frequência</Text>
              <Text style={styles.tableCell}>Status</Text>
              <Text style={styles.tableCell}>Conclusão</Text>
            </View>
            { (taskDefinitions || []).map(def => {
              const doneCount = (tasks || []).filter(t => t.definitionId === def.id && t.year === year && t.status === 'completed').length;
              const percent = (doneCount / def.periodsPerYear) * 100;
              return (
                <View key={def.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{def.name}</Text>
                  <Text style={styles.tableCell}>{def.frequency}</Text>
                  <Text style={[styles.tableCell, { color: percent >= 100 ? '#16a34a' : '#ea580c', fontWeight: 'bold' }]}>
                    {percent >= 100 ? 'CONFORME' : `${doneCount}/${def.periodsPerYear}`}
                  </Text>
                  <Text style={styles.tableCell}>{percent.toFixed(0)}%</Text>
                </View>
              );
            })}
          </View>
        </View>

        {isGuest && (
          <View style={{ marginTop: 10, padding: 10, backgroundColor: '#fef2f2', borderLeftWidth: 3, borderLeftColor: '#ef4444' }}>
            <Text style={{ fontSize: 7, color: '#991b1b', fontWeight: 'bold' }}>
              AVISO: Dados podem estar errados favor verifique com um dos administradores que compõe a comissão de funcionamento.
            </Text>
          </View>
        )}

        {/* Signatures */}
        <View style={styles.signatureSection}>
          {(commissionMembers || []).map(m => (
            <View key={m.id} style={styles.signatureBox}>
              <Text style={styles.signatureName}>{m.name}</Text>
              <Text style={styles.signatureRole}>{m.role}</Text>
            </View>
          ))}
          {(commissionMembers || []).length === 0 && (
            <Text style={{ color: '#94a3b8', fontSize: 8, fontStyle: 'italic' }}>
              Nenhum membro da comissão cadastrado para assinar este documento.
            </Text>
          )}
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>
          Desenvolvido por Jaaziel Silva. Desenvolvedor Sênior. | JW Hub Maintenance v4.0
        </Text>
      </Page>
    </Document>
  );
};
