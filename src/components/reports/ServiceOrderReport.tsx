import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { Team, AppSettings, TaskDefinition } from '../../types';

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
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#0f172a',
    paddingBottom: 15,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  osBadge: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    padding: '4 8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    backgroundColor: '#f1f5f9',
    padding: '4 8',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  infoItem: {
    width: '45%',
  },
  infoLabel: {
    fontSize: 8,
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  technicalContent: {
    marginTop: 10,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 4,
  },
  stepNumber: {
    width: 25,
    fontWeight: 'bold',
    color: '#64748b',
  },
  stepText: {
    flex: 1,
  },
  safetyBanner: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fdba74',
    padding: 10,
    marginTop: 20,
  },
  safetyTitle: {
    color: '#c2410c',
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
  }
});

interface ServiceOrderReportProps {
  team: Team;
  settings: AppSettings;
  task: TaskDefinition;
}

export const ServiceOrderReport: React.FC<ServiceOrderReportProps> = ({ team, settings, task }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={{ fontSize: 10, color: '#64748b' }}>{settings.appName}</Text>
          <Text style={styles.title}>Ordem de Serviço Técnica</Text>
        </View>
        <View style={styles.osBadge}>
          <Text>OS-2026-{(team?.id || '').substring(0, 4).toUpperCase()}</Text>
        </View>
      </View>

      {/* Team Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados da Execução</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Equipe Designada</Text>
            <Text style={styles.infoValue}>{team.name}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Homem Chave (Gestão)</Text>
            <Text style={styles.infoValue}>{team.manager}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Líder de Equipe</Text>
            <Text style={styles.infoValue}>{team.leader}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Frequência de Manutenção</Text>
            <Text style={styles.infoValue}>{task.frequency}</Text>
          </View>
        </View>
      </View>

      {/* Technical Steps */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instruções de Manutenção: {task.name}</Text>
        <View style={styles.technicalContent}>
          {task.steps.map((step, idx) => (
            <View key={idx} style={styles.stepRow}>
              <Text style={styles.stepNumber}>{String(idx + 1).padStart(2, '0')}</Text>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </View>

       {/* Groups */}
       <View style={styles.section}>
        <Text style={styles.sectionTitle}>Membros da Equipe</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {team.groups.map((group, idx) => (
            <View key={group.id} style={{ width: '48%', padding: 5, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
              <Text style={{ fontSize: 9 }}>Dupla {idx + 1}: {group.members[0].name} & {group.members[1].name}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Safety */}
      <View style={styles.safetyBanner}>
        <Text style={styles.safetyTitle}>PROCEDIMENTOS DE SEGURANÇA E EPIs</Text>
        {task.safety.map((item, idx) => (
          <Text key={idx} style={{ fontSize: 8, marginBottom: 2 }}>• {item}</Text>
        ))}
      </View>

      {/* Signatures */}
      <View style={{ marginTop: 40, flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ width: '45%', borderTopWidth: 1, borderTopColor: '#000', paddingTop: 5, textAlign: 'center' }}>
          <Text style={{ fontSize: 8 }}>Visto Homem-Chave</Text>
        </View>
        <View style={{ width: '45%', borderTopWidth: 1, borderTopColor: '#000', paddingTop: 5, textAlign: 'center' }}>
          <Text style={{ fontSize: 8 }}>Visto Líder de Equipe</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={{ marginBottom: 4 }}>
          <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>AVISO: Dados podem estar errados favor verifique com um dos administradores que compõe a comissão de funcionamento.</Text>
        </View>
        <Text>Gerado pelo sistema GESTÃO DE MANUTENÇÃO | {new Date().toLocaleDateString()}</Text>
      </View>
    </Page>
  </Document>
);
