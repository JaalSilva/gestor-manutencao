import React from 'react';
import { 
  Document, Page, Text, View, StyleSheet, 
  Font
} from '@react-pdf/renderer';
import { CalendarEvent, AppSettings } from '../../types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
    fontSize: 10,
    color: '#334155',
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#0f172a',
    paddingBottom: 15,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  eventBox: {
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  eventTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
    textTransform: 'uppercase',
  },
  eventMeta: {
    fontSize: 8,
    color: '#64748b',
    flexDirection: 'row',
    gap: 10,
  },
  description: {
    fontSize: 9,
    marginTop: 5,
    color: '#475569',
    fontStyle: 'italic',
  },
  warningBox: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#fef2f2',
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  warningText: {
    fontSize: 8,
    color: '#991b1b',
    fontWeight: 'bold',
  },
  footer: {
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

interface Props {
  events: CalendarEvent[];
  monthName: string;
  settings: AppSettings;
  isGuest?: boolean;
}

export const AgendaReport: React.FC<Props> = ({ events, monthName, settings, isGuest }) => {
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = new Date(a.date + 'T' + a.startTime).getTime();
    const dateB = new Date(b.date + 'T' + b.startTime).getTime();
    return dateA - dateB;
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Cronograma de Atividades - {monthName}</Text>
          <Text style={styles.subtitle}>{settings.appName} | Gestão de Manutenção</Text>
        </View>

        {sortedEvents.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 50, color: '#94a3b8' }}>Nenhuma atividade agendada para este período.</Text>
        ) : (
          sortedEvents.map(evt => (
            <View key={evt.id} style={styles.eventBox}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventTitle}>{evt.title}</Text>
                <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{format(parseISO(evt.date), 'dd/MM/yyyy')}</Text>
              </View>
              <View style={styles.eventMeta}>
                <Text>Início: {evt.startTime}</Text>
                {evt.location && <Text>Local: {evt.location}</Text>}
                <Text>Tipo: {evt.type.toUpperCase()}</Text>
              </View>
              {evt.description && (
                <Text style={styles.description}>{evt.description}</Text>
              )}
            </View>
          ))
        )}
        
        {isGuest && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              Dados podem estar errados favor verifique com um dos administradores que compõe a comissão de funcionamento.
            </Text>
          </View>
        )}

        <Text style={styles.footer}>
          Documento gerado automaticamente pelo sistema de GESTÃO DE MANUTENÇÃO.
        </Text>
      </Page>
    </Document>
  );
};
