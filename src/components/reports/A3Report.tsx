import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { PanelTemplate, Team, AppSettings } from '../../types';

// ... (Font registration and styles remain same or similarly updated)

// Register a clean font
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
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Inter',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#0f172a',
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  teamCard: {
    width: '31%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  teamHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 8,
    marginBottom: 10,
  },
  teamName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  leaderText: {
    fontSize: 9,
    color: '#3b82f6',
    marginTop: 2,
  },
  managerText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#334155',
  },
  // Instruction Page Styles
  instructionTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 15,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  instructionText: {
    fontSize: 11,
    lineHeight: 1.5,
    color: '#334155',
    marginBottom: 6,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    backgroundColor: '#0f172a',
    borderRadius: 3,
    marginRight: 8,
    marginTop: 5,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 10,
  },
  columnContainer: {
    flexDirection: 'row',
    gap: 40,
  },
  column: {
    width: '45%',
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerIcon: {
    backgroundColor: '#475569',
    width: 60,
    height: 60,
    marginRight: 20,
  },
  headerTitleBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    paddingHorizontal: 20,
  },
  orangeLine: {
    height: 3,
    backgroundColor: '#f59e0b',
    width: '100%',
    marginTop: 4,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    padding: 4,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
  },
  groupNumber: {
    fontSize: 8,
    fontWeight: 'bold',
    width: 20,
  },
  memberName: {
    fontSize: 10,
    flex: 1,
  },
  customField: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  fieldLabel: {
    fontSize: 8,
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  }
});

