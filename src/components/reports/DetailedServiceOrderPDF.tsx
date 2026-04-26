import React from 'react';
import { 
  Document, Page, Text, View, StyleSheet, 
  Font, Image 
} from '@react-pdf/renderer';
import { ServiceOrder } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Register Inter font for professional look
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf', fontWeight: 500 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Bold.ttf', fontWeight: 700 }
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Inter',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  logoContainer: {
    width: 120,
    borderWidth: 1,
    borderColor: '#000',
    padding: 5,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPlaceholder: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  headerPeriod: {
    fontSize: 8,
    marginTop: 2,
    color: '#333',
  },
  orangeTitle: {
    backgroundColor: '#FF6600',
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'black',
    padding: '4 8',
    textTransform: 'uppercase',
    marginTop: 10,
  },
  osNumberBox: {
    borderWidth: 1,
    borderColor: '#CCC',
    width: 120,
    marginVertical: 10,
    padding: '4 8',
    backgroundColor: '#F5F5F5',
  },
  osNumberLabel: {
    fontSize: 6,
    color: '#666',
  },
  osNumberValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  sectionHeader: {
    backgroundColor: '#FF6600',
    color: '#FFF',
    fontSize: 8,
    fontWeight: 'bold',
    padding: '3 6',
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  col: {
    flex: 1,
    padding: '4 6',
    borderRightWidth: 1,
    borderRightColor: '#EEE',
  },
  lastCol: {
    borderRightWidth: 0,
  },
  label: {
    fontSize: 6,
    color: '#666',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  value: {
    fontSize: 8,
    color: '#000',
  },
  table: {
    marginTop: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#EEE',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  tableHeaderCell: {
    padding: '4 6',
    fontSize: 7,
    fontWeight: 'bold',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#DDD',
  },
  tableRow: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#DDD',
  },
  tableCell: {
    padding: '4 6',
    fontSize: 7,
    borderRightWidth: 1,
    borderRightColor: '#DDD',
    textAlign: 'center',
  },
  statusLegend: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendColor: {
    width: 8,
    height: 8,
  },
  legendText: {
    fontSize: 7,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 7,
    color: '#666',
  }
});

interface DetailedServiceOrderPDFProps {
  os: ServiceOrder;
  logo?: string;
  osTitle?: string;
  osSubTitle?: string;
}

