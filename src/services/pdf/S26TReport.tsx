import React from 'react';
import { 
  Document, Page, Text, View, StyleSheet, 
  Font, Image 
} from '@react-pdf/renderer';
import { Transaction, AppSettings } from '../../types';
import { format, parse, startOfMonth, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Register stable Inter fonts for production PDF stability
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Italic.ttf', fontWeight: 400, fontStyle: 'italic' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf', fontWeight: 700 }
  ],
});

const styles = StyleSheet.create({
  page: { 
    padding: 30, 
    backgroundColor: '#FFFFFF', 
    fontFamily: 'Inter',
    fontSize: 10
  },
  header: { 
    marginBottom: 10, 
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline'
  },
  title: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    textTransform: 'uppercase',
    marginBottom: 10
  },
  metaGrid: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 5,
    marginBottom: 10,
    gap: 10
  },
  metaItem: {
    flex: 1,
    fontSize: 8
  },
  metaLabel: {
    fontSize: 7,
    color: '#666',
    marginBottom: 2
  },

  // Table Styles
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#fff',
    minHeight: 25,
    alignItems: 'center',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 7
  },
  headerMain: {
    flexDirection: 'column',
    justifyContent: 'center',
    height: '100%',
    borderRightWidth: 1,
    borderColor: '#000'
  },
  tableRow: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    minHeight: 18,
    alignItems: 'center',
    fontSize: 7
  },
  
  colData: { width: '8%', textAlign: 'center', borderRightWidth: 1, height: '100%', justifyContent: 'center' },
  colDesc: { width: '30%', paddingLeft: 4, borderRightWidth: 1, height: '100%', justifyContent: 'center' },
  colS: { width: '4%', textAlign: 'center', borderRightWidth: 1, height: '100%', justifyContent: 'center' },
  
  colTripleGroup: { width: '58%', flexDirection: 'column' },
  colTripleHeaders: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000', height: 12, alignItems: 'center' },
  colTripleActual: { flexDirection: 'row', flex: 1 },
  
  colVal: { flex: 1, textAlign: 'right', paddingRight: 4, height: '100%', justifyContent: 'center' },
  colValBorder: { borderRightWidth: 1 },

  // Summary / Reconciliation Styles
  summaryHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    padding: 2,
    marginTop: 15,
    textTransform: 'uppercase'
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10
  },
  summaryCol: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#000',
    padding: 10
  },
  summarySectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 2
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    fontSize: 9
  },
  summaryTotal: {
    marginTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 5,
    fontWeight: 'bold',
    fontSize: 10
  },
  confrontoTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'uppercase'
  }
});

interface Props {
  monthRef: string; // MM/YYYY
  transactions: Transaction[];
  settings: AppSettings;
}