export const A3Report: React.FC<{ panel: PanelTemplate; settings: AppSettings }> = ({ panel, settings }) => (
  <Document>
    <Page size="A3" orientation="landscape" style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{settings.appName}</Text>
          <Text style={styles.subtitle}>{panel.name} | {panel.description}</Text>
        </View>
        <Text style={{ fontSize: 10 }}>Documento Gerado em: {new Date().toLocaleDateString()}</Text>
      </View>

      <View style={styles.grid}>
        {panel.teams.map((team) => (
          <View key={team.id} style={[styles.teamCard, { borderLeftWidth: 4, borderLeftColor: team.color }]}>
            <View style={styles.teamHeader}>
              <Text style={styles.teamName}>{team.name}</Text>
              <Text style={styles.managerText}>H. CHAVE: {team.manager}</Text>
              <Text style={styles.leaderText}>LÍDER: {team.leader}</Text>
            </View>

            {team.groups.map((group, idx) => (
              <View key={group.id} style={styles.groupRow}>
                <Text style={styles.groupNumber}>{idx + 1}</Text>
                <Text style={styles.memberName}>{group.members[0].name}</Text>
                <Text style={{ fontSize: 10, width: 10, textAlign: 'center' }}>&</Text>
                <Text style={styles.memberName}>{group.members[1].name}</Text>
              </View>
            ))}

            <View style={{ marginTop: 10 }}>
              {team.customFields.map(field => (
                <View key={field.id} style={styles.customField}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <Text style={styles.fieldValue}>{field.value}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <View style={{ marginBottom: 4 }}>
          <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>AVISO: Dados podem estar errados favor verifique com um dos administradores que compõe a comissão de funcionamento.</Text>
        </View>
        <Text>GESTÃO DE MANUTENÇÃO - SISTEMA DE GESTÃO DE PAINÉIS PREVENTIVOS | CONFIDENCIAL</Text>
      </View>
    </Page>

    {/* Page 2: Instructions */}
    <Page size="A3" orientation="landscape" style={styles.page}>
      <View style={styles.instructionHeader}>
        <View style={styles.headerIcon} />
        <View style={styles.headerTitleBox}>
          <Text style={{ fontSize: 28, fontWeight: 'bold' }}>INSTRUÇÕES</Text>
          <View style={styles.orangeLine} />
        </View>
      </View>

      <View style={styles.columnContainer}>
        {/* Left Column */}
        <View style={styles.column}>
          <Text style={styles.sectionTitle}>MANUTENÇÕES ANUAIS</Text>
          <View style={styles.bulletRow}>
            <View style={styles.bulletPoint} />
            <Text style={styles.instructionText}>
              <Text style={{ fontWeight: 'bold' }}>Manutenção pré-Celebração:</Text> As fichas indicadas acima devem ser usadas para uma manutenção geral nas semanas que antecedem a Celebração. Essa manutenção deve ser agendada com antecedência para não interferir no discurso especial nem na distribuição dos convites. Esse também é um bom momento para realizar a pintura do prédio.
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <View style={styles.bulletPoint} />
            <Text style={styles.instructionText}>
              <Text style={{ fontWeight: 'bold' }}>Manutenção pós-congresso:</Text> Após o congresso, uma manutenção deve ser programada para realizar as fichas indicadas para esse período. Caso o congresso ocorra no início da série, não é necessário esperar até setembro.
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <View style={styles.bulletPoint} />
            <Text style={styles.instructionText}>
              Os eventos de manutenção devem ser anunciados com antecedência para criar expectativa nos publicadores, permitindo que eles se organizem para participar.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>FICHAS DE TRABALHO</Text>
          <View style={styles.bulletRow}>
            <View style={styles.bulletPoint} />
            <Text style={styles.instructionText}>As fichas de trabalho estão disponíveis no JW Hub. Elas devem ser usadas nos períodos indicados acima.</Text>
          </View>
          <View style={styles.bulletRow}>
            <View style={styles.bulletPoint} />
            <Text style={styles.instructionText}>Problemas ou necessidades de reparo encontrados durante a execução das atividades devem ser resolvidos o mais rápido possível.</Text>
          </View>
          <View style={styles.bulletRow}>
            <View style={styles.bulletPoint} />
            <Text style={styles.instructionText}>Algumas fichas específicas, como as de caixa d'água, calhas, beirais, estrutura do telhado, telhas e forro, não fazem parte do programa de manutenção regular. Elas serão realizadas a cada um ou dois anos, sob a orientação do treinador de manutenção (TM).</Text>
          </View>

          <Text style={styles.sectionTitle}>PROBLEMAS INESPERADOS</Text>
          <View style={styles.bulletRow}>
            <View style={styles.bulletPoint} />
            <Text style={styles.instructionText}>Problemas inesperados, como lâmpadas queimadas, consertos de itens e vazamentos, devem ser resolvidos ao longo do ano, assim que forem identificados. Essas correções não devem ser deixadas para os dois eventos de manutenção anual.</Text>
          </View>
          
          <Text style={styles.sectionTitle}>PINTURA</Text>
          <View style={styles.bulletRow}>
            <View style={styles.bulletPoint} />
            <Text style={styles.instructionText}>A pintura dos Salões do Reino dura, em média, de três a cinco anos, e deve ser renovada nesse período. No entanto, a pintura pode ser feita apenas nas áreas com maior desgaste. Não é preciso pintar o prédio inteiro, caso não haja necessidade.</Text>
          </View>
        </View>

        {/* Right Column */}
        <View style={styles.column}>
          <Text style={styles.sectionTitle}>SEGURANÇA</Text>
          <View style={styles.bulletRow}>
            <View style={styles.bulletPoint} />
            <Text style={styles.instructionText}>
              Para trabalhar com segurança, é essencial planejar as atividades com antecedência. No caso de trabalhos de alto risco, é preciso preencher o formulário DC-85 e enviar ao TM com, no mínimo, 15 dias de antecedência. Veja mais detalhes nos documentos S-283 e DC-82.
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <View style={styles.bulletPoint} />
            <Text style={styles.instructionText}>Como a manutenção pode envolver serviços elétricos, é importante verificar com antecedência quais irmãos estão capacitados para realizar esse tipo de atividade.</Text>
          </View>

          <Text style={styles.sectionTitle}>ALIMENTAÇÃO</Text>
          <View style={styles.bulletRow}>
            <View style={styles.bulletPoint} />
            <Text style={styles.instructionText}>Cada publicador deve cuidar de sua própria alimentação durante os eventos de manutenção. Os recursos da congregação não devem ser utilizados para esse fim.</Text>
          </View>

          <Text style={styles.sectionTitle}>ATIVIDADES DO MÊS DE JUNHO</Text>
          <View style={styles.bulletRow}>
            <View style={styles.bulletPoint} />
            <Text style={styles.instructionText}>
              <Text style={{ fontWeight: 'bold' }}>Revisão da previsão de gastos:</Text> Uma vez por ano, no mês de junho, deve-se revisar a previsão de gastos da congregação. O corpo de anciãos ou a Comissão de Funcionamento define um valor de saldo reserva com base nas despesas operacionais do Salão do Reino. Para mais instruções, consulte os documentos S-27b e S-42b.
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <View style={styles.bulletPoint} />
            <Text style={styles.instructionText}>
              <Text style={{ fontWeight: 'bold' }}>Ficha de trabalho - Ar-condicionado:</Text> As tarefas dessa ficha devem ser realizadas três vezes ao ano: na manutenção pré-Celebração, na manutenção pós-congresso e no mês de junho.
            </Text>
          </View>

          <View style={{ marginTop: 40, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 20 }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold' }}>
              Após a conclusão das atividades, o contato da manutenção deve registrar o andamento e a finalização das tarefas no JW Hub.
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text>INSTRUÇÕES OPERACIONAIS - PROGRAMA DE MANUTENÇÃO PREVENTIVA</Text>
      </View>
    </Page>
  </Document>
);