export const DetailedServiceOrderPDF: React.FC<DetailedServiceOrderPDFProps> = ({ os, logo, osTitle, osSubTitle }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          {logo ? (
            <Image src={logo} style={{ width: 80 }} />
          ) : (
            <Text style={styles.logoPlaceholder}>LOGO</Text>
          )}
        </View>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{osTitle || 'MODELO DE O.S. JW HUB - MANUTENÇÃO'}</Text>
          <Text style={styles.headerPeriod}>{osSubTitle || 'EMISSÃO DE FICHA DE TRABALHO TÉCNICO'}</Text>
        </View>
      </View>

      <Text style={styles.orangeTitle}>Ordem de Serviço</Text>
      <View style={styles.osNumberBox}>
        <Text style={styles.osNumberValue}>S - {(os?.id || '').slice(-6).toUpperCase()}</Text>
      </View>

      {/* Informações Gerais */}
      <View style={{ marginTop: 10 }}>
        <Text style={styles.sectionHeader}>Informações Gerais</Text>
        <View style={styles.row}>
          <View style={[styles.col, { flex: 2 }]}>
            <Text style={styles.label}>Filial:</Text>
            <Text style={styles.value}>{os.unit}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Solicitante:</Text>
            <Text style={styles.value}>{os.requester}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Responsável:</Text>
            <Text style={styles.value}>{os.responsible}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Setor Executante:</Text>
            <Text style={styles.value}>{os.executingSector}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Tipo de Manutenção:</Text>
            <Text style={styles.value}>{os.maintenanceType}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Centro de Custo:</Text>
            <Text style={styles.value}>{os.costCenter}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Conta Contábil:</Text>
            <Text style={styles.value}>{os.account}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Localização:</Text>
            <Text style={styles.value}>{os.location}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Fornecedor:</Text>
            <Text style={styles.value}>{os.provider}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Marca/Modelo:</Text>
            <Text style={styles.value}>{os.brandModel}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Nº de Série:</Text>
            <Text style={styles.value}>{os.serialNumber}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Cliente:</Text>
            <Text style={styles.value}>{os.client}</Text>
          </View>
        </View>
      </View>

      {/* Identificação do Ambiente */}
      <View style={{ marginTop: 15 }}>
        <Text style={styles.sectionHeader}>Identificação do Ambiente</Text>
        <View style={styles.row}>
          <View style={[styles.col, { flex: 2 }]}>
            <Text style={styles.label}>Nome (Edifício/Entidade):</Text>
            <Text style={styles.value}>{os.buildingName}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={[styles.col, { flex: 2 }]}>
            <Text style={styles.label}>Endereço:</Text>
            <Text style={styles.value}>{os.address}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Compl.:</Text>
            <Text style={styles.value}>{os.complement}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Bairro:</Text>
            <Text style={styles.value}>{os.neighborhood}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Cidade:</Text>
            <Text style={styles.value}>{os.city}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>UF:</Text>
            <Text style={styles.value}>{os.state}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>CEP:</Text>
            <Text style={styles.value}>{os.zipCode}</Text>
          </View>
        </View>
      </View>

      {/* Responsável Técnico */}
      <View style={{ marginTop: 15 }}>
        <Text style={styles.sectionHeader}>Responsável Técnico</Text>
        <View style={styles.row}>
          <View style={[styles.col, { flex: 2 }]}>
            <Text style={styles.label}>Nome/Razão Social:</Text>
            <Text style={styles.value}>{os.techName}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>CPF:</Text>
            <Text style={styles.value}>{os.techCpf}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Reg. Cons. Classe:</Text>
            <Text style={styles.value}>{os.techReg}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>ART/TRT O.S.:</Text>
            <Text style={styles.value}>{os.techArtOs}</Text>
          </View>
        </View>
      </View>

      {/* Serviço Solicitado */}
      <View style={{ marginTop: 15 }}>
        <Text style={styles.sectionHeader}>Serviço Solicitado</Text>
        <View style={[styles.row, { minHeight: 40 }]}>
          <View style={styles.col}>
            <Text style={styles.value}>{os.requestedService}</Text>
          </View>
        </View>
      </View>

      {/* Observações */}
      <View style={{ marginTop: 10 }}>
        <Text style={styles.sectionHeader}>Observações</Text>
        <View style={[styles.row, { minHeight: 40 }]}>
          <View style={styles.col}>
            <Text style={styles.value}>{os.observations}</Text>
          </View>
        </View>
      </View>

      {/* Table Section */}
      <View style={styles.table}>
        <View style={styles.statusLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#22C55E' }]} />
            <Text style={styles.legendText}>E = EXECUTADO</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#EAB308' }]} />
            <Text style={styles.legendText}>P = PENDENTE</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>N = NÃO EXECUTADO</Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: 15 }]}>E</Text>
          <Text style={[styles.tableHeaderCell, { width: 15 }]}>P</Text>
          <Text style={[styles.tableHeaderCell, { width: 15 }]}>N</Text>
          <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Descrição</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Serviço</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Material</Text>
          <Text style={[styles.tableHeaderCell, { width: 40 }]}>Prev.</Text>
          <Text style={[styles.tableHeaderCell, { width: 40 }]}>Real</Text>
        </View>

        {os.items.map((item, i) => (
          <View key={item.id} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#F9F9F9' }]}>
            <Text style={[styles.tableCell, { width: 15, fontWeight: 'bold' }]}>{item.status === 'E' ? 'X' : ''}</Text>
            <Text style={[styles.tableCell, { width: 15, fontWeight: 'bold' }]}>{item.status === 'P' ? 'X' : ''}</Text>
            <Text style={[styles.tableCell, { width: 15, fontWeight: 'bold' }]}>{item.status === 'N' ? 'X' : ''}</Text>
            <Text style={[styles.tableCell, { flex: 3, textAlign: 'left' }]}>{item.description}</Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>{item.service}</Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>{item.material}</Text>
            <Text style={[styles.tableCell, { width: 40 }]}>{item.prevValue}</Text>
            <Text style={[styles.tableCell, { width: 40 }]}>{item.realValue}</Text>
          </View>
        ))}

        {/* Fill empty lines for professional look */}
        {Array.from({ length: Math.max(0, 10 - os.items.length) }).map((_, i) => (
          <View key={`empty-${i}`} style={[styles.tableRow, { height: 18 }]} />
        ))}
      </View>

      <View style={styles.footer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 100, borderBottomWidth: 1, borderBottomColor: '#000', marginBottom: 5 }} />
          <Text style={styles.footerText}>Responsável Técnico</Text>
        </View>
        <Text style={styles.footerText}>Emitido em: {format(new Date(), "dd/MM/yyyy HH:mm:ss")}</Text>
      </View>
    </Page>
  </Document>
);