export const S26TReport: React.FC<Props> = ({ monthRef, transactions, settings }) => {
  const currentMonthDate = parse(monthRef, 'MM/yyyy', new Date());
  const monthStart = startOfMonth(currentMonthDate);
  
  const balanceBefore = transactions
    .filter(t => isBefore(new Date(t.date), monthStart))
    .reduce((acc, t) => t.type === 'deposit' ? acc + t.value : acc - t.value, 0);

  const monthTxs = transactions.filter(t => t.monthReference === monthRef)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const getSubTotal = (type: 'deposit' | 'expense', account: 'Donativos' | 'Banco/Cofre' | 'Outra') => {
    return monthTxs.filter(t => t.type === type && t.accountType === account).reduce((acc, t) => acc + t.value, 0);
  };

  const totals = {
    donations: { in: getSubTotal('deposit', 'Donativos'), out: getSubTotal('expense', 'Donativos') },
    bank: { in: getSubTotal('deposit', 'Banco/Cofre'), out: getSubTotal('expense', 'Banco/Cofre') },
    other: { in: getSubTotal('deposit', 'Outra'), out: getSubTotal('expense', 'Outra') }
  };

  const finalBalances = {
    donations: totals.donations.in - totals.donations.out,
    bank: totals.bank.in - totals.bank.out,
    other: totals.other.in - totals.other.out
  };

  const totalFinalBalance = finalBalances.donations + finalBalances.bank + finalBalances.other;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={{ fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase' }}>Extrato de Lançamentos</Text>
            <Text style={{ fontSize: 8, color: '#666' }}>Documento de Referência S-26-T</Text>
          </View>
          <View>
            <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{settings.appName}</Text>
            <Text style={{ fontSize: 8, textAlign: 'right' }}>Mês: {monthRef}</Text>
          </View>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Circuito</Text>
            <Text style={{ fontWeight: 'bold' }}>BA-71</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Data de Emissão</Text>
            <Text style={{ fontWeight: 'bold' }}>{format(new Date(), 'dd/MM/yyyy HH:mm')}</Text>
          </View>
          <View style={styles.metaItem}>
             <Text style={styles.metaLabel}>Saldo Anterior</Text>
             <Text style={{ fontWeight: 'bold' }}>R$ {balanceBefore.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableHeader, { backgroundColor: '#f0f4f8' }]}>
            <View style={{ width: '12%', borderRightWidth: 1, borderColor: '#000', padding: 4 }}><Text>DATA</Text></View>
            <View style={{ width: '40%', borderRightWidth: 1, borderColor: '#000', padding: 4 }}><Text>DESCRIÇÃO</Text></View>
            <View style={{ width: '18%', borderRightWidth: 1, borderColor: '#000', padding: 4 }}><Text>ORIGEM</Text></View>
            <View style={{ width: '15%', borderRightWidth: 1, borderColor: '#000', padding: 4 }}><Text>ENTRADA</Text></View>
            <View style={{ width: '15%', padding: 4 }}><Text>SAÍDA</Text></View>
          </View>

          {monthTxs.map(t => (
            <View key={t.id} style={styles.tableRow}>
              <View style={{ width: '12%', borderRightWidth: 1, borderColor: '#000', padding: 4 }}><Text>{format(new Date(t.date), 'dd/MM/yy')}</Text></View>
              <View style={{ width: '40%', borderRightWidth: 1, borderColor: '#000', padding: 4 }}><Text>{t.description}</Text></View>
              <View style={{ width: '18%', borderRightWidth: 1, borderColor: '#000', padding: 4 }}><Text>{t.origin || '-'}</Text></View>
              <View style={{ width: '15%', borderRightWidth: 1, borderColor: '#000', padding: 4, textAlign: 'right' }}>
                <Text style={{ color: '#16a34a' }}>{t.type === 'deposit' ? t.value.toFixed(2) : ''}</Text>
              </View>
              <View style={{ width: '15%', padding: 4, textAlign: 'right' }}>
                <Text style={{ color: '#dc2626' }}>{t.type === 'expense' ? t.value.toFixed(2) : ''}</Text>
              </View>
            </View>
          ))}
          
          <View style={[styles.tableRow, { backgroundColor: '#f9fafb', fontWeight: 'bold' }]}>
            <View style={{ width: '70%', padding: 4, textAlign: 'right' }}><Text>TOTAIS DO MÊS:</Text></View>
            <View style={{ width: '15%', borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#000', padding: 4, textAlign: 'right' }}>
               <Text>R$ {(totals.donations.in + totals.bank.in + totals.other.in).toFixed(2)}</Text>
            </View>
            <View style={{ width: '15%', padding: 4, textAlign: 'right' }}>
               <Text>R$ {(totals.donations.out + totals.bank.out + totals.other.out).toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 20, padding: 10, borderTopWidth: 1 }}>
           <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold' }}>SALDO EM CONTA NO FINAL DO PERÍODO:</Text>
              <Text style={{ fontSize: 10, fontWeight: 'bold' }}>R$ {totalFinalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
           </View>
        </View>

        <View style={{ marginTop: 10, padding: 10, backgroundColor: '#fef2f2', borderLeftWidth: 3, borderLeftColor: '#ef4444' }}>
          <Text style={{ fontSize: 7, color: '#991b1b', fontWeight: 'bold' }}>
            AVISO: Dados podem estar errados favor verifique com um dos administradores que compõe a comissão de funcionamento.
          </Text>
        </View>

        <View style={{ marginTop: 50, flexDirection: 'row', justifyContent: 'space-around' }}>
          <View style={{ width: '40%', borderTopWidth: 1, paddingTop: 5, textAlign: 'center' }}>
            <Text style={{ fontSize: 8 }}>Visto Coordenador da Comissão</Text>
          </View>
          <View style={{ width: '40%', borderTopWidth: 1, paddingTop: 5, textAlign: 'center' }}>
            <Text style={{ fontSize: 8 }}>Visto Servo de Contas</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
