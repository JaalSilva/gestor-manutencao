import React from 'react';
import { 
  Document, Page, Text, View, StyleSheet, 
  Font, Image, PDFDownloadLink 
} from '@react-pdf/renderer';
import { TaskDefinition, MaintenanceTask, Member } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Registrar fontes para visual profissional
// Register stable Inter fonts for production PDF stability
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf', fontWeight: 700 }
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Inter',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#0F172A',
    paddingBottom: 20,
    marginBottom: 30,
  },
  unitInfo: {
    flexDirection: 'column',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
    fontWeight: 'semibold',
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 1,
    backgroundColor: '#F8FAF2',
    padding: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#0F172A',
    marginBottom: 10,
  },
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 20,
  },
  infoItem: {
    flex: 1,
  },
  label: {
    fontSize: 8,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  value: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: 'semibold',
  },
  technicalBlock: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  procedureItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    width: 12,
    fontSize: 10,
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  procedureText: {
    flex: 1,
    fontSize: 10,
    color: '#475569',
    lineHeight: 1.4,
  },
  safetyBadge: {
    backgroundColor: '#FEF2F2',
    color: '#B91C1C',
    fontSize: 9,
    padding: '4 8',
    borderRadius: 4,
    marginBottom: 6,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#94A3B8',
  },
  signatureBox: {
    width: 150,
    borderTopWidth: 1,
    borderTopColor: '#0F172A',
    marginTop: 20,
    textAlign: 'center',
    paddingTop: 5,
  },
  signatureText: {
    fontSize: 8,
    color: '#0F172A',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  }
});

interface ServiceOrderPDFProps {
  unitName: string;
  task: TaskDefinition;
  teamName: string;
  members: string[];
  date: string;
}

export const ServiceOrderPDF: React.FC<ServiceOrderPDFProps> = ({ 
  unitName, task, teamName, members, date 
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.unitInfo}>
          <Text style={styles.title}>{unitName}</Text>
          <Text style={styles.subtitle}>Sistema de Gestão de Manutenção Preventiva</Text>
        </View>
        <View style={{ textAlign: 'right' }}>
          <Text style={styles.label}>Ordem de Serviço Nº</Text>
          <Text style={styles.value}>OS-{Date.now().toString().slice(-6)}</Text>
        </View>
      </View>

      {/* Basic Info */}
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Text style={styles.label}>Atividade</Text>
          <Text style={styles.value}>{task.name}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.label}>Equipe Designada</Text>
          <Text style={styles.value}>{teamName}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.label}>Data da Execução</Text>
          <Text style={styles.value}>{format(new Date(date), 'dd/MM/yyyy')}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Equipe Técnica (Membros)</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {members.map((m, i) => (
            <Text key={i} style={[styles.value, { fontSize: 10, backgroundColor: '#F1F5F9', padding: '4 8', borderRadius: 4 }]}>
              {m}
            </Text>
          ))}
        </View>
      </View>

      {/* Safety Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>EPIs e Segurança (Obrigatório)</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {task.safety.map((s, i) => (
            <Text key={i} style={styles.safetyBadge}>• {s}</Text>
          ))}
        </View>
      </View>

      {/* Procedures */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Procedimentos Técnicos / Checklist</Text>
        <View style={styles.technicalBlock}>
          {task.steps.map((step, i) => (
            <View key={i} style={styles.procedureItem}>
              <Text style={styles.bullet}>[ ]</Text>
              <Text style={styles.procedureText}>{step}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Observations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Observações de Campo</Text>
        <View style={[styles.technicalBlock, { height: 80 }]} />
      </View>

      {/* Signatures */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 40 }}>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureText}>Líder de Equipe</Text>
        </View>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureText}>Homem-Chave / Responsável</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Gerado em {format(new Date(), "dd/MM/yyyy HH:mm")}</Text>
        <Text style={styles.footerText}>Documento Técnico Operacional - JW Hub Maintenance</Text>
      </View>
    </Page>
  </Document>
);
